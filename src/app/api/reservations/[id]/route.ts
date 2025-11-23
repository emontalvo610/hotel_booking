import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/reservations/[id] - Get reservation details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const searchParams = request.nextUrl.searchParams
    const email = searchParams.get('email')

    const reservation = await prisma.reservation.findUnique({
      where: { id },
      include: {
        guest: true,
        hotel: true,
        roomType: true,
        payments: true,
      },
    })

    if (!reservation) {
      return NextResponse.json(
        { error: { code: 'RESERVATION_NOT_FOUND', message: 'Reservation not found' } },
        { status: 404 }
      )
    }

    // Verify email if provided (for unauthenticated access)
    if (email && reservation.guest.email !== email) {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: 'Unauthorized access' } },
        { status: 401 }
      )
    }

    return NextResponse.json({
      data: {
        reservationId: reservation.id,
        confirmationNumber: `BK-${reservation.id.slice(0, 6).toUpperCase()}`,
        status: reservation.status,
        hotel: {
          id: reservation.hotel.id,
          name: reservation.hotel.name,
          address: reservation.hotel.address,
          city: reservation.hotel.city,
          state: reservation.hotel.state,
          country: reservation.hotel.country,
          phone: reservation.hotel.phone,
        },
        roomType: {
          name: reservation.roomType.name,
          bedType: reservation.roomType.bedType,
          maxOccupancy: reservation.roomType.maxOccupancy,
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
          phone: reservation.guest.phone,
        },
        payment: reservation.payments[0] ? {
          amount: Number(reservation.payments[0].amount),
          currency: reservation.payments[0].currency,
          method: reservation.payments[0].paymentMethod,
          status: reservation.payments[0].status,
        } : null,
        totalPrice: Number(reservation.totalPrice),
        currency: reservation.currency,
        specialRequests: reservation.specialRequests,
        createdAt: reservation.createdAt.toISOString(),
      },
    })
  } catch (error) {
    console.error('Get reservation error:', error)
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'An error occurred' } },
      { status: 500 }
    )
  }
}

