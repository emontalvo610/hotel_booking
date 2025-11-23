# API Design

## Table of Contents
1. [Overview](#1-overview)
2. [API Architecture](#2-api-architecture)
3. [Authentication & Authorization](#3-authentication--authorization)
4. [Public APIs (Client-Facing)](#4-public-apis-client-facing)
5. [Admin APIs (Hotel Extranet)](#5-admin-apis-hotel-extranet)
6. [Internal Microservice APIs](#6-internal-microservice-apis)
7. [Error Handling](#7-error-handling)
8. [Rate Limiting & Security](#8-rate-limiting--security)

---

## 1. Overview

### 1.1 API Design Principles

**RESTful:** 
- Resources identified by URLs
- HTTP methods (GET, POST, PUT, DELETE) for CRUD operations
- Stateless requests
- JSON request/response bodies

**Versioning:**
- URL-based versioning: `/v1/`, `/v2/`
- Allows backward compatibility
- Deprecation policy: 6 months notice

**Idempotency:**
- POST/PUT operations support `Idempotency-Key` header
- Prevents duplicate bookings/payments
- 24-hour key retention

**Pagination:**
- Cursor-based for large datasets
- Page-based for simpler UIs
- Default page size: 20, max: 100

**Filtering & Sorting:**
- Query parameters for filtering
- `sort` parameter with `+` (asc) or `-` (desc)

---

### 1.2 Base URLs

**Production:**
```
https://api.hotel-booking.com/v1
```

**Staging:**
```
https://api-staging.hotel-booking.com/v1
```

**Development:**
```
http://localhost:3000/api/v1
```

---

### 1.3 Common Headers

**Request Headers:**
```http
Content-Type: application/json
Accept: application/json
Authorization: Bearer <token>
Idempotency-Key: <uuid>  (optional, for POST operations)
X-Request-ID: <uuid>     (optional, for tracing)
```

**Response Headers:**
```http
Content-Type: application/json
X-Request-ID: <uuid>
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
X-RateLimit-Reset: 1640995200
```

---

### 1.4 HTTP Status Codes

| Code | Meaning | Usage |
|------|---------|-------|
| 200 | OK | Successful GET, PUT, PATCH |
| 201 | Created | Successful POST (resource created) |
| 204 | No Content | Successful DELETE |
| 400 | Bad Request | Invalid request data |
| 401 | Unauthorized | Missing/invalid authentication |
| 403 | Forbidden | Authenticated but not authorized |
| 404 | Not Found | Resource doesn't exist |
| 409 | Conflict | Business logic conflict (e.g., sold out) |
| 422 | Unprocessable Entity | Validation error |
| 429 | Too Many Requests | Rate limit exceeded |
| 500 | Internal Server Error | Server error |
| 503 | Service Unavailable | Temporary outage |

---

## 2. API Architecture

### 2.1 Service Architecture

```
┌─────────────────────────────────────────────┐
│          Public API Gateway                  │
│  (Authentication, Rate Limiting, Routing)   │
└──────────────┬──────────────────────────────┘
               │
      ┌────────┼────────┬────────┬────────┐
      │        │        │        │        │
      ▼        ▼        ▼        ▼        ▼
┌──────────┐ ┌────┐ ┌─────┐ ┌─────┐ ┌──────┐
│  Hotel   │ │Rate│ │Res. │ │Guest│ │ Pay  │
│ Service  │ │Svc │ │Svc  │ │ Svc │ │ Svc  │
└──────────┘ └────┘ └─────┘ └─────┘ └──────┘
     │         │       │       │        │
     └─────────┴───────┴───────┴────────┘
                      │
                ┌─────▼──────┐
                │  Database  │
                └────────────┘
```

---

### 2.2 API Gateway Responsibilities

1. **Authentication:** Verify JWT tokens
2. **Rate Limiting:** Enforce per-user/IP limits
3. **Routing:** Forward to appropriate microservice
4. **Request Validation:** Basic schema validation
5. **Response Transformation:** Standardize response format
6. **Logging & Monitoring:** Centralized logging
7. **CORS:** Handle cross-origin requests

---

## 3. Authentication & Authorization

### 3.1 Authentication Methods

**Guest Users (Public API):**
- Option 1: No auth (anonymous booking with email)
- Option 2: JWT token (for logged-in users)

**Hotel Staff (Admin API):**
- JWT token (required)
- Role: `hotel_admin`, `hotel_staff`

**Request:**
```http
Authorization: Bearer <JWT_TOKEN>
```

---

### 3.2 JWT Token Structure

```json
{
  "sub": "user-id-123",
  "email": "alex@example.com",
  "role": "guest",
  "iat": 1640995200,
  "exp": 1641081600
}
```

**Token Expiration:**
- Access token: 1 hour
- Refresh token: 30 days

---

### 3.3 Authorization Rules

| Endpoint | Guest | Hotel Staff | Admin |
|----------|-------|-------------|-------|
| Search hotels | ✅ | ✅ | ✅ |
| View hotel details | ✅ | ✅ | ✅ |
| Create reservation | ✅ | ✅ | ✅ |
| View own reservation | ✅ | ❌ | ✅ |
| Manage inventory | ❌ | ✅ (own hotel) | ✅ |
| View all bookings | ❌ | ✅ (own hotel) | ✅ |

---

## 4. Public APIs (Client-Facing)

### 4.1 Search Hotels

**Endpoint:** `GET /v1/hotels/search`

**Description:** Search for available hotels by destination and dates.

**Query Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| destination | string | Yes | City name or hotel name |
| checkIn | date | Yes | Check-in date (YYYY-MM-DD) |
| checkOut | date | Yes | Check-out date (YYYY-MM-DD) |
| guests | integer | Yes | Number of guests |
| rooms | integer | No | Number of rooms (default: 1) |
| minPrice | decimal | No | Minimum price per night |
| maxPrice | decimal | No | Maximum price per night |
| starRating | integer | No | Minimum star rating (1-5) |
| amenities | string[] | No | Filter by amenities (comma-separated) |
| sort | string | No | Sort by: `price`, `-price`, `rating`, `distance` |
| page | integer | No | Page number (default: 1) |
| pageSize | integer | No | Results per page (default: 20, max: 100) |

**Request Example:**
```http
GET /v1/hotels/search?destination=seattle&checkIn=2025-01-02&checkOut=2025-01-05&guests=2&rooms=1&sort=price
```

**Response: 200 OK**
```json
{
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "name": "Seattle Downtown Hotel",
      "description": "Modern hotel in the heart of downtown Seattle...",
      "address": "1234 Pike Street",
      "city": "Seattle",
      "state": "WA",
      "country": "USA",
      "starRating": 4,
      "guestRating": 4.2,
      "reviewCount": 234,
      "latitude": 47.6062,
      "longitude": -122.3321,
      "images": [
        "https://cdn.example.com/hotel1/image1.jpg",
        "https://cdn.example.com/hotel1/image2.jpg"
      ],
      "amenities": ["wifi", "parking", "pool", "gym"],
      "pricing": {
        "minPricePerNight": 120.00,
        "currency": "USD",
        "totalPrice": 360.00
      },
      "availability": {
        "isAvailable": true,
        "lowInventory": true,
        "roomsLeft": 2
      },
      "distanceFromCenter": 0.5,
      "distanceUnit": "mi"
    }
  ],
  "pagination": {
    "page": 1,
    "pageSize": 20,
    "total": 134,
    "totalPages": 7
  },
  "meta": {
    "searchCriteria": {
      "destination": "seattle",
      "checkIn": "2025-01-02",
      "checkOut": "2025-01-05",
      "guests": 2,
      "rooms": 1
    }
  }
}
```

**Error Responses:**

**400 Bad Request:**
```json
{
  "error": {
    "code": "INVALID_DATE_RANGE",
    "message": "Check-out date must be after check-in date",
    "details": {
      "checkIn": "2025-01-05",
      "checkOut": "2025-01-02"
    }
  }
}
```

---

### 4.2 Get Hotel Details

**Endpoint:** `GET /v1/hotels/{hotelId}`

**Description:** Get detailed information about a specific hotel.

**Path Parameters:**
- `hotelId` (UUID, required): Hotel ID

**Query Parameters:**
- `checkIn` (date, optional): Check-in date for room availability
- `checkOut` (date, optional): Check-out date for room availability
- `guests` (integer, optional): Number of guests

**Request Example:**
```http
GET /v1/hotels/550e8400-e29b-41d4-a716-446655440000?checkIn=2025-01-02&checkOut=2025-01-05&guests=2
```

**Response: 200 OK**
```json
{
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "Seattle Downtown Hotel",
    "description": "Experience luxury in the heart of downtown Seattle...",
    "address": "1234 Pike Street",
    "city": "Seattle",
    "state": "WA",
    "country": "USA",
    "postalCode": "98101",
    "latitude": 47.6062,
    "longitude": -122.3321,
    "starRating": 4,
    "guestRating": 4.2,
    "reviewCount": 234,
    "phone": "+1-206-555-1234",
    "email": "info@seattlehotel.com",
    "checkInTime": "15:00",
    "checkOutTime": "11:00",
    "images": [
      {
        "url": "https://cdn.example.com/hotel1/exterior.jpg",
        "caption": "Hotel Exterior",
        "type": "exterior"
      },
      {
        "url": "https://cdn.example.com/hotel1/lobby.jpg",
        "caption": "Lobby",
        "type": "lobby"
      }
    ],
    "amenities": [
      {
        "id": "wifi",
        "name": "Free WiFi",
        "icon": "wifi"
      },
      {
        "id": "pool",
        "name": "Swimming Pool",
        "icon": "pool"
      }
    ],
    "policies": {
      "cancellation": {
        "freeCancellationHours": 24,
        "description": "Free cancellation until 24 hours before check-in. After that, 50% refund."
      },
      "pets": {
        "allowed": true,
        "fee": 50,
        "description": "Pets under 25 lbs allowed with $50 fee."
      },
      "ageRequirement": {
        "minimumAge": 18,
        "description": "Guests must be 18 or older to check in."
      }
    },
    "roomTypes": [
      {
        "id": "7c9e6679-7425-40de-944b-e07fc1f90ae7",
        "name": "Deluxe King Room",
        "description": "Spacious room with a king bed and city views.",
        "sizeSqft": 350,
        "maxOccupancy": 2,
        "bedType": "1 King Bed",
        "viewType": "City View",
        "images": [
          "https://cdn.example.com/room1/image1.jpg"
        ],
        "amenities": ["wifi", "mini_fridge", "coffee_maker", "smart_tv"],
        "pricing": {
          "pricePerNight": 120.00,
          "totalPrice": 360.00,
          "currency": "USD",
          "breakdown": [
            {"date": "2025-01-02", "price": 120.00},
            {"date": "2025-01-03", "price": 120.00},
            {"date": "2025-01-04", "price": 120.00}
          ],
          "taxesAndFees": 40.00,
          "total": 400.00
        },
        "availability": {
          "isAvailable": true,
          "roomsAvailable": 2
        },
        "cancellationPolicy": {
          "isRefundable": true,
          "freeCancellationUntil": "2025-01-01T15:00:00Z"
        }
      }
    ]
  }
}
```

**Error Responses:**

**404 Not Found:**
```json
{
  "error": {
    "code": "HOTEL_NOT_FOUND",
    "message": "Hotel with ID 550e8400-e29b-41d4-a716-446655440000 not found"
  }
}
```

---

### 4.3 Get Room Type Availability

**Endpoint:** `GET /v1/hotels/{hotelId}/room-types/{roomTypeId}/availability`

**Description:** Check availability for a specific room type.

**Path Parameters:**
- `hotelId` (UUID, required)
- `roomTypeId` (UUID, required)

**Query Parameters:**
- `checkIn` (date, required)
- `checkOut` (date, required)
- `rooms` (integer, optional, default: 1)

**Request Example:**
```http
GET /v1/hotels/550e8400.../room-types/7c9e6679.../availability?checkIn=2025-01-02&checkOut=2025-01-05&rooms=2
```

**Response: 200 OK**
```json
{
  "data": {
    "isAvailable": true,
    "roomsAvailable": 3,
    "requestedRooms": 2,
    "pricing": {
      "pricePerNight": 120.00,
      "nights": 3,
      "totalRoomPrice": 720.00,
      "taxesAndFees": 80.00,
      "total": 800.00,
      "currency": "USD"
    },
    "dailyBreakdown": [
      {"date": "2025-01-02", "pricePerNight": 120.00, "available": 3},
      {"date": "2025-01-03", "pricePerNight": 120.00, "available": 3},
      {"date": "2025-01-04", "pricePerNight": 120.00, "available": 3}
    ]
  }
}
```

**Response: 409 Conflict (Not Available)**
```json
{
  "error": {
    "code": "INSUFFICIENT_AVAILABILITY",
    "message": "Only 1 room available for requested dates",
    "details": {
      "roomsAvailable": 1,
      "requestedRooms": 2,
      "unavailableDates": ["2025-01-03"]
    }
  }
}
```

---

### 4.4 Create Reservation (Step 1)

**Endpoint:** `POST /v1/reservations`

**Description:** Create a reservation draft (PENDING status). This reserves the room temporarily while user proceeds to payment.

**Request Headers:**
```http
Content-Type: application/json
Idempotency-Key: 8971f4f4-5a1b-4c2d-9e3f-1a2b3c4d5e6f
```

**Request Body:**
```json
{
  "hotelId": "550e8400-e29b-41d4-a716-446655440000",
  "roomTypeId": "7c9e6679-7425-40de-944b-e07fc1f90ae7",
  "checkInDate": "2025-01-02",
  "checkOutDate": "2025-01-05",
  "numberOfRooms": 2,
  "guest": {
    "firstName": "Alex",
    "lastName": "Kim",
    "email": "alex@example.com",
    "phone": "+1-555-1234"
  },
  "specialRequests": "Late check-in, please."
}
```

**Response: 201 Created**
```json
{
  "data": {
    "reservationId": "abc12345-6789-4def-gh12-ijklmnop3456",
    "status": "PENDING",
    "hotel": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "name": "Seattle Downtown Hotel",
      "address": "1234 Pike Street, Seattle, WA"
    },
    "roomType": {
      "id": "7c9e6679-7425-40de-944b-e07fc1f90ae7",
      "name": "Deluxe King Room"
    },
    "checkInDate": "2025-01-02",
    "checkOutDate": "2025-01-05",
    "numberOfRooms": 2,
    "numberOfNights": 3,
    "guest": {
      "firstName": "Alex",
      "lastName": "Kim",
      "email": "alex@example.com"
    },
    "pricing": {
      "pricePerNight": 120.00,
      "roomSubtotal": 720.00,
      "taxesAndFees": 80.00,
      "total": 800.00,
      "currency": "USD"
    },
    "cancellationPolicy": {
      "isRefundable": true,
      "freeCancellationUntil": "2025-01-01T15:00:00Z",
      "description": "Free cancellation until 24 hours before check-in."
    },
    "expiresAt": "2025-01-01T10:15:00Z"
  }
}
```

**Error Responses:**

**409 Conflict (Sold Out):**
```json
{
  "error": {
    "code": "ROOM_UNAVAILABLE",
    "message": "The requested room type is no longer available for these dates",
    "details": {
      "roomTypeId": "7c9e6679-7425-40de-944b-e07fc1f90ae7",
      "checkInDate": "2025-01-02",
      "checkOutDate": "2025-01-05"
    }
  }
}
```

**422 Unprocessable Entity (Validation Error):**
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Request validation failed",
    "details": {
      "errors": [
        {
          "field": "guest.email",
          "message": "Invalid email format"
        }
      ]
    }
  }
}
```

---

### 4.5 Confirm Reservation (Step 2)

**Endpoint:** `POST /v1/reservations/{reservationId}/confirm`

**Description:** Confirm reservation by processing payment. Changes status from PENDING to PAID.

**Path Parameters:**
- `reservationId` (UUID, required)

**Request Headers:**
```http
Content-Type: application/json
Idempotency-Key: 8971f4f4-5a1b-4c2d-9e3f-1a2b3c4d5e6f
Authorization: Bearer <token> (optional, for logged-in users)
```

**Request Body:**
```json
{
  "paymentMethod": {
    "type": "card",
    "token": "tok_stripe_abc123...",
    "cardLast4": "1234",
    "cardBrand": "visa"
  }
}
```

**Response: 200 OK**
```json
{
  "data": {
    "reservationId": "abc12345-6789-4def-gh12-ijklmnop3456",
    "confirmationNumber": "BK-123456",
    "status": "PAID",
    "hotel": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "name": "Seattle Downtown Hotel",
      "address": "1234 Pike Street, Seattle, WA",
      "phone": "+1-206-555-1234"
    },
    "roomType": {
      "name": "Deluxe King Room"
    },
    "checkInDate": "2025-01-02",
    "checkInTime": "15:00",
    "checkOutDate": "2025-01-05",
    "checkOutTime": "11:00",
    "numberOfRooms": 2,
    "guest": {
      "firstName": "Alex",
      "lastName": "Kim",
      "email": "alex@example.com"
    },
    "payment": {
      "amount": 800.00,
      "currency": "USD",
      "method": "Visa ending in 1234",
      "status": "SUCCEEDED",
      "paidAt": "2025-01-01T10:05:32Z"
    },
    "cancellationPolicy": {
      "isRefundable": true,
      "freeCancellationUntil": "2025-01-01T15:00:00Z"
    },
    "confirmedAt": "2025-01-01T10:05:32Z"
  }
}
```

**Error Responses:**

**402 Payment Required (Payment Failed):**
```json
{
  "error": {
    "code": "PAYMENT_FAILED",
    "message": "Payment could not be processed",
    "details": {
      "reason": "card_declined",
      "providerMessage": "Your card was declined"
    }
  }
}
```

**409 Conflict (Already Confirmed):**
```json
{
  "error": {
    "code": "RESERVATION_ALREADY_CONFIRMED",
    "message": "This reservation has already been confirmed",
    "details": {
      "reservationId": "abc12345-6789-4def-gh12-ijklmnop3456",
      "confirmationNumber": "BK-123456",
      "status": "PAID"
    }
  }
}
```

**410 Gone (Reservation Expired):**
```json
{
  "error": {
    "code": "RESERVATION_EXPIRED",
    "message": "This reservation has expired. Please create a new reservation.",
    "details": {
      "expiresAt": "2025-01-01T10:00:00Z"
    }
  }
}
```

---

### 4.6 Get Reservation

**Endpoint:** `GET /v1/reservations/{reservationId}`

**Description:** Retrieve reservation details.

**Path Parameters:**
- `reservationId` (UUID, required)

**Query Parameters (for guest lookup without auth):**
- `email` (string, optional): Guest email for verification

**Request Example:**
```http
GET /v1/reservations/abc12345-6789-4def-gh12-ijklmnop3456?email=alex@example.com
```

**Response: 200 OK**
```json
{
  "data": {
    "reservationId": "abc12345-6789-4def-gh12-ijklmnop3456",
    "confirmationNumber": "BK-123456",
    "status": "PAID",
    "hotel": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "name": "Seattle Downtown Hotel",
      "address": "1234 Pike Street, Seattle, WA",
      "city": "Seattle",
      "state": "WA",
      "country": "USA",
      "phone": "+1-206-555-1234",
      "latitude": 47.6062,
      "longitude": -122.3321
    },
    "roomType": {
      "name": "Deluxe King Room",
      "bedType": "1 King Bed",
      "maxOccupancy": 2
    },
    "checkInDate": "2025-01-02",
    "checkInTime": "15:00",
    "checkOutDate": "2025-01-05",
    "checkOutTime": "11:00",
    "numberOfRooms": 2,
    "numberOfNights": 3,
    "guest": {
      "firstName": "Alex",
      "lastName": "Kim",
      "email": "alex@example.com",
      "phone": "+1-555-1234"
    },
    "payment": {
      "amount": 800.00,
      "currency": "USD",
      "method": "Visa ending in 1234",
      "status": "SUCCEEDED"
    },
    "cancellationPolicy": {
      "isRefundable": true,
      "freeCancellationUntil": "2025-01-01T15:00:00Z",
      "refundPercentage": 100,
      "description": "Free cancellation until 24 hours before check-in. After that, 50% refund."
    },
    "specialRequests": "Late check-in, please.",
    "createdAt": "2025-01-01T10:00:00Z",
    "confirmedAt": "2025-01-01T10:05:32Z"
  }
}
```

---

### 4.7 List Reservations (Guest)

**Endpoint:** `GET /v1/reservations`

**Description:** List reservations for a guest (requires auth or email verification).

**Query Parameters:**
- `email` (string, optional): Guest email (for unauthenticated lookup)
- `status` (string, optional): Filter by status (`PENDING`, `PAID`, `CANCELLED`)
- `page` (integer, optional): Page number
- `pageSize` (integer, optional): Results per page

**Request Example:**
```http
GET /v1/reservations?email=alex@example.com&status=PAID
Authorization: Bearer <token>
```

**Response: 200 OK**
```json
{
  "data": [
    {
      "reservationId": "abc12345-6789-4def-gh12-ijklmnop3456",
      "confirmationNumber": "BK-123456",
      "status": "PAID",
      "hotel": {
        "name": "Seattle Downtown Hotel",
        "city": "Seattle"
      },
      "checkInDate": "2025-01-02",
      "checkOutDate": "2025-01-05",
      "totalPrice": 800.00,
      "currency": "USD",
      "createdAt": "2025-01-01T10:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "pageSize": 20,
    "total": 1,
    "totalPages": 1
  }
}
```

---

### 4.8 Cancel Reservation

**Endpoint:** `POST /v1/reservations/{reservationId}/cancel`

**Description:** Cancel a confirmed reservation.

**Path Parameters:**
- `reservationId` (UUID, required)

**Request Headers:**
```http
Content-Type: application/json
Authorization: Bearer <token> (optional)
```

**Request Body:**
```json
{
  "reason": "change_of_plans",
  "guestEmail": "alex@example.com"
}
```

**Response: 200 OK**
```json
{
  "data": {
    "reservationId": "abc12345-6789-4def-gh12-ijklmnop3456",
    "status": "CANCELLED",
    "cancelledAt": "2025-01-01T12:00:00Z",
    "refund": {
      "amount": 800.00,
      "currency": "USD",
      "percentage": 100,
      "estimatedRefundDate": "2025-01-08",
      "method": "Visa ending in 1234",
      "description": "Full refund due to cancellation within free cancellation period."
    }
  }
}
```

**Error Responses:**

**409 Conflict (Cannot Cancel):**
```json
{
  "error": {
    "code": "CANCELLATION_NOT_ALLOWED",
    "message": "This reservation cannot be cancelled",
    "details": {
      "reason": "past_check_in",
      "checkInDate": "2025-01-02"
    }
  }
}
```

**422 Unprocessable Entity (Partial Refund):**
```json
{
  "data": {
    "reservationId": "abc12345-6789-4def-gh12-ijklmnop3456",
    "status": "CANCELLED",
    "cancelledAt": "2025-01-01T20:00:00Z",
    "refund": {
      "amount": 400.00,
      "currency": "USD",
      "percentage": 50,
      "estimatedRefundDate": "2025-01-08",
      "method": "Visa ending in 1234",
      "description": "50% refund due to cancellation after free cancellation period."
    },
    "warning": "Cancellation outside free cancellation window. Only 50% refundable."
  }
}
```

---

## 5. Admin APIs (Hotel Extranet)

### 5.1 Authentication

**All admin endpoints require authentication:**
```http
Authorization: Bearer <JWT_TOKEN>
```

**Token must have role:** `hotel_admin` or `hotel_staff`

---

### 5.2 Get Inventory Calendar

**Endpoint:** `GET /v1/admin/hotels/{hotelId}/inventory`

**Description:** Get inventory calendar for all room types.

**Path Parameters:**
- `hotelId` (UUID, required)

**Query Parameters:**
- `roomTypeId` (UUID, optional): Filter by room type
- `from` (date, required): Start date
- `to` (date, required): End date

**Request Example:**
```http
GET /v1/admin/hotels/550e8400.../inventory?roomTypeId=7c9e6679...&from=2025-01-01&to=2025-01-31
Authorization: Bearer <token>
```

**Response: 200 OK**
```json
{
  "data": {
    "hotelId": "550e8400-e29b-41d4-a716-446655440000",
    "roomTypes": [
      {
        "roomTypeId": "7c9e6679-7425-40de-944b-e07fc1f90ae7",
        "name": "Deluxe King Room",
        "inventory": [
          {
            "date": "2025-01-01",
            "totalInventory": 10,
            "totalReserved": 8,
            "available": 2,
            "price": 120.00,
            "currency": "USD",
            "status": "OPEN"
          },
          {
            "date": "2025-01-02",
            "totalInventory": 10,
            "totalReserved": 9,
            "available": 1,
            "price": 120.00,
            "currency": "USD",
            "status": "OPEN"
          }
        ]
      }
    ]
  }
}
```

---

### 5.3 Update Inventory

**Endpoint:** `PUT /v1/admin/hotels/{hotelId}/room-types/{roomTypeId}/inventory`

**Description:** Bulk update inventory for a room type across a date range.

**Request Body:**
```json
{
  "from": "2025-01-10",
  "to": "2025-01-20",
  "totalInventory": 12
}
```

**Response: 200 OK**
```json
{
  "data": {
    "updated": 11,
    "dates": ["2025-01-10", "2025-01-11", "...", "2025-01-20"]
  }
}
```

---

### 5.4 Update Pricing

**Endpoint:** `PUT /v1/admin/hotels/{hotelId}/room-types/{roomTypeId}/pricing`

**Description:** Bulk update pricing for a room type across a date range.

**Request Body:**
```json
{
  "from": "2025-01-10",
  "to": "2025-01-20",
  "price": 150.00,
  "currency": "USD"
}
```

**Response: 200 OK**
```json
{
  "data": {
    "updated": 11,
    "dates": ["2025-01-10", "2025-01-11", "...", "2025-01-20"]
  }
}
```

---

### 5.5 List Bookings (Admin)

**Endpoint:** `GET /v1/admin/hotels/{hotelId}/bookings`

**Description:** List all bookings for a hotel.

**Query Parameters:**
- `status` (string, optional): Filter by status
- `checkInDate` (date, optional): Filter by check-in date
- `guestName` (string, optional): Search by guest name
- `confirmationNumber` (string, optional): Search by confirmation number
- `page` (integer, optional)
- `pageSize` (integer, optional)

**Response: 200 OK**
```json
{
  "data": [
    {
      "reservationId": "abc12345...",
      "confirmationNumber": "BK-123456",
      "status": "PAID",
      "guest": {
        "name": "Alex Kim",
        "email": "alex@example.com",
        "phone": "+1-555-1234"
      },
      "roomType": "Deluxe King Room",
      "checkInDate": "2025-01-02",
      "checkOutDate": "2025-01-05",
      "numberOfRooms": 2,
      "totalPrice": 800.00,
      "createdAt": "2025-01-01T10:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "pageSize": 20,
    "total": 45
  }
}
```

---

## 6. Internal Microservice APIs

### 6.1 Service-to-Service Communication

**Protocol:** gRPC or HTTP/JSON

**Authentication:** Service tokens (JWT or mTLS)

**Example Services:**

1. **Hotel Service:**
   - `getHotel(hotelId)`
   - `searchHotels(query)`

2. **Rate Service:**
   - `getRoomPrice(hotelId, roomTypeId, dateRange)`
   - `updateRoomPrice(...)`

3. **Reservation Service:**
   - `checkAvailability(hotelId, roomTypeId, dates, rooms)`
   - `createReservation(...)`
   - `confirmReservation(reservationId, payment)`

4. **Payment Service:**
   - `chargePayment(amount, paymentMethod)`
   - `refundPayment(paymentId, amount)`

5. **Guest Service:**
   - `getGuestByEmail(email)`
   - `createGuest(guestInfo)`

---

### 6.2 Internal API Example (gRPC)

**Proto Definition:**
```protobuf
syntax = "proto3";

service ReservationService {
  rpc CheckAvailability(AvailabilityRequest) returns (AvailabilityResponse);
  rpc CreateReservation(CreateReservationRequest) returns (Reservation);
  rpc ConfirmReservation(ConfirmReservationRequest) returns (Reservation);
}

message AvailabilityRequest {
  string hotel_id = 1;
  string room_type_id = 2;
  string check_in_date = 3;
  string check_out_date = 4;
  int32 number_of_rooms = 5;
}

message AvailabilityResponse {
  bool is_available = 1;
  int32 rooms_available = 2;
  double total_price = 3;
}
```

---

## 7. Error Handling

### 7.1 Standard Error Response Format

```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message",
    "details": {
      "field": "value"
    },
    "timestamp": "2025-01-01T10:00:00Z",
    "requestId": "req-123456"
  }
}
```

---

### 7.2 Common Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `INVALID_REQUEST` | 400 | Malformed request |
| `VALIDATION_ERROR` | 422 | Input validation failed |
| `UNAUTHORIZED` | 401 | Missing or invalid auth |
| `FORBIDDEN` | 403 | Insufficient permissions |
| `NOT_FOUND` | 404 | Resource not found |
| `ROOM_UNAVAILABLE` | 409 | Room sold out |
| `PRICE_CHANGED` | 409 | Price changed since search |
| `PAYMENT_FAILED` | 402 | Payment processing failed |
| `RESERVATION_EXPIRED` | 410 | Reservation expired |
| `RATE_LIMIT_EXCEEDED` | 429 | Too many requests |
| `INTERNAL_ERROR` | 500 | Server error |

---

### 7.3 Validation Error Example

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Request validation failed",
    "details": {
      "errors": [
        {
          "field": "checkInDate",
          "message": "Check-in date must be in the future",
          "value": "2024-01-01"
        },
        {
          "field": "guest.email",
          "message": "Invalid email format",
          "value": "invalid-email"
        }
      ]
    }
  }
}
```

---

## 8. Rate Limiting & Security

### 8.1 Rate Limiting

**Per-User Limits (Authenticated):**
- 1000 requests per hour
- 100 requests per minute

**Per-IP Limits (Anonymous):**
- 100 requests per hour
- 10 requests per minute

**Endpoint-Specific Limits:**
- Search: 60 requests per minute
- Create reservation: 10 requests per minute
- Payment confirmation: 5 requests per minute

**Headers:**
```http
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
X-RateLimit-Reset: 1640998800
```

**Response (Rate Limit Exceeded):**
```http
HTTP/1.1 429 Too Many Requests
Retry-After: 60

{
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Too many requests. Please try again later.",
    "retryAfter": 60
  }
}
```

---

### 8.2 Security Best Practices

1. **HTTPS Only:** All API calls over HTTPS
2. **CORS:** Configured for allowed origins only
3. **Input Validation:** Validate all inputs server-side
4. **SQL Injection Prevention:** Use parameterized queries
5. **XSS Prevention:** Sanitize outputs
6. **CSRF Protection:** Use CSRF tokens for state-changing operations
7. **Idempotency:** Prevent duplicate operations
8. **Request Signing:** Optional for sensitive operations
9. **Audit Logging:** Log all API requests
10. **Data Encryption:** Encrypt sensitive data at rest and in transit

---

### 8.3 API Key Management (Future)

**For Third-Party Integrations:**

```http
X-API-Key: sk_live_abc123...
```

**Key Types:**
- Test keys: `sk_test_...`
- Live keys: `sk_live_...`

---

## Summary

### MVP Endpoints

**Public (Guest-Facing):**
- ✅ `GET /v1/hotels/search` - Search hotels
- ✅ `GET /v1/hotels/{id}` - Hotel details
- ✅ `POST /v1/reservations` - Create reservation
- ✅ `POST /v1/reservations/{id}/confirm` - Confirm & pay
- ✅ `GET /v1/reservations/{id}` - View reservation
- ✅ `POST /v1/reservations/{id}/cancel` - Cancel reservation

**Admin (Hotel Staff):**
- ✅ `GET /v1/admin/hotels/{id}/inventory` - View inventory
- ✅ `PUT /v1/admin/hotels/{id}/room-types/{id}/inventory` - Update inventory
- ✅ `PUT /v1/admin/hotels/{id}/room-types/{id}/pricing` - Update pricing
- ✅ `GET /v1/admin/hotels/{id}/bookings` - View bookings

### Future Enhancements

- **Webhooks:** Event notifications (booking.created, booking.cancelled)
- **GraphQL:** Alternative to REST for flexible queries
- **Batch Operations:** Bulk create/update
- **Real-time Updates:** WebSocket for live availability
- **Advanced Search:** Filters, sorting, recommendations
- **Reviews & Ratings:** Guest feedback APIs
- **Loyalty Program:** Points, rewards

This API design provides a robust foundation for a production-ready hotel booking system with clear contracts, comprehensive error handling, and scalability in mind.

