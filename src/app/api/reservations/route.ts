import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { reservationCreateSchema } from '@/lib/validations'
import { addMinutes, eachDayOfInterval } from 'date-fns'

// POST /api/reservations - Create reservation (PENDING)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validated = reservationCreateSchema.parse(body)

    const checkInDate = new Date(validated.checkInDate)
    const checkOutDate = new Date(validated.checkOutDate)
    const dates = eachDayOfInterval({ start: checkInDate, end: addMinutes(checkOutDate, -1) })

    // Check availability (without locking)
    const inventories = await prisma.roomTypeInventory.findMany({
      where: {
        hotelId: validated.hotelId,
        roomTypeId: validated.roomTypeId,
        date: {
          gte: checkInDate,
          lt: checkOutDate,
        },
      },
    })

    // Check if we have inventory for all dates
    if (inventories.length !== dates.length) {
      return NextResponse.json(
        { 
          error: { 
            code: 'MISSING_INVENTORY', 
            message: 'Inventory data not available for all dates' 
          } 
        },
        { status: 409 }
      )
    }

    // Check if all dates have sufficient availability
    const hasAvailability = inventories.every(inv => 
      (inv.totalInventory - inv.totalReserved) >= validated.numberOfRooms
    )

    if (!hasAvailability) {
      const unavailableDates = inventories
        .filter(inv => (inv.totalInventory - inv.totalReserved) < validated.numberOfRooms)
        .map(inv => inv.date.toISOString().split('T')[0])

      return NextResponse.json(
        { 
          error: { 
            code: 'ROOM_UNAVAILABLE', 
            message: 'Insufficient rooms available for requested dates',
            details: {
              unavailableDates,
              roomsAvailable: Math.min(...inventories.map(inv => inv.totalInventory - inv.totalReserved)),
              requested: validated.numberOfRooms,
            }
          } 
        },
        { status: 409 }
      )
    }

    // Get pricing
    const prices = await prisma.roomPrice.findMany({
      where: {
        hotelId: validated.hotelId,
        roomTypeId: validated.roomTypeId,
        date: {
          gte: checkInDate,
          lt: checkOutDate,
        },
      },
    })

    const totalPrice = prices.reduce((sum, p) => sum + Number(p.price), 0) * validated.numberOfRooms

    // Find or create guest
    let guest = await prisma.guest.findUnique({
      where: { email: validated.guest.email },
    })

    if (!guest) {
      guest = await prisma.guest.create({
        data: {
          firstName: validated.guest.firstName,
          lastName: validated.guest.lastName,
          email: validated.guest.email,
          phone: validated.guest.phone,
        },
      })
    }

    // Create reservation with PENDING status
    const reservation = await prisma.reservation.create({
      data: {
        guestId: guest.id,
        hotelId: validated.hotelId,
        roomTypeId: validated.roomTypeId,
        checkInDate,
        checkOutDate,
        numberOfRooms: validated.numberOfRooms,
        status: 'PENDING',
        totalPrice,
        currency: 'USD',
        specialRequests: validated.specialRequests,
        expiresAt: addMinutes(new Date(), 15), // Hold for 15 minutes
      },
    })

    // Fetch hotel and room type info
    const hotel = await prisma.hotel.findUnique({ where: { id: validated.hotelId } })
    const roomType = await prisma.roomType.findUnique({ where: { id: validated.roomTypeId } })

    return NextResponse.json({
      data: {
        reservationId: reservation.id,
        status: reservation.status,
        hotel: {
          id: hotel?.id,
          name: hotel?.name,
          address: hotel?.address,
        },
        roomType: {
          id: roomType?.id,
          name: roomType?.name,
        },
        checkInDate: reservation.checkInDate.toISOString().split('T')[0],
        checkOutDate: reservation.checkOutDate.toISOString().split('T')[0],
        numberOfRooms: reservation.numberOfRooms,
        numberOfNights: dates.length,
        guest: {
          firstName: guest.firstName,
          lastName: guest.lastName,
          email: guest.email,
        },
        pricing: {
          pricePerNight: Math.round(totalPrice / dates.length / validated.numberOfRooms),
          roomSubtotal: Number(totalPrice),
          taxesAndFees: Math.round(Number(totalPrice) * 0.11), // 11% tax
          total: Math.round(Number(totalPrice) * 1.11),
          currency: 'USD',
        },
        expiresAt: reservation.expiresAt?.toISOString(),
      },
    }, { status: 201 })
  } catch (error) {
    console.error('Create reservation error:', error)
    
    if (error instanceof Error && 'name' in error && error.name === 'ZodError') {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: 'Invalid request data', details: error } },
        { status: 422 }
      )
    }

    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'An error occurred while creating reservation' } },
      { status: 500 }
    )
  }
}

// GET /api/reservations - List reservations by email
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const email = searchParams.get('email')

    if (!email) {
      return NextResponse.json(
        { error: { code: 'MISSING_EMAIL', message: 'Email parameter is required' } },
        { status: 400 }
      )
    }

    const guest = await prisma.guest.findUnique({
      where: { email },
    })

    if (!guest) {
      return NextResponse.json({ data: [] })
    }

    const reservations = await prisma.reservation.findMany({
      where: { guestId: guest.id },
      include: {
        hotel: true,
        roomType: true,
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({
      data: reservations.map(r => ({
        reservationId: r.id,
        confirmationNumber: `BK-${r.id.slice(0, 6).toUpperCase()}`,
        status: r.status,
        hotel: {
          name: r.hotel.name,
          city: r.hotel.city,
        },
        roomType: {
          name: r.roomType.name,
        },
        checkInDate: r.checkInDate.toISOString().split('T')[0],
        checkOutDate: r.checkOutDate.toISOString().split('T')[0],
        numberOfRooms: r.numberOfRooms,
        totalPrice: Number(r.totalPrice),
        currency: r.currency,
        createdAt: r.createdAt.toISOString(),
      })),
    })
  } catch (error) {
    console.error('List reservations error:', error)
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'An error occurred' } },
      { status: 500 }
    )
  }
}

