import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'
import { addDays } from 'date-fns'
import 'dotenv/config'

// Remove schema parameter from connection string for pg adapter
const connectionString = process.env.DATABASE_URL?.replace('?schema=public', '')
const pool = new Pool({ connectionString })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

async function main() {
  console.log('🌱 Starting database seed...')

  // Create Hotels
  console.log('Creating hotels...')
  const hotel1 = await prisma.hotel.create({
    data: {
      name: 'Seattle Downtown Hotel',
      description: 'Experience luxury in the heart of downtown Seattle. Modern amenities, stunning city views, and exceptional service await you.',
      address: '1234 Pike Street',
      city: 'Seattle',
      state: 'WA',
      country: 'USA',
      postalCode: '98101',
      latitude: 47.6062,
      longitude: -122.3321,
      starRating: 4,
      phone: '+1-206-555-1234',
      email: 'info@seattledowntown.com',
      checkInTime: '15:00',
      checkOutTime: '11:00',
      policies: {
        cancellation: {
          freeCancellationHours: 24,
          partialRefundPercentage: 50
        },
        pets: {
          allowed: true,
          fee: 50
        },
        ageRequirement: {
          minimumAge: 18
        }
      },
      images: [
        'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=800',
        'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800',
        'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=800'
      ]
    }
  })

  const hotel2 = await prisma.hotel.create({
    data: {
      name: 'Portland City Hotel',
      description: 'A boutique hotel in the heart of Portland with modern design and eco-friendly practices.',
      address: '789 SW Broadway',
      city: 'Portland',
      state: 'OR',
      country: 'USA',
      postalCode: '97205',
      latitude: 45.5152,
      longitude: -122.6784,
      starRating: 3,
      phone: '+1-503-555-5678',
      email: 'contact@portlandcity.com',
      checkInTime: '14:00',
      checkOutTime: '11:00',
      policies: {
        cancellation: {
          freeCancellationHours: 48,
          partialRefundPercentage: 75
        },
        pets: {
          allowed: false
        },
        ageRequirement: {
          minimumAge: 21
        }
      },
      images: [
        'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=800',
        'https://images.unsplash.com/photo-1582719508461-905c673771fd?w=800'
      ]
    }
  })

  const hotel3 = await prisma.hotel.create({
    data: {
      name: 'San Francisco Bay Hotel',
      description: 'Waterfront hotel with breathtaking views of the Golden Gate Bridge and San Francisco Bay.',
      address: '456 Embarcadero',
      city: 'San Francisco',
      state: 'CA',
      country: 'USA',
      postalCode: '94105',
      latitude: 37.7749,
      longitude: -122.4194,
      starRating: 5,
      phone: '+1-415-555-9012',
      email: 'reservations@sfbayhotel.com',
      checkInTime: '16:00',
      checkOutTime: '12:00',
      policies: {
        cancellation: {
          freeCancellationHours: 24,
          partialRefundPercentage: 50
        },
        pets: {
          allowed: true,
          fee: 75
        },
        ageRequirement: {
          minimumAge: 18
        }
      },
      images: [
        'https://images.unsplash.com/photo-1445019980597-93fa8acb246c?w=800',
        'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=800',
        'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=800'
      ]
    }
  })

  console.log(`✅ Created ${3} hotels`)

  // Create Room Types
  console.log('Creating room types...')
  
  // Seattle Downtown Hotel Room Types
  const deluxeKing = await prisma.roomType.create({
    data: {
      hotelId: hotel1.id,
      name: 'Deluxe King Room',
      description: 'Spacious room with a king bed and stunning city views. Perfect for business or leisure travelers.',
      sizeSqft: 350,
      maxOccupancy: 2,
      bedType: '1 King Bed',
      viewType: 'City View',
      baseInventory: 10,
      images: [
        'https://images.unsplash.com/photo-1611892440504-42a792e24d32?w=800',
        'https://images.unsplash.com/photo-1590490360182-c33d57733427?w=800'
      ],
      amenities: ['wifi', 'mini_fridge', 'coffee_maker', 'smart_tv', 'work_desk', 'safe']
    }
  })

  const superiorQueen = await prisma.roomType.create({
    data: {
      hotelId: hotel1.id,
      name: 'Superior Queen Room',
      description: 'Comfortable room with two queen beds, ideal for families or groups.',
      sizeSqft: 320,
      maxOccupancy: 4,
      bedType: '2 Queen Beds',
      viewType: 'Street View',
      baseInventory: 15,
      images: [
        'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=800'
      ],
      amenities: ['wifi', 'mini_fridge', 'coffee_maker', 'tv']
    }
  })

  const presidentialSuite = await prisma.roomType.create({
    data: {
      hotelId: hotel1.id,
      name: 'Presidential Suite',
      description: 'Luxurious suite with separate living area, king bed, and panoramic city views.',
      sizeSqft: 800,
      maxOccupancy: 4,
      bedType: '1 King Bed + Sofa Bed',
      viewType: 'Panoramic City View',
      baseInventory: 3,
      images: [
        'https://images.unsplash.com/photo-1582719508461-905c673771fd?w=800'
      ],
      amenities: ['wifi', 'mini_fridge', 'coffee_maker', 'smart_tv', 'work_desk', 'safe', 'jacuzzi', 'balcony']
    }
  })

  // Portland City Hotel Room Types
  const standardKing = await prisma.roomType.create({
    data: {
      hotelId: hotel2.id,
      name: 'Standard King Room',
      description: 'Cozy room with eco-friendly amenities and modern design.',
      sizeSqft: 280,
      maxOccupancy: 2,
      bedType: '1 King Bed',
      viewType: 'Street View',
      baseInventory: 20,
      images: [
        'https://images.unsplash.com/photo-1595576508898-0ad5c879a061?w=800'
      ],
      amenities: ['wifi', 'coffee_maker', 'tv']
    }
  })

  // San Francisco Bay Hotel Room Types
  const oceanViewKing = await prisma.roomType.create({
    data: {
      hotelId: hotel3.id,
      name: 'Ocean View King Room',
      description: 'Elegant room with floor-to-ceiling windows overlooking the bay.',
      sizeSqft: 400,
      maxOccupancy: 2,
      bedType: '1 King Bed',
      viewType: 'Ocean View',
      baseInventory: 12,
      images: [
        'https://images.unsplash.com/photo-1578683010236-d716f9a3f461?w=800'
      ],
      amenities: ['wifi', 'mini_fridge', 'coffee_maker', 'smart_tv', 'work_desk', 'safe', 'balcony']
    }
  })

  console.log(`✅ Created ${5} room types`)

  // Create Inventory and Pricing for next 90 days
  console.log('Creating inventory and pricing...')
  
  const startDate = new Date()
  const roomTypes = [
    { roomType: deluxeKing, basePrice: 120, weekendPrice: 150 },
    { roomType: superiorQueen, basePrice: 100, weekendPrice: 130 },
    { roomType: presidentialSuite, basePrice: 350, weekendPrice: 450 },
    { roomType: standardKing, basePrice: 90, weekendPrice: 110 },
    { roomType: oceanViewKing, basePrice: 200, weekendPrice: 250 }
  ]

  for (const { roomType, basePrice, weekendPrice } of roomTypes) {
    const inventoryData = []
    const priceData = []

    for (let i = 0; i < 90; i++) {
      const date = addDays(startDate, i)
      const dayOfWeek = date.getDay()
      const isWeekend = dayOfWeek === 5 || dayOfWeek === 6 // Friday or Saturday
      const price = isWeekend ? weekendPrice : basePrice

      inventoryData.push({
        hotelId: roomType.hotelId,
        roomTypeId: roomType.id,
        date,
        totalInventory: roomType.baseInventory,
        totalReserved: 0
      })

      priceData.push({
        hotelId: roomType.hotelId,
        roomTypeId: roomType.id,
        date,
        price,
        currency: 'USD'
      })
    }

    await prisma.roomTypeInventory.createMany({ data: inventoryData })
    await prisma.roomPrice.createMany({ data: priceData })
  }

  console.log(`✅ Created inventory and pricing for 90 days`)

  // Create Sample Guest
  console.log('Creating sample guests...')
  const guest1 = await prisma.guest.create({
    data: {
      firstName: 'Alex',
      lastName: 'Kim',
      email: 'alex.kim@example.com',
      phone: '+1-555-0123'
    }
  })

  const guest2 = await prisma.guest.create({
    data: {
      firstName: 'Sarah',
      lastName: 'Johnson',
      email: 'sarah.johnson@example.com',
      phone: '+1-555-0456'
    }
  })

  console.log(`✅ Created ${2} sample guests`)

  // Create Sample Reservations
  console.log('Creating sample reservations...')
  
  const checkIn1 = addDays(new Date(), 7)
  const checkOut1 = addDays(checkIn1, 3)
  
  const reservation1 = await prisma.reservation.create({
    data: {
      guestId: guest1.id,
      hotelId: hotel1.id,
      roomTypeId: deluxeKing.id,
      checkInDate: checkIn1,
      checkOutDate: checkOut1,
      numberOfRooms: 1,
      status: 'PAID',
      totalPrice: 360.00,
      currency: 'USD',
      specialRequests: 'Late check-in, please.'
    }
  })

  // Update inventory for reservation1
  for (let i = 0; i < 3; i++) {
    const date = addDays(checkIn1, i)
    await prisma.roomTypeInventory.update({
      where: {
        hotelId_roomTypeId_date: {
          hotelId: hotel1.id,
          roomTypeId: deluxeKing.id,
          date
        }
      },
      data: {
        totalReserved: {
          increment: 1
        }
      }
    })
  }

  // Create payment for reservation1
  await prisma.payment.create({
    data: {
      reservationId: reservation1.id,
      amount: 360.00,
      currency: 'USD',
      status: 'SUCCEEDED',
      paymentMethod: 'card',
      paymentProvider: 'stripe',
      providerTransactionId: 'ch_mock_' + Math.random().toString(36).substring(7)
    }
  })

  console.log(`✅ Created ${1} sample reservation with payment`)

  console.log('🎉 Database seed completed successfully!')
  console.log('\nSummary:')
  console.log(`- Hotels: 3`)
  console.log(`- Room Types: 5`)
  console.log(`- Inventory Records: ${90 * 5}`)
  console.log(`- Price Records: ${90 * 5}`)
  console.log(`- Guests: 2`)
  console.log(`- Reservations: 1`)
  console.log(`- Payments: 1`)
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error('❌ Seed failed:', e)
    await prisma.$disconnect()
    process.exit(1)
  })

