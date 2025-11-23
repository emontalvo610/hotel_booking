import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { reservationConfirmSchema } from '@/lib/validations'
import { Prisma } from '@prisma/client'

// POST /api/reservations/[id]/confirm - Confirm reservation (PAID)
// This implements the two-phase booking with pessimistic locking
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const validated = reservationConfirmSchema.parse(body)
    
    // Get idempotency key from header
    const idempotencyKey = request.headers.get('idempotency-key') || undefined

    // Check idempotency - if this request was already processed, return cached result
    if (idempotencyKey) {
      const existingReservation = await prisma.reservation.findUnique({
        where: { idempotencyKey },
      })

      if (existingReservation && existingReservation.status === 'PAID') {
        return NextResponse.json({
          data: {
            reservationId: existingReservation.id,
            confirmationNumber: `BK-${existingReservation.id.slice(0, 6).toUpperCase()}`,
            status: existingReservation.status,
            message: 'Reservation already confirmed (idempotent response)',
          },
        })
      }
    }

    // Get reservation
    const reservation = await prisma.reservation.findUnique({
      where: { id },
      include: { hotel: true, roomType: true, guest: true },
    })

    if (!reservation) {
      return NextResponse.json(
        { error: { code: 'RESERVATION_NOT_FOUND', message: 'Reservation not found' } },
        { status: 404 }
      )
    }

    // Check if reservation is still pending
    if (reservation.status !== 'PENDING') {
      return NextResponse.json(
        { 
          error: { 
            code: 'RESERVATION_ALREADY_CONFIRMED', 
            message: 'Reservation has already been confirmed',
            details: {
              reservationId: reservation.id,
              status: reservation.status,
            }
          } 
        },
        { status: 409 }
      )
    }

    // Check if reservation has expired
    if (reservation.expiresAt && reservation.expiresAt < new Date()) {
      return NextResponse.json(
        { 
          error: { 
            code: 'RESERVATION_EXPIRED', 
            message: 'Reservation has expired. Please create a new reservation.',
            details: {
              expiresAt: reservation.expiresAt.toISOString(),
            }
          } 
        },
        { status: 410 }
      )
    }

    // Simulate payment processing (in production, call Stripe/PayPal API)
    // For MVP, we'll just simulate success
    const paymentSuccess = true
    const paymentProviderTransactionId = `mock_${Date.now()}_${Math.random().toString(36).substring(7)}`

    if (!paymentSuccess) {
      return NextResponse.json(
        { 
          error: { 
            code: 'PAYMENT_FAILED', 
            message: 'Payment could not be processed',
            details: {
              reason: 'card_declined',
            }
          } 
        },
        { status: 402 }
      )
    }

    // ⭐ CRITICAL: Two-phase booking with pessimistic locking ⭐
    // This transaction prevents double booking
    const result = await prisma.$transaction(async (tx) => {
      // Step 1: Lock inventory rows (FOR UPDATE equivalent in Prisma)
      // This blocks other transactions from reading/updating these rows
      const inventories = await tx.$queryRaw<Array<{
        hotel_id: string
        room_type_id: string
        date: Date
        total_inventory: number
        total_reserved: number
      }>>`
        SELECT hotel_id, room_type_id, date, total_inventory, total_reserved
        FROM room_type_inventory
        WHERE hotel_id = ${reservation.hotelId}::uuid
          AND room_type_id = ${reservation.roomTypeId}::uuid
          AND date >= ${reservation.checkInDate}
          AND date < ${reservation.checkOutDate}
        FOR UPDATE
      `

      // Step 2: Check availability (now that we have the lock)
      const hasAvailability = inventories.every(inv => 
        (inv.total_inventory - inv.total_reserved) >= reservation.numberOfRooms
      )

      if (!hasAvailability) {
        throw new Error('ROOM_UNAVAILABLE')
      }

      // Step 3: Update inventory (increment reserved count)
      await tx.$executeRaw`
        UPDATE room_type_inventory
        SET total_reserved = total_reserved + ${reservation.numberOfRooms},
            version = version + 1,
            updated_at = NOW()
        WHERE hotel_id = ${reservation.hotelId}::uuid
          AND room_type_id = ${reservation.roomTypeId}::uuid
          AND date >= ${reservation.checkInDate}
          AND date < ${reservation.checkOutDate}
      `

      // Step 4: Update reservation status to PAID
      const updatedReservation = await tx.reservation.update({
        where: { id: reservation.id },
        data: {
          status: 'PAID',
          idempotencyKey,
        },
      })

      // Step 5: Create payment record
      const payment = await tx.payment.create({
        data: {
          reservationId: reservation.id,
          amount: reservation.totalPrice,
          currency: reservation.currency,
          status: 'SUCCEEDED',
          paymentMethod: validated.paymentMethod.type,
          paymentProvider: 'mock', // In production: 'stripe', 'paypal', etc.
          providerTransactionId: paymentProviderTransactionId,
        },
      })

      return { reservation: updatedReservation, payment }
    }, {
      isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
      timeout: 10000, // 10 seconds timeout
    })

    // Success! Reservation confirmed
    return NextResponse.json({
      data: {
        reservationId: result.reservation.id,
        confirmationNumber: `BK-${result.reservation.id.slice(0, 6).toUpperCase()}`,
        status: result.reservation.status,
        hotel: {
          id: reservation.hotel.id,
          name: reservation.hotel.name,
          address: reservation.hotel.address,
          phone: reservation.hotel.phone,
        },
        roomType: {
          name: reservation.roomType.name,
        },
        checkInDate: reservation.checkInDate.toISOString().split('T')[0],
        checkInTime: reservation.hotel.checkInTime,
        checkOutDate: reservation.checkOutDate.toISOString().split('T')[0],
        checkOutTime: reservation.hotel.checkOutTime,
        numberOfRooms: reservation.numberOfRooms,
        guest: {
          firstName: reservation.guest.firstName,
          lastName: reservation.guest.lastName,
          email: reservation.guest.email,
        },
        payment: {
          amount: Number(result.payment.amount),
          currency: result.payment.currency,
          method: result.payment.paymentMethod,
          status: result.payment.status,
          paidAt: result.payment.createdAt.toISOString(),
        },
        confirmedAt: result.reservation.updatedAt.toISOString(),
      },
    })
  } catch (error: any) {
    console.error('Confirm reservation error:', error)

    // Handle specific error cases
    if (error.message === 'ROOM_UNAVAILABLE') {
      return NextResponse.json(
        { 
          error: { 
            code: 'ROOM_UNAVAILABLE', 
            message: 'Room was just booked by another guest. Please search again.',
          } 
        },
        { status: 409 }
      )
    }
    
    if (error instanceof Error && 'name' in error && error.name === 'ZodError') {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: 'Invalid request data', details: error } },
        { status: 422 }
      )
    }

    // Check for database constraint violation (overbooking attempt)
    if (error.code === 'P2034' || error.message?.includes('check_room_count')) {
      return NextResponse.json(
        { 
          error: { 
            code: 'OVERBOOKING_PREVENTED', 
            message: 'Cannot complete booking - room sold out',
          } 
        },
        { status: 409 }
      )
    }

    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'An error occurred while confirming reservation' } },
      { status: 500 }
    )
  }
}

