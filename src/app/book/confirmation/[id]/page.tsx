'use client'

import { useParams, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import Link from 'next/link'

interface Reservation {
  reservationId: string
  confirmationNumber: string
  status: string
  hotel: {
    id: string
    name: string
    address: string
    city: string
    state: string | null
    country: string
    phone: string | null
  }
  roomType: {
    name: string
    bedType: string | null
    maxOccupancy: number
  }
  checkInDate: string
  checkInTime: string | null
  checkOutDate: string
  checkOutTime: string | null
  numberOfRooms: number
  guest: {
    firstName: string
    lastName: string
    email: string
    phone: string | null
  }
  payment: {
    amount: number
    currency: string
    method: string | null
    status: string
  } | null
  totalPrice: number
  currency: string
  createdAt: string
}

export default function ConfirmationPage() {
  const params = useParams()
  const router = useRouter()
  const reservationId = params.id as string

  const [reservation, setReservation] = useState<Reservation | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchReservation = async () => {
      try {
        setLoading(true)
        const response = await fetch(`/api/reservations/${reservationId}`)
        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.error?.message || 'Failed to load reservation')
        }

        setReservation(data.data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred')
      } finally {
        setLoading(false)
      }
    }

    if (reservationId) {
      fetchReservation()
    }
  }, [reservationId])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading confirmation...</p>
        </div>
      </div>
    )
  }

  if (error || !reservation) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">😞</div>
          <h2 className="text-2xl font-bold mb-2">Reservation Not Found</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => router.push('/')}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg"
          >
            Back to Search
          </button>
        </div>
      </div>
    )
  }

  // Calculate nights
  const checkIn = new Date(reservation.checkInDate)
  const checkOut = new Date(reservation.checkOutDate)
  const nights = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24))

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4 max-w-3xl">
        {/* Success Message */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-4">
            <span className="text-4xl">✅</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Booking Confirmed!</h1>
          <p className="text-gray-600">
            We've sent a confirmation email to <span className="font-semibold">{reservation.guest.email}</span>
          </p>
        </div>

        {/* Confirmation Number */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg p-6 text-white text-center mb-6">
          <div className="text-sm mb-1">Confirmation Number</div>
          <div className="text-3xl font-bold tracking-wider">{reservation.confirmationNumber}</div>
        </div>

        {/* Booking Details */}
        <div className="bg-white rounded-lg shadow overflow-hidden mb-6">
          {/* Hotel Info */}
          <div className="p-6 border-b">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              {reservation.hotel.name}
            </h2>
            <p className="text-gray-600">{reservation.hotel.address}</p>
            <p className="text-gray-600">
              {reservation.hotel.city}, {reservation.hotel.state} {reservation.hotel.country}
            </p>
            {reservation.hotel.phone && (
              <p className="text-gray-600 mt-2">📞 {reservation.hotel.phone}</p>
            )}
          </div>

          {/* Stay Details */}
          <div className="p-6 border-b">
            <h3 className="font-semibold text-gray-900 mb-4">Stay Details</h3>
            <div className="grid grid-cols-2 gap-6">
              <div>
                <div className="text-sm text-gray-600 mb-1">Check-in</div>
                <div className="font-semibold">
                  {new Date(reservation.checkInDate).toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </div>
                <div className="text-sm text-gray-600">
                  {reservation.checkInTime || '3:00 PM'}
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-600 mb-1">Check-out</div>
                <div className="font-semibold">
                  {new Date(reservation.checkOutDate).toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </div>
                <div className="text-sm text-gray-600">
                  {reservation.checkOutTime || '11:00 AM'}
                </div>
              </div>
            </div>
            <div className="mt-4">
              <div className="text-sm text-gray-600 mb-1">Duration</div>
              <div className="font-semibold">{nights} night{nights !== 1 ? 's' : ''}</div>
            </div>
          </div>

          {/* Room Details */}
          <div className="p-6 border-b">
            <h3 className="font-semibold text-gray-900 mb-4">Room Details</h3>
            <div>
              <div className="font-semibold">
                {reservation.numberOfRooms} × {reservation.roomType.name}
              </div>
              <div className="text-sm text-gray-600 mt-1">
                {reservation.roomType.bedType} · Max {reservation.roomType.maxOccupancy} guests
              </div>
            </div>
          </div>

          {/* Guest Information */}
          <div className="p-6 border-b">
            <h3 className="font-semibold text-gray-900 mb-4">Guest Information</h3>
            <div className="space-y-2">
              <div>
                <span className="text-sm text-gray-600">Name: </span>
                <span className="font-semibold">
                  {reservation.guest.firstName} {reservation.guest.lastName}
                </span>
              </div>
              <div>
                <span className="text-sm text-gray-600">Email: </span>
                <span className="font-semibold">{reservation.guest.email}</span>
              </div>
              {reservation.guest.phone && (
                <div>
                  <span className="text-sm text-gray-600">Phone: </span>
                  <span className="font-semibold">{reservation.guest.phone}</span>
                </div>
              )}
            </div>
          </div>

          {/* Payment Information */}
          {reservation.payment && (
            <div className="p-6 border-b">
              <h3 className="font-semibold text-gray-900 mb-4">Payment Information</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Paid</span>
                  <span className="font-bold text-lg">
                    ${reservation.payment.amount} {reservation.payment.currency}
                  </span>
                </div>
                {reservation.payment.method && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Payment Method</span>
                    <span className="font-semibold">{reservation.payment.method}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Status</span>
                  <span className="font-semibold text-green-600">
                    {reservation.payment.status}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Cancellation Policy */}
          <div className="p-6">
            <h3 className="font-semibold text-gray-900 mb-2">Cancellation Policy</h3>
            <div className="flex items-start gap-2 text-sm text-green-700 bg-green-50 p-3 rounded">
              <span>✓</span>
              <div>
                <div className="font-semibold">Free cancellation until 24 hours before check-in</div>
                <div className="text-green-600">After that, 50% refund available</div>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-4">
          <button
            onClick={() => window.print()}
            className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition"
          >
            🖨️ Print Confirmation
          </button>
          <button
            onClick={() => {
              const event = {
                title: `${reservation.hotel.name} - ${reservation.roomType.name}`,
                start: reservation.checkInDate,
                end: reservation.checkOutDate,
                details: `Confirmation: ${reservation.confirmationNumber}`,
              }
              alert('Calendar integration would be implemented here (e.g., .ics file download)')
            }}
            className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition"
          >
            📅 Add to Calendar
          </button>
        </div>

        <div className="mt-6 flex flex-col sm:flex-row gap-4">
          <Link
            href="/my-bookings"
            className="flex-1 px-6 py-3 bg-gray-200 text-gray-800 font-semibold rounded-lg hover:bg-gray-300 transition text-center"
          >
            View All Bookings
          </Link>
          <Link
            href="/"
            className="flex-1 px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition text-center"
          >
            Book Another Hotel
          </Link>
        </div>

        {/* Help */}
        <div className="mt-8 text-center text-sm text-gray-600">
          <p>Need help with your booking?</p>
          <p className="mt-1">
            Contact us at{' '}
            <a href="mailto:support@hotel-booking.com" className="text-blue-600 hover:underline">
              support@hotel-booking.com
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}

