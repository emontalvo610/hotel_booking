'use client'

import { useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import Link from 'next/link'

interface Hotel {
  id: string
  name: string
  city: string
  country: string
  starRating: number | null
  images: string[]
  minPricePerNight: number
  currency: string
  isAvailable: boolean
  lowInventory: boolean
}

interface SearchResponse {
  data: Hotel[]
  meta: {
    searchCriteria: {
      destination: string
      checkIn: string
      checkOut: string
      guests: number
      rooms: number
    }
    total: number
  }
}

export default function SearchPage() {
  const searchParams = useSearchParams()
  const [hotels, setHotels] = useState<Hotel[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const destination = searchParams.get('destination') || ''
  const checkIn = searchParams.get('checkIn') || ''
  const checkOut = searchParams.get('checkOut') || ''
  const guests = searchParams.get('guests') || '2'
  const rooms = searchParams.get('rooms') || '1'

  useEffect(() => {
    const fetchHotels = async () => {
      try {
        setLoading(true)
        const params = new URLSearchParams({
          destination,
          checkIn,
          checkOut,
          guests,
          rooms,
        })

        const response = await fetch(`/api/hotels/search?${params}`)
        const data: SearchResponse = await response.json()

        if (!response.ok) {
          throw new Error(data.error?.message || 'Failed to search hotels')
        }

        setHotels(data.data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred')
      } finally {
        setLoading(false)
      }
    }

    if (destination && checkIn && checkOut) {
      fetchHotels()
    }
  }, [destination, checkIn, checkOut, guests, rooms])

  // Calculate number of nights
  const nights = checkIn && checkOut 
    ? Math.ceil((new Date(checkOut).getTime() - new Date(checkIn).getTime()) / (1000 * 60 * 60 * 24))
    : 0

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header with search info */}
      <div className="bg-white shadow">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{destination}</h1>
              <p className="text-gray-600">
                {checkIn} → {checkOut} · {guests} guests · {rooms} room{parseInt(rooms) > 1 ? 's' : ''}
                {nights > 0 && ` · ${nights} night${nights > 1 ? 's' : ''}`}
              </p>
            </div>
            <Link 
              href="/"
              className="px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
            >
              Modify Search
            </Link>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Loading State */}
        {loading && (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-lg shadow p-6 animate-pulse">
                <div className="flex gap-4">
                  <div className="w-64 h-48 bg-gray-200 rounded-lg"></div>
                  <div className="flex-1 space-y-4">
                    <div className="h-6 bg-gray-200 rounded w-1/3"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <div className="text-red-600 text-lg font-semibold mb-2">❌ Error</div>
            <p className="text-red-700">{error}</p>
            <Link 
              href="/"
              className="inline-block mt-4 px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
            >
              Back to Search
            </Link>
          </div>
        )}

        {/* No Results */}
        {!loading && !error && hotels.length === 0 && (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <div className="text-6xl mb-4">😞</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">No hotels found</h2>
            <p className="text-gray-600 mb-6">
              We couldn't find any available hotels for your search criteria.
            </p>
            <div className="space-y-2 text-left max-w-md mx-auto mb-6">
              <p className="text-sm text-gray-600">Try:</p>
              <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
                <li>Different dates</li>
                <li>Fewer rooms</li>
                <li>Nearby cities (Portland, San Francisco)</li>
              </ul>
            </div>
            <Link 
              href="/"
              className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              New Search
            </Link>
          </div>
        )}

        {/* Results */}
        {!loading && !error && hotels.length > 0 && (
          <div>
            <div className="mb-4">
              <p className="text-gray-600">
                Found <span className="font-semibold">{hotels.length}</span> hotel{hotels.length > 1 ? 's' : ''}
              </p>
            </div>

            <div className="space-y-4">
              {hotels.map((hotel) => (
                <div key={hotel.id} className="bg-white rounded-lg shadow hover:shadow-lg transition overflow-hidden">
                  <div className="flex flex-col md:flex-row">
                    {/* Hotel Image */}
                    <div className="md:w-80 h-64 md:h-auto relative">
                      <img
                        src={hotel.images[0] || 'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=400'}
                        alt={hotel.name}
                        className="w-full h-full object-cover"
                      />
                      {hotel.lowInventory && (
                        <div className="absolute top-4 left-4 bg-red-500 text-white px-3 py-1 rounded-full text-sm font-semibold">
                          🔥 Low Availability
                        </div>
                      )}
                    </div>

                    {/* Hotel Info */}
                    <div className="flex-1 p-6">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h3 className="text-2xl font-bold text-gray-900 mb-1">
                            {hotel.name}
                          </h3>
                          <div className="flex items-center gap-2 text-gray-600">
                            <span className="text-yellow-500">
                              {'⭐'.repeat(hotel.starRating || 0)}
                            </span>
                            <span>·</span>
                            <span>{hotel.city}, {hotel.country}</span>
                          </div>
                        </div>
                      </div>

                      <div className="mt-4 flex items-center gap-2 text-sm text-gray-600">
                        <span className="inline-flex items-center gap-1">
                          <span>✓</span> Free WiFi
                        </span>
                        <span>•</span>
                        <span className="inline-flex items-center gap-1">
                          <span>✓</span> Free Cancellation
                        </span>
                      </div>

                      <div className="mt-6 flex items-end justify-between">
                        <div>
                          <div className="text-sm text-gray-600">From</div>
                          <div className="text-3xl font-bold text-gray-900">
                            ${hotel.minPricePerNight}
                          </div>
                          <div className="text-sm text-gray-600">per night</div>
                          {nights > 0 && (
                            <div className="text-sm text-gray-500 mt-1">
                              ${hotel.minPricePerNight * nights * parseInt(rooms)} total for {nights} night{nights > 1 ? 's' : ''}
                            </div>
                          )}
                        </div>

                        <Link
                          href={`/hotels/${hotel.id}?checkIn=${checkIn}&checkOut=${checkOut}&guests=${guests}&rooms=${rooms}`}
                          className="px-8 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition"
                        >
                          View Rooms
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

