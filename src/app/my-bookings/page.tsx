'use client'

import { useState } from 'react'
import Link from 'next/link'

interface Booking {
  reservationId: string
  confirmationNumber: string
  status: string
  hotel: {
    name: string
    city: string
  }
  roomType: {
    name: string
  }
  checkInDate: string
  checkOutDate: string
  numberOfRooms: number
  totalPrice: number
  currency: string
  createdAt: string
}

export default function MyBookingsPage() {
  const [email, setEmail] = useState('')
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [searched, setSearched] = useState(false)

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!email) {
      setError('Please enter your email address')
      return
    }

    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch(`/api/reservations?email=${encodeURIComponent(email)}`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error?.message || 'Failed to load bookings')
      }

      setBookings(data.data)
      setSearched(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    const styles = {
      PAID: 'bg-green-100 text-green-800',
      PENDING: 'bg-yellow-100 text-yellow-800',
      CANCELLED: 'bg-red-100 text-red-800',
      REFUNDED: 'bg-gray-100 text-gray-800',
    }[status] || 'bg-gray-100 text-gray-800'

    return (
      <span className={`px-3 py-1 rounded-full text-sm font-semibold ${styles}`}>
        {status}
      </span>
    )
  }

  const isUpcoming = (checkInDate: string) => {
    return new Date(checkInDate) >= new Date()
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">My Bookings</h1>
          <p className="text-gray-600">Enter your email to view your reservations</p>
        </div>

        {/* Search Form */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <form onSubmit={handleSearch} className="flex gap-4">
            <div className="flex-1">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email address"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="px-8 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:bg-gray-300 transition"
            >
              {loading ? 'Searching...' : 'Search'}
            </button>
          </form>
          {error && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
              {error}
            </div>
          )}
        </div>

        {/* Loading State */}
        {loading && (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Searching for your bookings...</p>
          </div>
        )}

        {/* No Results */}
        {!loading && searched && bookings.length === 0 && (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <div className="text-6xl mb-4">📭</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">No Bookings Found</h2>
            <p className="text-gray-600 mb-6">
              We couldn't find any bookings for <span className="font-semibold">{email}</span>
            </p>
            <Link
              href="/"
              className="inline-block px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700"
            >
              Make a Booking
            </Link>
          </div>
        )}

        {/* Bookings List */}
        {!loading && bookings.length > 0 && (
          <div className="space-y-4">
            <div className="text-sm text-gray-600 mb-4">
              Found <span className="font-semibold">{bookings.length}</span> booking{bookings.length !== 1 ? 's' : ''}
            </div>

            {bookings.map((booking) => {
              const upcoming = isUpcoming(booking.checkInDate)
              const checkIn = new Date(booking.checkInDate)
              const checkOut = new Date(booking.checkOutDate)
              const nights = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24))

              return (
                <div key={booking.reservationId} className="bg-white rounded-lg shadow hover:shadow-lg transition overflow-hidden">
                  <div className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-xl font-bold text-gray-900">{booking.hotel.name}</h3>
                        <p className="text-gray-600">{booking.hotel.city}</p>
                      </div>
                      {getStatusBadge(booking.status)}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4 text-sm">
                      <div>
                        <div className="text-gray-600 mb-1">Check-in</div>
                        <div className="font-semibold">
                          {checkIn.toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                        </div>
                      </div>
                      <div>
                        <div className="text-gray-600 mb-1">Check-out</div>
                        <div className="font-semibold">
                          {checkOut.toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                        </div>
                      </div>
                      <div>
                        <div className="text-gray-600 mb-1">Room</div>
                        <div className="font-semibold">
                          {booking.numberOfRooms} × {booking.roomType.name}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t">
                      <div>
                        <div className="text-sm text-gray-600">Confirmation</div>
                        <div className="font-semibold text-lg">{booking.confirmationNumber}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm text-gray-600">Total</div>
                        <div className="font-bold text-xl">${booking.totalPrice}</div>
                      </div>
                    </div>

                    <div className="mt-4 flex gap-3">
                      <Link
                        href={`/book/confirmation/${booking.reservationId}`}
                        className="flex-1 px-4 py-2 border-2 border-blue-600 text-blue-600 font-semibold rounded-lg hover:bg-blue-50 transition text-center"
                      >
                        View Details
                      </Link>
                      {upcoming && booking.status === 'PAID' && (
                        <button
                          onClick={() => {
                            if (confirm('Are you sure you want to cancel this booking?')) {
                              alert('Cancellation functionality would be implemented here')
                            }
                          }}
                          className="px-4 py-2 border-2 border-red-600 text-red-600 font-semibold rounded-lg hover:bg-red-50 transition"
                        >
                          Cancel
                        </button>
                      )}
                    </div>
                  </div>

                  {upcoming && booking.status === 'PAID' && (
                    <div className="bg-blue-50 px-6 py-3 border-t border-blue-100">
                      <div className="flex items-center gap-2 text-blue-800 text-sm">
                        <span>ℹ️</span>
                        <span>
                          Free cancellation available until{' '}
                          {new Date(booking.checkInDate).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                          })}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}

        {/* Quick Links */}
        {!loading && (
          <div className="mt-8 text-center">
            <Link href="/" className="text-blue-600 hover:underline">
              ← Back to Home
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}

