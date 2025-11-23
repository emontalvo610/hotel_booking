// Type definitions for the hotel booking system

export interface SearchParams {
  destination: string
  checkIn: string
  checkOut: string
  guests: number
  rooms?: number
}

export interface HotelSearchResult {
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

export interface RoomTypeWithAvailability {
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
  }
  availability: {
    isAvailable: boolean
    roomsAvailable: number
  }
}

export interface ReservationCreate {
  hotelId: string
  roomTypeId: string
  checkInDate: string
  checkOutDate: string
  numberOfRooms: number
  guest: {
    firstName: string
    lastName: string
    email: string
    phone?: string
  }
  specialRequests?: string
}

export interface ReservationConfirm {
  paymentMethod: {
    type: string
    token: string
  }
}

