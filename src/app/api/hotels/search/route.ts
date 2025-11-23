import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { searchSchema } from '@/lib/validations'
import { addDays, eachDayOfInterval } from 'date-fns'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    
    // Parse and validate query parameters
    const params = {
      destination: searchParams.get('destination') || '',
      checkIn: searchParams.get('checkIn') || '',
      checkOut: searchParams.get('checkOut') || '',
      guests: searchParams.get('guests') || '2',
      rooms: searchParams.get('rooms') || '1',
    }

    const validated = searchSchema.parse(params)

    // Search hotels in the specified city
    const hotels = await prisma.hotel.findMany({
      where: {
        isActive: true,
        OR: [
          { city: { contains: validated.destination, mode: 'insensitive' } },
          { name: { contains: validated.destination, mode: 'insensitive' } },
        ],
      },
      include: {
        roomTypes: {
          where: { isActive: true },
          include: {
            inventories: {
              where: {
                date: {
                  gte: new Date(validated.checkIn),
                  lt: new Date(validated.checkOut),
                },
              },
            },
            prices: {
              where: {
                date: {
                  gte: new Date(validated.checkIn),
                  lt: new Date(validated.checkOut),
                },
              },
            },
          },
        },
      },
    })

    // Process hotels to check availability and find min price
    const results = hotels.map(hotel => {
      let minPrice = Infinity
      let hasAvailability = false
      let lowInventory = false

      for (const roomType of hotel.roomTypes) {
        const { inventories, prices } = roomType
        
        // Check if all dates have sufficient availability
        const allDatesAvailable = inventories.every(inv => 
          (inv.totalInventory - inv.totalReserved) >= validated.rooms
        )

        if (allDatesAvailable && prices.length > 0) {
          hasAvailability = true
          
          // Calculate average price
          const avgPrice = prices.reduce((sum, p) => sum + Number(p.price), 0) / prices.length
          if (avgPrice < minPrice) {
            minPrice = avgPrice
          }

          // Check for low inventory (< 5 rooms available)
          const minAvailable = Math.min(...inventories.map(inv => 
            inv.totalInventory - inv.totalReserved
          ))
          if (minAvailable < 5) {
            lowInventory = true
          }
        }
      }

      return {
        id: hotel.id,
        name: hotel.name,
        city: hotel.city,
        country: hotel.country,
        starRating: hotel.starRating,
        images: hotel.images as string[] || [],
        minPricePerNight: minPrice === Infinity ? 0 : Math.round(minPrice),
        currency: 'USD',
        isAvailable: hasAvailability,
        lowInventory,
      }
    }).filter(hotel => hotel.isAvailable) // Only return hotels with availability

    return NextResponse.json({
      data: results,
      meta: {
        searchCriteria: validated,
        total: results.length,
      },
    })
  } catch (error) {
    console.error('Search error:', error)
    
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: 'Invalid search parameters', details: error } },
        { status: 422 }
      )
    }

    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'An error occurred while searching' } },
      { status: 500 }
    )
  }
}

