'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function HomePage() {
  const router = useRouter()
  const [destination, setDestination] = useState('Seattle')
  const [checkIn, setCheckIn] = useState('')
  const [checkOut, setCheckOut] = useState('')
  const [guests, setGuests] = useState(2)
  const [rooms, setRooms] = useState(1)

  // Set default dates (tomorrow and day after)
  useState(() => {
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    const dayAfter = new Date()
    dayAfter.setDate(dayAfter.getDate() + 4)
    
    setCheckIn(tomorrow.toISOString().split('T')[0])
    setCheckOut(dayAfter.toISOString().split('T')[0])
  })

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    
    const params = new URLSearchParams({
      destination,
      checkIn,
      checkOut,
      guests: guests.toString(),
      rooms: rooms.toString(),
    })

    router.push(`/search?${params.toString()}`)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Hero Section */}
      <div className="relative h-[500px] bg-cover bg-center" style={{
        backgroundImage: 'url(https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=1600)',
      }}>
        <div className="absolute inset-0 bg-black/40" />
        <div className="relative container mx-auto px-4 h-full flex flex-col justify-center items-center text-white">
          <h1 className="text-5xl font-bold mb-4 text-center">Find Your Perfect Stay</h1>
          <p className="text-xl mb-8 text-center">Book hotels with confidence - Zero overbooking guarantee</p>
        </div>
      </div>

      {/* Search Form */}
      <div className="container mx-auto px-4 -mt-20 relative z-10">
        <form onSubmit={handleSearch} className="bg-white rounded-lg shadow-2xl p-8 max-w-4xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {/* Destination */}
            <div className="lg:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Destination
              </label>
              <input
                type="text"
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                placeholder="City or hotel name"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>

            {/* Check-in */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Check-in
              </label>
              <input
                type="date"
                value={checkIn}
                onChange={(e) => setCheckIn(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>

            {/* Check-out */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Check-out
              </label>
              <input
                type="date"
                value={checkOut}
                onChange={(e) => setCheckOut(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>

            {/* Guests & Rooms */}
            <div className="lg:col-span-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Guests & Rooms
              </label>
              <div className="flex gap-2">
                <input
                  type="number"
                  value={guests}
                  onChange={(e) => setGuests(parseInt(e.target.value))}
                  min="1"
                  max="8"
                  className="w-1/2 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  title="Guests"
                />
                <input
                  type="number"
                  value={rooms}
                  onChange={(e) => setRooms(parseInt(e.target.value))}
                  min="1"
                  max="4"
                  className="w-1/2 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  title="Rooms"
                />
              </div>
            </div>
          </div>

          {/* Search Button */}
          <div className="mt-6">
            <button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-4 px-6 rounded-lg transition duration-200 text-lg"
            >
              Search Hotels
            </button>
          </div>
        </form>
      </div>

      {/* Features */}
      <div className="container mx-auto px-4 py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
          <div className="text-center">
            <div className="text-4xl mb-4">🔒</div>
            <h3 className="text-xl font-bold mb-2">Zero Overbooking</h3>
            <p className="text-gray-600">Advanced locking system ensures your reservation is guaranteed</p>
          </div>
          <div className="text-center">
            <div className="text-4xl mb-4">⚡</div>
            <h3 className="text-xl font-bold mb-2">Instant Confirmation</h3>
            <p className="text-gray-600">Get your booking confirmed in seconds, not minutes</p>
          </div>
          <div className="text-center">
            <div className="text-4xl mb-4">🔄</div>
            <h3 className="text-xl font-bold mb-2">Flexible Cancellation</h3>
            <p className="text-gray-600">Free cancellation available on most bookings</p>
          </div>
        </div>
      </div>

      {/* Popular Destinations */}
      <div className="container mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold text-center mb-8">Popular Destinations</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
          {['Seattle', 'Portland', 'San Francisco'].map((city) => (
            <button
              key={city}
              onClick={() => {
                setDestination(city)
                handleSearch(new Event('submit') as any)
              }}
              className="relative h-48 rounded-lg overflow-hidden group cursor-pointer"
            >
              <img
                src={`https://images.unsplash.com/photo-${
                  city === 'Seattle' ? '1551882547-ff40c63fe5fa' :
                  city === 'Portland' ? '1520250497591-112f2f40a3f4' :
                  '1445019980597-93fa8acb246c'
                }?w=400`}
                alt={city}
                className="w-full h-full object-cover group-hover:scale-110 transition duration-300"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent flex items-end">
                <h3 className="text-white text-2xl font-bold p-4">{city}</h3>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
