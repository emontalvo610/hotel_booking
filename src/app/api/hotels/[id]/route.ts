import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { eachDayOfInterval } from 'date-fns'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const searchParams = request.nextUrl.searchParams
    
    const checkIn = searchParams.get('checkIn')
    const checkOut = searchParams.get('checkOut')
    const rooms = parseInt(searchParams.get('rooms') || '1')

    // Fetch hotel with room types
    const hotel = await prisma.hotel.findUnique({
      where: { id },
      include: {
        roomTypes: {
          where: { isActive: true },
        },
      },
    })

    if (!hotel) {
      return NextResponse.json(
        { error: { code: 'HOTEL_NOT_FOUND', message: 'Hotel not found' } },
        { status: 404 }
      )
    }

    // If dates provided, fetch inventory and pricing
    let roomTypesWithDetails = []
    
    if (checkIn && checkOut) {
      const checkInDate = new Date(checkIn)
      const checkOutDate = new Date(checkOut)
      
      for (const roomType of hotel.roomTypes) {
        // Fetch inventory and prices
        const inventories = await prisma.roomTypeInventory.findMany({
          where: {
            hotelId: id,
            roomTypeId: roomType.id,
            date: {
              gte: checkInDate,
              lt: checkOutDate,
            },
          },
        })

        const prices = await prisma.roomPrice.findMany({
          where: {
            hotelId: id,
            roomTypeId: roomType.id,
            date: {
              gte: checkInDate,
              lt: checkOutDate,
            },
          },
        })

        // Check availability
        const allDatesAvailable = inventories.every(inv => 
          (inv.totalInventory - inv.totalReserved) >= rooms
        )

        const minAvailable = inventories.length > 0 
          ? Math.min(...inventories.map(inv => inv.totalInventory - inv.totalReserved))
          : 0

        // Calculate pricing
        const totalPrice = prices.reduce((sum, p) => sum + Number(p.price), 0) * rooms
        const avgPricePerNight = prices.length > 0 
          ? prices.reduce((sum, p) => sum + Number(p.price), 0) / prices.length 
          : 0

        roomTypesWithDetails.push({
          id: roomType.id,
          name: roomType.name,
          description: roomType.description,
          sizeSqft: roomType.sizeSqft,
          maxOccupancy: roomType.maxOccupancy,
          bedType: roomType.bedType,
          viewType: roomType.viewType,
          images: roomType.images as string[] || [],
          amenities: roomType.amenities as string[] || [],
          pricing: {
            pricePerNight: Math.round(avgPricePerNight),
            totalPrice: Math.round(totalPrice),
            currency: 'USD',
            breakdown: prices.map(p => ({
              date: p.date.toISOString().split('T')[0],
              price: Number(p.price),
            })),
          },
          availability: {
            isAvailable: allDatesAvailable,
            roomsAvailable: minAvailable,
          },
        })
      }
    } else {
      // No dates provided, return basic room type info
      roomTypesWithDetails = hotel.roomTypes.map(rt => ({
        id: rt.id,
        name: rt.name,
        description: rt.description,
        sizeSqft: rt.sizeSqft,
        maxOccupancy: rt.maxOccupancy,
        bedType: rt.bedType,
        viewType: rt.viewType,
        images: rt.images as string[] || [],
        amenities: rt.amenities as string[] || [],
      }))
    }

    return NextResponse.json({
      data: {
        id: hotel.id,
        name: hotel.name,
        description: hotel.description,
        address: hotel.address,
        city: hotel.city,
        state: hotel.state,
        country: hotel.country,
        postalCode: hotel.postalCode,
        latitude: hotel.latitude,
        longitude: hotel.longitude,
        starRating: hotel.starRating,
        phone: hotel.phone,
        email: hotel.email,
        checkInTime: hotel.checkInTime,
        checkOutTime: hotel.checkOutTime,
        policies: hotel.policies,
        images: hotel.images as string[] || [],
        roomTypes: roomTypesWithDetails,
      },
    })
  } catch (error) {
    console.error('Hotel detail error:', error)
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'An error occurred' } },
      { status: 500 }
    )
  }
}

