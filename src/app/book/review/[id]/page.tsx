'use client'

import { useParams, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { v4 as uuidv4 } from 'uuid'

interface Reservation {
  reservationId: string
  status: string
  hotel: {
    id: string
    name: string
    address: string
  }
  roomType: {
    id: string
    name: string
  }
  checkInDate: string
  checkOutDate: string
  numberOfRooms: number
  numberOfNights: number
  guest: {
    firstName: string
    lastName: string
    email: string
  }
  pricing: {
    pricePerNight: number
    roomSubtotal: number
    taxesAndFees: number
    total: number
    currency: string
  }
  expiresAt: string
}

export default function BookingReviewPage() {
  const params = useParams()
  const router = useRouter()
  const reservationId = params.id as string

  const [reservation, setReservation] = useState<Reservation | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Form state
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [specialRequests, setSpecialRequests] = useState('')
  const [cardToken, setCardToken] = useState('mock_card_token_123')
  const [agreedToTerms, setAgreedToTerms] = useState(false)

  // Idempotency key (generated once on mount)
  const [idempotencyKey] = useState(() => uuidv4())

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
        
        // Pre-fill guest info if available
        if (data.data.guest) {
          setFirstName(data.data.guest.firstName || '')
          setLastName(data.data.guest.lastName || '')
          setEmail(data.data.guest.email || '')
        }
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!agreedToTerms) {
      alert('Please agree to the terms and conditions')
      return
    }

    try {
      setSubmitting(true)
      
      // Confirm reservation (Phase 2)
      const response = await fetch(`/api/reservations/${reservationId}/confirm`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Idempotency-Key': idempotencyKey,
        },
        body: JSON.stringify({
          paymentMethod: {
            type: 'card',
            token: cardToken,
          },
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        if (data.error?.code === 'ROOM_UNAVAILABLE') {
          alert('Sorry, this room was just booked by someone else. Please search again.')
          router.push('/')
        } else if (data.error?.code === 'RESERVATION_EXPIRED') {
          alert('Your reservation has expired. Please create a new reservation.')
          router.push('/')
        } else {
          throw new Error(data.error?.message || 'Payment failed')
        }
        return
      }

      // Success! Redirect to confirmation
      router.push(`/book/confirmation/${reservationId}`)
    } catch (err) {
      alert(err instanceof Error ? err.message : 'An error occurred during payment')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading reservation...</p>
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

  const expiresIn = reservation.expiresAt 
    ? Math.max(0, Math.floor((new Date(reservation.expiresAt).getTime() - Date.now()) / 1000 / 60))
    : 0

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-5xl">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Review & Complete Booking</h1>
          {expiresIn > 0 && (
            <p className="text-sm text-orange-600 mt-2">
              ⏱️ This price is held for {expiresIn} more minute{expiresIn !== 1 ? 's' : ''}
            </p>
          )}
        </div>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Hotel Summary */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-bold mb-4">Booking Summary</h2>
              <div className="space-y-2">
                <div>
                  <div className="font-semibold text-lg">{reservation.hotel.name}</div>
                  <div className="text-sm text-gray-600">{reservation.hotel.address}</div>
                </div>
                <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                  <div>
                    <div className="text-sm text-gray-600">Check-in</div>
                    <div className="font-semibold">{reservation.checkInDate}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">Check-out</div>
                    <div className="font-semibold">{reservation.checkOutDate}</div>
                  </div>
                </div>
                <div className="pt-2">
                  <div className="text-sm text-gray-600">Room</div>
                  <div className="font-semibold">
                    {reservation.numberOfRooms} × {reservation.roomType.name}
                  </div>
                </div>
              </div>
            </div>

            {/* Guest Details */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-bold mb-4">Guest Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    First Name *
                  </label>
                  <input
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Last Name *
                  </label>
                  <input
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email *
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <p className="text-xs text-gray-500 mt-1">Confirmation will be sent here</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone *
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Special Requests (Optional)
                </label>
                <textarea
                  value={specialRequests}
                  onChange={(e) => setSpecialRequests(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Late check-in, extra pillows, etc."
                />
              </div>
            </div>

            {/* Payment */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-bold mb-4">Payment Method</h2>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                <div className="flex items-center gap-2 text-blue-800">
                  <span>🔒</span>
                  <span className="text-sm font-semibold">Secure Payment (MVP Mock)</span>
                </div>
                <p className="text-xs text-blue-700 mt-1">
                  In production, this would integrate with Stripe for secure payment processing.
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Card Number (Mock)
                  </label>
                  <input
                    type="text"
                    value="4242 4242 4242 4242"
                    disabled
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Expiry (Mock)
                    </label>
                    <input
                      type="text"
                      value="12/25"
                      disabled
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      CVV (Mock)
                    </label>
                    <input
                      type="text"
                      value="123"
                      disabled
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Terms */}
            <div className="bg-white rounded-lg shadow p-6">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={agreedToTerms}
                  onChange={(e) => setAgreedToTerms(e.target.checked)}
                  className="mt-1 w-5 h-5"
                  required
                />
                <span className="text-sm text-gray-700">
                  I agree to the{' '}
                  <a href="#" className="text-blue-600 hover:underline">terms and conditions</a>
                  {' '}and{' '}
                  <a href="#" className="text-blue-600 hover:underline">cancellation policy</a>.
                  Free cancellation available until 24 hours before check-in.
                </span>
              </label>
            </div>
          </div>

          {/* Price Summary Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow p-6 sticky top-4">
              <h3 className="text-lg font-bold mb-4">Price Summary</h3>
              
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">
                    ${reservation.pricing.pricePerNight} × {reservation.numberOfNights} nights
                  </span>
                  <span className="font-semibold">${reservation.pricing.roomSubtotal}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Taxes & fees</span>
                  <span className="font-semibold">${reservation.pricing.taxesAndFees}</span>
                </div>
                <div className="border-t pt-3 flex justify-between text-lg">
                  <span className="font-bold">Total</span>
                  <span className="font-bold text-blue-600">${reservation.pricing.total}</span>
                </div>
              </div>

              <div className="mt-6 p-3 bg-green-50 rounded-lg text-sm text-green-700">
                <div className="flex items-center gap-2">
                  <span>✓</span>
                  <span>Free cancellation until 24h before</span>
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting || !agreedToTerms}
                className="w-full mt-6 px-6 py-4 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition text-lg"
              >
                {submitting ? 'Processing...' : `Complete Booking - $${reservation.pricing.total}`}
              </button>

              {submitting && (
                <div className="mt-3 text-sm text-gray-600 text-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600 mx-auto mb-2"></div>
                  Processing your payment...
                </div>
              )}
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}

