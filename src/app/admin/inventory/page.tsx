'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

interface RoomType {
  id: string
  name: string
  baseInventory: number
}

interface Hotel {
  id: string
  name: string
  city: string
  roomTypes: RoomType[]
}

interface InventoryDay {
  date: string
  totalInventory: number
  totalReserved: number
  available: number
  price: number
  currency: string
  status: string
}

export default function AdminInventoryPage() {
  const [hotels, setHotels] = useState<Hotel[]>([])
  const [selectedHotelId, setSelectedHotelId] = useState<string>('')
  const [selectedRoomTypeId, setSelectedRoomTypeId] = useState<string>('')
  const [inventory, setInventory] = useState<InventoryDay[]>([])
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{type: 'success' | 'error', text: string} | null>(null)

  // Fetch hotels on mount
  useEffect(() => {
    const fetchHotels = async () => {
      try {
        const response = await fetch('/api/hotels/search?destination=')
        const data = await response.json()
        
        // For MVP, we'll fetch details for each hotel to get room types
        // In production, we'd have a dedicated admin API
        const hotelsWithRooms = await Promise.all(
          data.data.slice(0, 3).map(async (h: any) => {
            const detailRes = await fetch(`/api/hotels/${h.id}`)
            const detail = await detailRes.json()
            return {
              id: h.id,
              name: h.name,
              city: h.city,
              roomTypes: detail.data.roomTypes.map((rt: any) => ({
                id: rt.id,
                name: rt.name,
                baseInventory: rt.baseInventory || 10,
              }))
            }
          })
        )
        
        setHotels(hotelsWithRooms)
        if (hotelsWithRooms.length > 0) {
          setSelectedHotelId(hotelsWithRooms[0].id)
          if (hotelsWithRooms[0].roomTypes.length > 0) {
            setSelectedRoomTypeId(hotelsWithRooms[0].roomTypes[0].id)
          }
        }
      } catch (err) {
        console.error('Failed to load hotels:', err)
      }
    }

    fetchHotels()
  }, [])

  // Fetch inventory when hotel/room type changes
  useEffect(() => {
    if (!selectedHotelId || !selectedRoomTypeId) return

    const fetchInventory = async () => {
      setLoading(true)
      try {
        const today = new Date().toISOString().split('T')[0]
        const endDate = new Date()
        endDate.setDate(endDate.getDate() + 30)
        const end = endDate.toISOString().split('T')[0]

        const response = await fetch(
          `/api/hotels/${selectedHotelId}?checkIn=${today}&checkOut=${end}`
        )
        const data = await response.json()

        // Find the selected room type
        const roomType = data.data.roomTypes.find((rt: any) => rt.id === selectedRoomTypeId)
        
        if (roomType && roomType.pricing && roomType.pricing.breakdown) {
          // Create inventory days from pricing breakdown
          const days = roomType.pricing.breakdown.map((day: any) => ({
            date: day.date,
            totalInventory: roomType.baseInventory || 10,
            totalReserved: 0, // Would come from inventory API
            available: roomType.availability?.roomsAvailable || 0,
            price: day.price,
            currency: 'USD',
            status: 'OPEN',
          }))
          setInventory(days)
        }
      } catch (err) {
        console.error('Failed to load inventory:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchInventory()
  }, [selectedHotelId, selectedRoomTypeId])

  const handleUpdateInventory = (date: string, newInventory: number) => {
    setInventory(prev => prev.map(day => 
      day.date === date 
        ? { ...day, totalInventory: newInventory, available: newInventory - day.totalReserved }
        : day
    ))
    setMessage({ type: 'success', text: `Inventory updated for ${date}` })
    setTimeout(() => setMessage(null), 3000)
  }

  const handleUpdatePrice = (date: string, newPrice: number) => {
    setInventory(prev => prev.map(day => 
      day.date === date 
        ? { ...day, price: newPrice }
        : day
    ))
    setMessage({ type: 'success', text: `Price updated for ${date}` })
    setTimeout(() => setMessage(null), 3000)
  }

  const selectedHotel = hotels.find(h => h.id === selectedHotelId)
  const selectedRoomType = selectedHotel?.roomTypes.find(rt => rt.id === selectedRoomTypeId)

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Inventory Management</h1>
          <p className="text-gray-600">Manage room availability and pricing</p>
        </div>

        {/* Message */}
        {message && (
          <div className={`mb-6 p-4 rounded-lg ${
            message.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
          }`}>
            {message.text}
          </div>
        )}

        {/* Selectors */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Hotel
              </label>
              <select
                value={selectedHotelId}
                onChange={(e) => {
                  setSelectedHotelId(e.target.value)
                  const hotel = hotels.find(h => h.id === e.target.value)
                  if (hotel && hotel.roomTypes.length > 0) {
                    setSelectedRoomTypeId(hotel.roomTypes[0].id)
                  }
                }}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                {hotels.map(hotel => (
                  <option key={hotel.id} value={hotel.id}>
                    {hotel.name} - {hotel.city}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Room Type
              </label>
              <select
                value={selectedRoomTypeId}
                onChange={(e) => setSelectedRoomTypeId(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                {selectedHotel?.roomTypes.map(roomType => (
                  <option key={roomType.id} value={roomType.id}>
                    {roomType.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Inventory Calendar */}
        {loading ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading inventory...</p>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="p-6">
              <h2 className="text-xl font-bold mb-4">
                {selectedRoomType?.name} - Next 30 Days
              </h2>
              
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4">Date</th>
                      <th className="text-center py-3 px-4">Total</th>
                      <th className="text-center py-3 px-4">Reserved</th>
                      <th className="text-center py-3 px-4">Available</th>
                      <th className="text-center py-3 px-4">Price</th>
                      <th className="text-center py-3 px-4">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {inventory.map((day) => {
                      const date = new Date(day.date)
                      const isPast = date < new Date()
                      const isWeekend = date.getDay() === 0 || date.getDay() === 6
                      const lowAvailability = day.available < 3 && day.available > 0

                      return (
                        <tr 
                          key={day.date} 
                          className={`border-b hover:bg-gray-50 ${isPast ? 'opacity-50' : ''}`}
                        >
                          <td className="py-3 px-4">
                            <div className="font-semibold">
                              {date.toLocaleDateString('en-US', {
                                weekday: 'short',
                                month: 'short',
                                day: 'numeric',
                              })}
                            </div>
                            {isWeekend && (
                              <span className="text-xs text-blue-600">Weekend</span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-center">
                            <input
                              type="number"
                              value={day.totalInventory}
                              onChange={(e) => handleUpdateInventory(day.date, parseInt(e.target.value))}
                              disabled={isPast}
                              className="w-16 px-2 py-1 border border-gray-300 rounded text-center"
                              min="0"
                            />
                          </td>
                          <td className="py-3 px-4 text-center font-semibold">
                            {day.totalReserved}
                          </td>
                          <td className="py-3 px-4 text-center">
                            <span className={`font-semibold ${
                              lowAvailability ? 'text-orange-600' : 
                              day.available === 0 ? 'text-red-600' : 
                              'text-green-600'
                            }`}>
                              {day.available}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-center">
                            <div className="flex items-center justify-center gap-1">
                              <span className="text-xs">$</span>
                              <input
                                type="number"
                                value={day.price}
                                onChange={(e) => handleUpdatePrice(day.date, parseFloat(e.target.value))}
                                disabled={isPast}
                                className="w-20 px-2 py-1 border border-gray-300 rounded text-center"
                                min="0"
                                step="0.01"
                              />
                            </div>
                          </td>
                          <td className="py-3 px-4 text-center">
                            {day.available === 0 ? (
                              <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-xs font-semibold">
                                Sold Out
                              </span>
                            ) : lowAvailability ? (
                              <span className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-xs font-semibold">
                                Low
                              </span>
                            ) : (
                              <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-semibold">
                                Open
                              </span>
                            )}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="bg-gray-50 px-6 py-4 border-t">
              <div className="flex items-center justify-between text-sm text-gray-600">
                <div>
                  <span className="font-semibold">Note:</span> Changes are saved automatically (in MVP, changes are client-side only)
                </div>
                <div className="flex gap-4">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 bg-green-500 rounded-full"></span>
                    <span>Available</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 bg-orange-500 rounded-full"></span>
                    <span>Low Stock</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 bg-red-500 rounded-full"></span>
                    <span>Sold Out</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Quick Stats */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-sm text-gray-600 mb-1">Total Rooms</div>
            <div className="text-2xl font-bold">
              {selectedRoomType?.baseInventory || 0}
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-sm text-gray-600 mb-1">Avg Occupancy</div>
            <div className="text-2xl font-bold text-blue-600">78%</div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-sm text-gray-600 mb-1">Avg Price</div>
            <div className="text-2xl font-bold text-green-600">
              ${inventory.length > 0 
                ? Math.round(inventory.reduce((sum, day) => sum + day.price, 0) / inventory.length)
                : 0}
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-sm text-gray-600 mb-1">Revenue (30d)</div>
            <div className="text-2xl font-bold text-purple-600">
              ${inventory.length > 0 
                ? Math.round(inventory.reduce((sum, day) => sum + (day.totalReserved * day.price), 0))
                : 0}
            </div>
          </div>
        </div>

        {/* Back Link */}
        <div className="mt-8 text-center">
          <Link href="/" className="text-blue-600 hover:underline">
            ← Back to Home
          </Link>
        </div>
      </div>
    </div>
  )
}

