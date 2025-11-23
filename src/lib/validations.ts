import { z } from 'zod'

export const searchSchema = z.object({
  destination: z.string().min(2, 'Destination must be at least 2 characters'),
  checkIn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format'),
  checkOut: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format'),
  guests: z.coerce.number().int().min(1).max(8),
  rooms: z.coerce.number().int().min(1).max(4).optional().default(1),
}).refine((data) => {
  const checkIn = new Date(data.checkIn)
  const checkOut = new Date(data.checkOut)
  return checkOut > checkIn
}, {
  message: 'Check-out date must be after check-in date',
  path: ['checkOut']
}).refine((data) => {
  const checkIn = new Date(data.checkIn)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return checkIn >= today
}, {
  message: 'Check-in date must be today or in the future',
  path: ['checkIn']
})

export const reservationCreateSchema = z.object({
  hotelId: z.string().uuid(),
  roomTypeId: z.string().uuid(),
  checkInDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  checkOutDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  numberOfRooms: z.number().int().min(1).max(4),
  guest: z.object({
    firstName: z.string().min(1),
    lastName: z.string().min(1),
    email: z.string().email(),
    phone: z.string().optional(),
  }),
  specialRequests: z.string().optional(),
}).refine((data) => {
  const checkIn = new Date(data.checkInDate)
  const checkOut = new Date(data.checkOutDate)
  return checkOut > checkIn
}, {
  message: 'Check-out date must be after check-in date'
})

export const reservationConfirmSchema = z.object({
  paymentMethod: z.object({
    type: z.enum(['card', 'paypal']),
    token: z.string().min(1),
  }),
})

