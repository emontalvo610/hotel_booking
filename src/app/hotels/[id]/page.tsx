'use client'

import { useParams, useSearchParams, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import Link from 'next/link'

interface RoomType {
  id: string
  name: string
  description: string | null
  sizeSqft: number | null
  maxOccupancy: number
  bedType: string | null
  viewType: string | null
  images: string[]
  amenities: string[]
  pricing: {
    pricePerNight: number
    totalPrice: number
    currency: string
    breakdown: Array<{ date: string; price: number }>
  }
  availability: {
    isAvailable: boolean
    roomsAvailable: number
  }
}

interface Hotel {
  id: string
  name: string
  description: string | null
  address: string | null
  city: string
  state: string | null
  country: string
  starRating: number | null
  phone: string | null
  email: string | null
  checkInTime: string | null
  checkOutTime: string | null
  images: string[]
  roomTypes: RoomType[]
}

export default function HotelDetailPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const router = useRouter()
  
  const hotelId = params.id as string
  const checkIn = searchParams.get('checkIn') || ''
  const checkOut = searchParams.get('checkOut') || ''
  const guests = parseInt(searchParams.get('guests') || '2')
  const rooms = parseInt(searchParams.get('rooms') || '1')

  const [hotel, setHotel] = useState<Hotel | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedRoomQuantities, setSelectedRoomQuantities] = useState<Record<string, number>>({})

  useEffect(() => {
    const fetchHotel = async () => {
      try {
        setLoading(true)
        const params = new URLSearchParams()
        if (checkIn) params.append('checkIn', checkIn)
        if (checkOut) params.append('checkOut', checkOut)
        params.append('rooms', rooms.toString())

        const response = await fetch(`/api/hotels/${hotelId}?${params}`)
        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.error?.message || 'Failed to load hotel')
        }

        setHotel(data.data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred')
      } finally {
        setLoading(false)
      }
    }

    if (hotelId) {
      fetchHotel()
    }
  }, [hotelId, checkIn, checkOut, rooms])

  const handleReserve = async (roomTypeId: string) => {
    const quantity = selectedRoomQuantities[roomTypeId] || 1
    
    try {
      // Create reservation (Phase 1)
      const response = await fetch('/api/reservations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          hotelId,
          roomTypeId,
          checkInDate: checkIn,
          checkOutDate: checkOut,
          numberOfRooms: quantity,
          guest: {
            firstName: '',
            lastName: '',
            email: '',
          },
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        if (data.error?.code === 'ROOM_UNAVAILABLE') {
          alert('Sorry, this room is no longer available. Please try another room or different dates.')
          window.location.reload()
        } else {
          throw new Error(data.error?.message || 'Failed to create reservation')
        }
        return
      }

      // Redirect to booking review page
      router.push(`/book/review/${data.data.reservationId}`)
    } catch (err) {
      alert(err instanceof Error ? err.message : 'An error occurred')
    }
  }

  const nights = checkIn && checkOut 
    ? Math.ceil((new Date(checkOut).getTime() - new Date(checkIn).getTime()) / (1000 * 60 * 60 * 24))
    : 0

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse space-y-4">
            <div className="h-96 bg-gray-200 rounded-lg"></div>
            <div className="h-8 bg-gray-200 rounded w-1/3"></div>
            <div className="h-4 bg-gray-200 rounded w-1/4"></div>
          </div>
        </div>
      </div>
    )
  }

  if (error || !hotel) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">😞</div>
          <h2 className="text-2xl font-bold mb-2">Hotel Not Found</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <Link href="/" className="px-6 py-3 bg-blue-600 text-white rounded-lg">
            Back to Search
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Image */}
      <div className="h-96 relative">
        <img
          src={hotel.images[0] || 'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=1600'}
          alt={hotel.name}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
        <div className="absolute bottom-0 left-0 right-0 p-8 text-white">
          <div className="container mx-auto">
            <h1 className="text-4xl font-bold mb-2">{hotel.name}</h1>
            <div className="flex items-center gap-4 text-lg">
              <span className="text-yellow-400">
                {'⭐'.repeat(hotel.starRating || 0)}
              </span>
              <span>·</span>
              <span>{hotel.address}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Search Info Bar */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              {checkIn} → {checkOut} · {guests} guests · {rooms} room{rooms > 1 ? 's' : ''}
              {nights > 0 && ` · ${nights} night${nights > 1 ? 's' : ''}`}
            </div>
            <Link href="/" className="text-blue-600 hover:underline text-sm">
              Modify Search
            </Link>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* About */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-2xl font-bold mb-4">About This Hotel</h2>
              <p className="text-gray-700">{hotel.description}</p>
              
              <div className="mt-6 grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Check-in:</span>
                  <span className="ml-2 font-semibold">{hotel.checkInTime || '3:00 PM'}</span>
                </div>
                <div>
                  <span className="text-gray-600">Check-out:</span>
                  <span className="ml-2 font-semibold">{hotel.checkOutTime || '11:00 AM'}</span>
                </div>
              </div>
            </div>

            {/* Room Types */}
            <div>
              <h2 className="text-2xl font-bold mb-4">Available Rooms</h2>
              
              {hotel.roomTypes.length === 0 ? (
                <div className="bg-white rounded-lg shadow p-12 text-center">
                  <div className="text-4xl mb-4">😞</div>
                  <p className="text-gray-600">No rooms available for selected dates.</p>
                  <Link href="/" className="inline-block mt-4 text-blue-600 hover:underline">
                    Try different dates
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {hotel.roomTypes.map((room) => (
                    <div key={room.id} className="bg-white rounded-lg shadow overflow-hidden">
                      <div className="flex flex-col md:flex-row">
                        {/* Room Image */}
                        <div className="md:w-64 h-48 md:h-auto">
                          <img
                            src={room.images[0] || 'https://images.unsplash.com/photo-1611892440504-42a792e24d32?w=400'}
                            alt={room.name}
                            className="w-full h-full object-cover"
                          />
                        </div>

                        {/* Room Info */}
                        <div className="flex-1 p-6">
                          <div className="flex justify-between items-start mb-3">
                            <div>
                              <h3 className="text-xl font-bold text-gray-900">{room.name}</h3>
                              <div className="text-sm text-gray-600 mt-1">
                                {room.bedType} · Max {room.maxOccupancy} guests
                                {room.sizeSqft && ` · ${room.sizeSqft} sq ft`}
                              </div>
                            </div>
                            {!room.availability.isAvailable && (
                              <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm font-semibold">
                                Sold Out
                              </span>
                            )}
                            {room.availability.isAvailable && room.availability.roomsAvailable < 5 && (
                              <span className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-sm font-semibold">
                                Only {room.availability.roomsAvailable} left
                              </span>
                            )}
                          </div>

                          <p className="text-gray-700 text-sm mb-3">{room.description}</p>

                          {/* Amenities */}
                          <div className="flex flex-wrap gap-2 mb-4">
                            {room.amenities.slice(0, 4).map((amenity) => (
                              <span key={amenity} className="text-xs bg-gray-100 px-2 py-1 rounded">
                                ✓ {amenity.replace('_', ' ')}
                              </span>
                            ))}
                          </div>

                          {/* Pricing & Booking */}
                          <div className="flex items-end justify-between pt-4 border-t">
                            <div>
                              <div className="text-2xl font-bold text-gray-900">
                                ${room.pricing.pricePerNight}
                                <span className="text-base font-normal text-gray-600"> / night</span>
                              </div>
                              {nights > 0 && (
                                <div className="text-sm text-gray-600">
                                  ${room.pricing.totalPrice} total for {nights} night{nights > 1 ? 's' : ''}
                                </div>
                              )}
                            </div>

                            {room.availability.isAvailable ? (
                              <div className="flex items-center gap-3">
                                <div className="flex items-center gap-2">
                                  <button
                                    onClick={() => setSelectedRoomQuantities({
                                      ...selectedRoomQuantities,
                                      [room.id]: Math.max(1, (selectedRoomQuantities[room.id] || 1) - 1)
                                    })}
                                    className="w-8 h-8 flex items-center justify-center border border-gray-300 rounded hover:bg-gray-100"
                                  >
                                    −
                                  </button>
                                  <span className="w-8 text-center font-semibold">
                                    {selectedRoomQuantities[room.id] || 1}
                                  </span>
                                  <button
                                    onClick={() => setSelectedRoomQuantities({
                                      ...selectedRoomQuantities,
                                      [room.id]: Math.min(room.availability.roomsAvailable, (selectedRoomQuantities[room.id] || 1) + 1)
                                    })}
                                    className="w-8 h-8 flex items-center justify-center border border-gray-300 rounded hover:bg-gray-100"
                                    disabled={(selectedRoomQuantities[room.id] || 1) >= room.availability.roomsAvailable}
                                  >
                                    +
                                  </button>
                                </div>
                                <button
                                  onClick={() => handleReserve(room.id)}
                                  className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition"
                                >
                                  Reserve
                                </button>
                              </div>
                            ) : (
                              <button disabled className="px-6 py-3 bg-gray-300 text-gray-500 font-semibold rounded-lg cursor-not-allowed">
                                Sold Out
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow p-6 sticky top-4">
              <h3 className="text-lg font-bold mb-4">Contact Information</h3>
              <div className="space-y-3 text-sm">
                {hotel.phone && (
                  <div>
                    <span className="text-gray-600">Phone:</span>
                    <div className="font-semibold">{hotel.phone}</div>
                  </div>
                )}
                {hotel.email && (
                  <div>
                    <span className="text-gray-600">Email:</span>
                    <div className="font-semibold">{hotel.email}</div>
                  </div>
                )}
                <div>
                  <span className="text-gray-600">Address:</span>
                  <div className="font-semibold">
                    {hotel.address}<br />
                    {hotel.city}, {hotel.state} {hotel.country}
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-6 border-t">
                <div className="flex items-center gap-2 text-sm text-green-700 bg-green-50 p-3 rounded">
                  <span>✓</span>
                  <span>Free cancellation available</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

