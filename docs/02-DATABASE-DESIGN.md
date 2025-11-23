# Database Design

## Table of Contents
1. [Overview](#1-overview)
2. [Core Entities](#2-core-entities)
3. [Database Schema (SQL)](#3-database-schema-sql)
4. [Indexes & Performance](#4-indexes--performance)
5. [Availability Logic](#5-availability-logic)
6. [Concurrency Control](#6-concurrency-control)
7. [Data Integrity](#7-data-integrity)

---

## 1. Overview

### 1.1 Database Choice

**Primary Database:** PostgreSQL 14+

**Rationale:**
- ✅ ACID compliance critical for financial transactions
- ✅ Strong support for constraints (prevent overbooking)
- ✅ JSON support for flexible data (amenities, metadata)
- ✅ Excellent performance with proper indexing
- ✅ Row-level locking for concurrency control
- ✅ Mature ecosystem and tooling

**Alternative Considerations:**
- MySQL: Also viable, slightly less feature-rich
- MongoDB: Not suitable for transactional booking system
- DynamoDB: Could work with careful design, but ACID harder

---

### 1.2 Design Principles

**Room Type Model (Not Individual Rooms):**
- We track **room types** (e.g., "Deluxe King") not individual room numbers
- Inventory is per room type, per date
- Simpler to manage, standard in industry
- Hotel assigns actual room number at check-in

**Per-Day Inventory Tracking:**
- Table: `room_type_inventory` with composite key `(hotel_id, room_type_id, date)`
- Each row represents availability for one room type on one day
- Allows dynamic pricing and inventory per day
- Based on System Design Interview Vol 2, Chapter 7

**Two-Phase Reservations:**
1. **PENDING**: Reservation created, inventory checked
2. **PAID**: Payment successful, inventory reserved
3. **CANCELLED/REFUNDED**: Inventory released

---

### 1.3 Schema Overview

**Core Tables:**
- `hotel` - Hotel properties
- `room_type` - Room types offered by hotels
- `room_type_inventory` - Daily inventory calendar
- `room_price` - Daily pricing per room type
- `guest` - Guest information
- `reservation` - Bookings
- `payment` - Payment records

**Supporting Tables:**
- `amenity` - Amenities catalog
- `hotel_amenity` - Hotel-level amenities
- `room_type_amenity` - Room type amenities
- `review` - Guest reviews (future)

---

## 2. Core Entities

### 2.1 Entity Relationship Diagram

```
┌──────────┐       ┌─────────────┐       ┌──────────────────────┐
│  HOTEL   │──────<│ ROOM_TYPE   │──────<│ ROOM_TYPE_INVENTORY │
└──────────┘  1:N  └─────────────┘  1:N  └──────────────────────┘
     │                   │                  (hotel_id, room_type_id, date)
     │                   │
     │                   ├──────<┌────────────────┐
     │                   │  1:N  │  ROOM_PRICE    │
     │                   │       └────────────────┘
     │                   │
     ├──────────────<────┤
     │              1:N  │
     │                   │
     v                   v
┌──────────────┐    ┌───────────┐
│ RESERVATION  │───<│  GUEST    │
└──────────────┘    └───────────┘
     │
     │ 1:1
     v
┌──────────┐
│ PAYMENT  │
└──────────┘
```

---

### 2.2 hotel

**Purpose:** Represents a hotel property.

**Attributes:**
- `id` (UUID, PK) - Unique identifier
- `name` (VARCHAR(255)) - Hotel name
- `description` (TEXT) - Hotel description
- `address` (VARCHAR(500)) - Street address
- `city` (VARCHAR(100)) - City
- `state` (VARCHAR(100)) - State/Province
- `country` (VARCHAR(100)) - Country
- `postal_code` (VARCHAR(20)) - Postal/ZIP code
- `latitude` (DECIMAL(10, 8)) - Latitude for mapping
- `longitude` (DECIMAL(11, 8)) - Longitude for mapping
- `star_rating` (SMALLINT) - 1-5 stars
- `phone` (VARCHAR(20)) - Contact phone
- `email` (VARCHAR(255)) - Contact email
- `check_in_time` (TIME) - Default check-in time (e.g., 15:00)
- `check_out_time` (TIME) - Default check-out time (e.g., 11:00)
- `policies` (JSONB) - Cancellation, pet, age policies
- `images` (JSONB) - Array of image URLs
- `is_active` (BOOLEAN) - Hotel active status
- `created_at` (TIMESTAMP) - Record creation
- `updated_at` (TIMESTAMP) - Last update

**Example:**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "name": "Seattle Downtown Hotel",
  "city": "Seattle",
  "star_rating": 4,
  "policies": {
    "cancellation": {
      "free_cancellation_hours": 24,
      "partial_refund_percentage": 50
    },
    "pets": {
      "allowed": true,
      "fee": 50
    }
  }
}
```

---

### 2.3 room_type

**Purpose:** Defines types of rooms offered by a hotel.

**Attributes:**
- `id` (UUID, PK) - Unique identifier
- `hotel_id` (UUID, FK → hotel.id) - Parent hotel
- `name` (VARCHAR(255)) - Room type name (e.g., "Deluxe King Room")
- `description` (TEXT) - Room description
- `size_sqft` (INT) - Room size in square feet
- `max_occupancy` (SMALLINT) - Maximum guests
- `bed_type` (VARCHAR(100)) - e.g., "1 King Bed", "2 Queen Beds"
- `view_type` (VARCHAR(100)) - e.g., "City View", "Ocean View"
- `base_inventory` (INT) - Typical total rooms of this type
- `images` (JSONB) - Array of room images
- `amenities` (JSONB) - Room-specific amenities
- `is_active` (BOOLEAN) - Room type available for sale
- `created_at` (TIMESTAMP)
- `updated_at` (TIMESTAMP)

**Example:**
```json
{
  "id": "7c9e6679-7425-40de-944b-e07fc1f90ae7",
  "hotel_id": "550e8400-e29b-41d4-a716-446655440000",
  "name": "Deluxe King Room",
  "max_occupancy": 2,
  "bed_type": "1 King Bed",
  "amenities": ["wifi", "mini_fridge", "coffee_maker", "smart_tv"]
}
```

---

### 2.4 room_type_inventory ⭐ CORE TABLE

**Purpose:** Tracks daily inventory for each room type. This IS the availability calendar.

**Composite Primary Key:** `(hotel_id, room_type_id, date)`

**Attributes:**
- `hotel_id` (UUID, FK → hotel.id) - Hotel reference
- `room_type_id` (UUID, FK → room_type.id) - Room type reference
- `date` (DATE) - Specific date
- `total_inventory` (INT) - Total rooms available for sale that day
- `total_reserved` (INT) - Rooms already booked (PAID status only)
- `version` (INT) - Optimistic locking version (optional)
- `updated_at` (TIMESTAMP) - Last update timestamp

**Derived Field (not stored):**
- `available = total_inventory - total_reserved`

**Key Constraints:**
- `total_reserved <= total_inventory` (CHECK constraint)
- `total_inventory >= 0`
- `total_reserved >= 0`

**Example Rows:**
```sql
hotel_id                            | room_type_id                       | date       | total_inv | total_res
------------------------------------|------------------------------------| -----------|-----------|----------
550e8400-e29b-41d4-a716-446655440000| 7c9e6679-7425-40de-944b-e07fc1f90ae7| 2025-01-02 | 10        | 8
550e8400-e29b-41d4-a716-446655440000| 7c9e6679-7425-40de-944b-e07fc1f90ae7| 2025-01-03 | 10        | 9
550e8400-e29b-41d4-a716-446655440000| 7c9e6679-7425-40de-944b-e07fc1f90ae7| 2025-01-04 | 10        | 7
```

**Interpretation:**
- Jan 2: 2 rooms available (10 - 8)
- Jan 3: 1 room available (10 - 9)
- Jan 4: 3 rooms available (10 - 7)

---

### 2.5 room_price

**Purpose:** Stores daily pricing for each room type.

**Attributes:**
- `id` (UUID, PK) - Unique identifier
- `hotel_id` (UUID, FK → hotel.id)
- `room_type_id` (UUID, FK → room_type.id)
- `date` (DATE) - Specific date
- `price` (DECIMAL(10, 2)) - Price per night
- `currency` (CHAR(3)) - Currency code (e.g., "USD")
- `rate_plan_id` (UUID, nullable) - Future: different rate plans
- `created_at` (TIMESTAMP)
- `updated_at` (TIMESTAMP)

**Indexes:**
- UNIQUE `(hotel_id, room_type_id, date)`
- Index on `date` for range queries

**Example:**
```sql
hotel_id    | room_type_id | date       | price  | currency
------------|--------------|------------|--------|----------
550e8400... | 7c9e6679...  | 2025-01-02 | 120.00 | USD
550e8400... | 7c9e6679...  | 2025-01-03 | 120.00 | USD
550e8400... | 7c9e6679...  | 2025-01-04 | 150.00 | USD  (weekend)
```

---

### 2.6 guest

**Purpose:** Stores guest information.

**Attributes:**
- `id` (UUID, PK) - Unique identifier
- `user_account_id` (UUID, nullable) - Link to user auth table (if logged in)
- `first_name` (VARCHAR(100)) - First name
- `last_name` (VARCHAR(100)) - Last name
- `email` (VARCHAR(255)) - Email (unique)
- `phone` (VARCHAR(20)) - Phone number
- `created_at` (TIMESTAMP)
- `updated_at` (TIMESTAMP)

**Indexes:**
- UNIQUE on `email`
- Index on `user_account_id`

---

### 2.7 reservation ⭐ CORE TABLE

**Purpose:** Represents a booking.

**Attributes:**
- `id` (UUID, PK) - Unique identifier (also booking reference)
- `guest_id` (UUID, FK → guest.id) - Guest reference
- `hotel_id` (UUID, FK → hotel.id) - Hotel reference
- `room_type_id` (UUID, FK → room_type.id) - Room type reference
- `check_in_date` (DATE) - Check-in date
- `check_out_date` (DATE) - Check-out date
- `number_of_rooms` (INT) - Number of rooms booked
- `status` (ENUM) - Reservation status
  - `PENDING` - Created, not yet paid
  - `PAID` - Payment successful
  - `CANCELLED` - Cancelled by guest
  - `REFUNDED` - Refund processed
  - `REJECTED` - Rejected (e.g., payment failed permanently)
- `total_price` (DECIMAL(10, 2)) - Total amount
- `currency` (CHAR(3)) - Currency
- `special_requests` (TEXT) - Guest special requests
- `idempotency_key` (VARCHAR(255), unique, nullable) - For duplicate prevention
- `expires_at` (TIMESTAMP, nullable) - PENDING reservation expiry
- `created_at` (TIMESTAMP) - Reservation creation
- `updated_at` (TIMESTAMP) - Last update
- `cancelled_at` (TIMESTAMP, nullable) - Cancellation timestamp

**Constraints:**
- `check_out_date > check_in_date`
- `number_of_rooms > 0`
- UNIQUE on `idempotency_key` (when not null)

**Indexes:**
- Index on `guest_id`
- Index on `hotel_id`
- Index on `status`
- Index on `check_in_date`, `check_out_date` (for date range queries)
- Index on `idempotency_key`
- Index on `created_at` (for recent bookings)

**Example:**
```sql
id          | guest_id | hotel_id | room_type_id | check_in   | check_out  | num_rooms | status | total_price
------------|----------|----------|--------------|------------|------------|-----------|--------|------------
abc-123-... | guest1   | hotel1   | roomtype1    | 2025-01-02 | 2025-01-05 | 2         | PAID   | 720.00
```

---

### 2.8 payment

**Purpose:** Tracks payment transactions.

**Attributes:**
- `id` (UUID, PK) - Unique identifier
- `reservation_id` (UUID, FK → reservation.id) - Associated reservation
- `amount` (DECIMAL(10, 2)) - Payment amount
- `currency` (CHAR(3)) - Currency
- `status` (ENUM) - Payment status
  - `INITIATED` - Payment started
  - `SUCCEEDED` - Payment successful
  - `FAILED` - Payment failed
  - `REFUNDED` - Payment refunded
- `payment_method` (VARCHAR(50)) - e.g., "card", "paypal"
- `payment_provider` (VARCHAR(50)) - e.g., "stripe", "paypal"
- `provider_transaction_id` (VARCHAR(255)) - External payment ID
- `failure_reason` (TEXT, nullable) - Error message if failed
- `created_at` (TIMESTAMP) - Payment attempt time
- `updated_at` (TIMESTAMP) - Status update time

**Indexes:**
- Index on `reservation_id`
- Index on `provider_transaction_id`
- Index on `status`

---

### 2.9 Supporting Tables (Optional for MVP)

#### amenity
```sql
CREATE TABLE amenity (
  id UUID PRIMARY KEY,
  name VARCHAR(100) UNIQUE NOT NULL,
  category VARCHAR(50), -- 'hotel', 'room', 'general'
  icon_url VARCHAR(255)
);
```

#### hotel_amenity (Many-to-Many)
```sql
CREATE TABLE hotel_amenity (
  hotel_id UUID REFERENCES hotel(id) ON DELETE CASCADE,
  amenity_id UUID REFERENCES amenity(id) ON DELETE CASCADE,
  PRIMARY KEY (hotel_id, amenity_id)
);
```

#### room_type_amenity (Many-to-Many)
```sql
CREATE TABLE room_type_amenity (
  room_type_id UUID REFERENCES room_type(id) ON DELETE CASCADE,
  amenity_id UUID REFERENCES amenity(id) ON DELETE CASCADE,
  PRIMARY KEY (room_type_id, amenity_id)
);
```

---

## 3. Database Schema (SQL)

### 3.1 Complete PostgreSQL Schema

```sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==========================================
-- HOTEL
-- ==========================================
CREATE TABLE hotel (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  address VARCHAR(500),
  city VARCHAR(100) NOT NULL,
  state VARCHAR(100),
  country VARCHAR(100) NOT NULL,
  postal_code VARCHAR(20),
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  star_rating SMALLINT CHECK (star_rating >= 1 AND star_rating <= 5),
  phone VARCHAR(20),
  email VARCHAR(255),
  check_in_time TIME DEFAULT '15:00:00',
  check_out_time TIME DEFAULT '11:00:00',
  policies JSONB,
  images JSONB,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_hotel_city ON hotel(city);
CREATE INDEX idx_hotel_country ON hotel(country);
CREATE INDEX idx_hotel_star_rating ON hotel(star_rating);
CREATE INDEX idx_hotel_location ON hotel(latitude, longitude);

-- ==========================================
-- ROOM TYPE
-- ==========================================
CREATE TABLE room_type (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  hotel_id UUID NOT NULL REFERENCES hotel(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  size_sqft INT,
  max_occupancy SMALLINT NOT NULL CHECK (max_occupancy > 0),
  bed_type VARCHAR(100),
  view_type VARCHAR(100),
  base_inventory INT DEFAULT 0 CHECK (base_inventory >= 0),
  images JSONB,
  amenities JSONB,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_room_type_hotel ON room_type(hotel_id);
CREATE INDEX idx_room_type_active ON room_type(is_active);

-- ==========================================
-- ROOM TYPE INVENTORY ⭐ CORE
-- ==========================================
CREATE TABLE room_type_inventory (
  hotel_id UUID NOT NULL REFERENCES hotel(id) ON DELETE CASCADE,
  room_type_id UUID NOT NULL REFERENCES room_type(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  total_inventory INT NOT NULL CHECK (total_inventory >= 0),
  total_reserved INT NOT NULL DEFAULT 0 CHECK (total_reserved >= 0),
  version INT DEFAULT 1, -- For optimistic locking
  updated_at TIMESTAMP DEFAULT NOW(),
  PRIMARY KEY (hotel_id, room_type_id, date),
  CONSTRAINT check_inventory_valid CHECK (total_reserved <= total_inventory)
);

-- Indexes
CREATE INDEX idx_inventory_date_range ON room_type_inventory(hotel_id, room_type_id, date);
CREATE INDEX idx_inventory_date ON room_type_inventory(date);

-- ==========================================
-- ROOM PRICE
-- ==========================================
CREATE TABLE room_price (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  hotel_id UUID NOT NULL REFERENCES hotel(id) ON DELETE CASCADE,
  room_type_id UUID NOT NULL REFERENCES room_type(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  price DECIMAL(10, 2) NOT NULL CHECK (price >= 0),
  currency CHAR(3) DEFAULT 'USD',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE (hotel_id, room_type_id, date)
);

-- Indexes
CREATE INDEX idx_room_price_lookup ON room_price(hotel_id, room_type_id, date);
CREATE INDEX idx_room_price_date_range ON room_price(date);

-- ==========================================
-- GUEST
-- ==========================================
CREATE TABLE guest (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_account_id UUID, -- Link to auth service (nullable)
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(20),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE (email)
);

-- Indexes
CREATE INDEX idx_guest_email ON guest(email);
CREATE INDEX idx_guest_user_account ON guest(user_account_id);

-- ==========================================
-- RESERVATION ⭐ CORE
-- ==========================================
CREATE TYPE reservation_status AS ENUM ('PENDING', 'PAID', 'CANCELLED', 'REFUNDED', 'REJECTED');

CREATE TABLE reservation (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  guest_id UUID NOT NULL REFERENCES guest(id),
  hotel_id UUID NOT NULL REFERENCES hotel(id),
  room_type_id UUID NOT NULL REFERENCES room_type(id),
  check_in_date DATE NOT NULL,
  check_out_date DATE NOT NULL,
  number_of_rooms INT NOT NULL CHECK (number_of_rooms > 0),
  status reservation_status DEFAULT 'PENDING',
  total_price DECIMAL(10, 2) NOT NULL CHECK (total_price >= 0),
  currency CHAR(3) DEFAULT 'USD',
  special_requests TEXT,
  idempotency_key VARCHAR(255) UNIQUE, -- For duplicate prevention
  expires_at TIMESTAMP, -- PENDING reservations expire
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  cancelled_at TIMESTAMP,
  CONSTRAINT check_dates_valid CHECK (check_out_date > check_in_date)
);

-- Indexes
CREATE INDEX idx_reservation_guest ON reservation(guest_id);
CREATE INDEX idx_reservation_hotel ON reservation(hotel_id);
CREATE INDEX idx_reservation_status ON reservation(status);
CREATE INDEX idx_reservation_dates ON reservation(check_in_date, check_out_date);
CREATE INDEX idx_reservation_created ON reservation(created_at DESC);
CREATE INDEX idx_reservation_idempotency ON reservation(idempotency_key) WHERE idempotency_key IS NOT NULL;

-- ==========================================
-- PAYMENT
-- ==========================================
CREATE TYPE payment_status AS ENUM ('INITIATED', 'SUCCEEDED', 'FAILED', 'REFUNDED');

CREATE TABLE payment (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  reservation_id UUID NOT NULL REFERENCES reservation(id),
  amount DECIMAL(10, 2) NOT NULL CHECK (amount >= 0),
  currency CHAR(3) DEFAULT 'USD',
  status payment_status DEFAULT 'INITIATED',
  payment_method VARCHAR(50),
  payment_provider VARCHAR(50),
  provider_transaction_id VARCHAR(255),
  failure_reason TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_payment_reservation ON payment(reservation_id);
CREATE INDEX idx_payment_provider_tx ON payment(provider_transaction_id);
CREATE INDEX idx_payment_status ON payment(status);

-- ==========================================
-- TRIGGERS (Auto-update updated_at)
-- ==========================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_hotel_updated_at BEFORE UPDATE ON hotel
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_room_type_updated_at BEFORE UPDATE ON room_type
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_inventory_updated_at BEFORE UPDATE ON room_type_inventory
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_reservation_updated_at BEFORE UPDATE ON reservation
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payment_updated_at BEFORE UPDATE ON payment
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

---

### 3.2 Sample Data Insertion

```sql
-- Insert a hotel
INSERT INTO hotel (id, name, city, country, star_rating, latitude, longitude)
VALUES (
  '550e8400-e29b-41d4-a716-446655440000',
  'Seattle Downtown Hotel',
  'Seattle',
  'USA',
  4,
  47.6062,
  -122.3321
);

-- Insert a room type
INSERT INTO room_type (id, hotel_id, name, max_occupancy, bed_type, base_inventory)
VALUES (
  '7c9e6679-7425-40de-944b-e07fc1f90ae7',
  '550e8400-e29b-41d4-a716-446655440000',
  'Deluxe King Room',
  2,
  '1 King Bed',
  10
);

-- Insert inventory for 30 days
INSERT INTO room_type_inventory (hotel_id, room_type_id, date, total_inventory, total_reserved)
SELECT
  '550e8400-e29b-41d4-a716-446655440000',
  '7c9e6679-7425-40de-944b-e07fc1f90ae7',
  generate_series::date,
  10,
  0
FROM generate_series('2025-01-01'::date, '2025-01-31'::date, '1 day');

-- Insert prices
INSERT INTO room_price (hotel_id, room_type_id, date, price)
SELECT
  '550e8400-e29b-41d4-a716-446655440000',
  '7c9e6679-7425-40de-944b-e07fc1f90ae7',
  generate_series::date,
  CASE
    WHEN EXTRACT(DOW FROM generate_series) IN (5, 6) THEN 150.00 -- Fri, Sat
    ELSE 120.00
  END
FROM generate_series('2025-01-01'::date, '2025-01-31'::date, '1 day');

-- Insert a guest
INSERT INTO guest (id, first_name, last_name, email, phone)
VALUES (
  '8f9e4a6b-3c2d-4e5f-9a8b-7c6d5e4f3a2b',
  'Alex',
  'Kim',
  'alex@example.com',
  '+1-555-1234'
);
```

---

## 4. Indexes & Performance

### 4.1 Critical Indexes

**room_type_inventory:**
```sql
-- Primary key (hotel_id, room_type_id, date) is automatically indexed
-- Additional composite index for date range queries
CREATE INDEX idx_inventory_date_range ON room_type_inventory(hotel_id, room_type_id, date);
```

**reservation:**
```sql
-- Guest lookup
CREATE INDEX idx_reservation_guest ON reservation(guest_id);

-- Hotel dashboard queries
CREATE INDEX idx_reservation_hotel_dates ON reservation(hotel_id, check_in_date, status);

-- Date range queries (find overlapping bookings)
CREATE INDEX idx_reservation_dates ON reservation(check_in_date, check_out_date);
```

**room_price:**
```sql
-- Price lookup for date range
CREATE INDEX idx_room_price_lookup ON room_price(hotel_id, room_type_id, date);
```

---

### 4.2 Query Performance Considerations

**Availability Check Query:**
```sql
-- This query runs frequently, must be fast
SELECT date, total_inventory, total_reserved
FROM room_type_inventory
WHERE hotel_id = :hotel_id
  AND room_type_id = :room_type_id
  AND date >= :check_in_date
  AND date < :check_out_date
FOR UPDATE; -- Lock rows for reservation
```

**Performance:**
- Uses primary key + index → O(log N) lookup
- Typical: 3-7 day stays → 3-7 rows scanned
- With proper indexing: < 5ms

---

### 4.3 Partitioning (Future Optimization)

For high-scale systems, partition `room_type_inventory` by date:

```sql
-- Partition by month
CREATE TABLE room_type_inventory_2025_01 PARTITION OF room_type_inventory
  FOR VALUES FROM ('2025-01-01') TO ('2025-02-01');

CREATE TABLE room_type_inventory_2025_02 PARTITION OF room_type_inventory
  FOR VALUES FROM ('2025-02-01') TO ('2025-03-01');
```

**Benefits:**
- Faster queries (smaller table scans)
- Easier archival of old data
- Improved maintenance

---

## 5. Availability Logic

### 5.1 Check Availability

**Goal:** Determine if `N` rooms are available for date range `[check_in, check_out)`.

**Algorithm:**

```pseudo
function checkAvailability(hotelId, roomTypeId, checkIn, checkOut, numRooms):
  // Get all inventory rows for date range
  rows = SELECT date, total_inventory, total_reserved
         FROM room_type_inventory
         WHERE hotel_id = hotelId
           AND room_type_id = roomTypeId
           AND date >= checkIn
           AND date < checkOut
         FOR UPDATE; -- Lock rows

  // Check if we have rows for all dates
  expectedDays = daysBetween(checkIn, checkOut)
  if rows.length != expectedDays:
    return MISSING_INVENTORY_DATA

  // Check each day has enough availability
  for each row in rows:
    available = row.total_inventory - row.total_reserved
    if available < numRooms:
      return NOT_AVAILABLE

  return AVAILABLE
```

**SQL Implementation:**

```sql
-- Check if all dates have sufficient availability
SELECT
  COUNT(*) AS total_days,
  COUNT(CASE WHEN (total_inventory - total_reserved) >= :num_rooms THEN 1 END) AS available_days,
  MIN(total_inventory - total_reserved) AS min_available
FROM room_type_inventory
WHERE hotel_id = :hotel_id
  AND room_type_id = :room_type_id
  AND date >= :check_in_date
  AND date < :check_out_date
FOR UPDATE;

-- Availability check:
-- available_days = total_days AND min_available >= num_rooms
```

---

### 5.2 Reserve Inventory (Update on Booking)

**When:** Reservation status changes from PENDING → PAID

**Transaction:**

```sql
BEGIN;

-- 1. Lock and verify availability
SELECT date, total_inventory, total_reserved
FROM room_type_inventory
WHERE hotel_id = :hotel_id
  AND room_type_id = :room_type_id
  AND date >= :check_in_date
  AND date < :check_out_date
FOR UPDATE;

-- 2. Check availability in application code
-- If not available, ROLLBACK

-- 3. Update reservation status
UPDATE reservation
SET status = 'PAID', updated_at = NOW()
WHERE id = :reservation_id AND status = 'PENDING';

-- 4. Increment reserved count for each date
UPDATE room_type_inventory
SET total_reserved = total_reserved + :num_rooms,
    version = version + 1
WHERE hotel_id = :hotel_id
  AND room_type_id = :room_type_id
  AND date >= :check_in_date
  AND date < :check_out_date;

-- 5. Insert payment record
INSERT INTO payment (reservation_id, amount, status, ...)
VALUES (:reservation_id, :amount, 'SUCCEEDED', ...);

COMMIT;
```

**Key Points:**
- ✅ Atomic transaction ensures consistency
- ✅ `FOR UPDATE` prevents concurrent modifications
- ✅ `CHECK (total_reserved <= total_inventory)` prevents overbooking
- ✅ If constraint violated, entire transaction rolls back

---

### 5.3 Release Inventory (On Cancellation)

**When:** Reservation is cancelled

**Transaction:**

```sql
BEGIN;

-- 1. Update reservation status
UPDATE reservation
SET status = 'CANCELLED', cancelled_at = NOW()
WHERE id = :reservation_id AND status = 'PAID';

-- 2. Decrement reserved count
UPDATE room_type_inventory
SET total_reserved = total_reserved - :num_rooms,
    version = version + 1
WHERE hotel_id = :hotel_id
  AND room_type_id = :room_type_id
  AND date >= :check_in_date
  AND date < :check_out_date;

-- 3. Process refund (update payment)
UPDATE payment
SET status = 'REFUNDED'
WHERE reservation_id = :reservation_id;

COMMIT;
```

---

## 6. Concurrency Control

### 6.1 Problem: Race Conditions

**Scenario:**
- 1 room left
- User A and User B both try to book simultaneously
- Without proper locking: **both might succeed → overbooking**

---

### 6.2 Solution 1: Pessimistic Locking (Recommended for MVP)

**Approach:** Lock inventory rows during availability check and update.

**Implementation:**
```sql
BEGIN;

-- Lock rows (blocks other transactions)
SELECT * FROM room_type_inventory
WHERE hotel_id = :hotel_id
  AND room_type_id = :room_type_id
  AND date >= :check_in_date
  AND date < :check_out_date
FOR UPDATE;

-- Check availability (application logic)
-- If available:
--   Update inventory
--   Create/update reservation
-- Else:
--   ROLLBACK

COMMIT;
```

**Pros:**
- ✅ Simple and safe
- ✅ Prevents race conditions completely
- ✅ Good for moderate QPS (< 100 concurrent bookings/sec per room type)

**Cons:**
- ❌ Lower concurrency (locks block other transactions)
- ❌ Can cause contention at high scale

---

### 6.3 Solution 2: Optimistic Locking

**Approach:** Use `version` column, detect conflicts on update.

**Implementation:**

```sql
-- 1. Read inventory with version
SELECT date, total_inventory, total_reserved, version
FROM room_type_inventory
WHERE hotel_id = :hotel_id
  AND room_type_id = :room_type_id
  AND date >= :check_in_date
  AND date < :check_out_date;

-- 2. Application checks availability

-- 3. Update with version check
UPDATE room_type_inventory
SET total_reserved = total_reserved + :num_rooms,
    version = version + 1
WHERE hotel_id = :hotel_id
  AND room_type_id = :room_type_id
  AND date = :date
  AND version = :old_version; -- Only update if version matches

-- 4. If affected rows < expected: conflict detected, retry
```

**Pros:**
- ✅ Higher concurrency (no blocking)
- ✅ Better performance at scale

**Cons:**
- ❌ More complex (retry logic needed)
- ❌ Transaction may fail and need retry

---

### 6.4 Solution 3: Database Constraint (Safety Net)

**Approach:** Rely on CHECK constraint to prevent invalid states.

```sql
ALTER TABLE room_type_inventory
  ADD CONSTRAINT check_inventory_valid
  CHECK (total_reserved <= total_inventory);
```

**How it works:**
- If an UPDATE would cause `total_reserved > total_inventory`, DB rejects it
- Transaction rolls back automatically
- Application must handle error and show "sold out" to user

**Pros:**
- ✅ Foolproof safety net
- ✅ Works with any locking strategy
- ✅ Prevents overbooking at database level

**Cons:**
- ❌ Doesn't prevent race (only detects it)
- ❌ User sees error after attempting booking

---

### 6.5 Recommended Approach for MVP

**Combination Strategy:**

1. **Pessimistic locking** (`FOR UPDATE`) during reservation confirmation
2. **Database constraint** as safety net
3. **Idempotency** to prevent duplicate bookings

```sql
BEGIN;

-- Lock inventory
SELECT * FROM room_type_inventory
WHERE hotel_id = :hotel_id
  AND room_type_id = :room_type_id
  AND date >= :check_in_date
  AND date < :check_out_date
FOR UPDATE;

-- Check availability in app

-- Update inventory (constraint prevents overbooking)
UPDATE room_type_inventory
SET total_reserved = total_reserved + :num_rooms
WHERE hotel_id = :hotel_id
  AND room_type_id = :room_type_id
  AND date >= :check_in_date
  AND date < :check_out_date;

COMMIT;
```

**Result:**
- Safe from race conditions
- Database enforces invariants
- Acceptable performance for MVP

---

## 7. Data Integrity

### 7.1 Referential Integrity

**Foreign Keys:**
- All foreign keys use `ON DELETE CASCADE` or `ON DELETE RESTRICT` appropriately
- Ensures no orphaned records

**Example:**
```sql
-- If hotel is deleted, all its room types are deleted
room_type.hotel_id REFERENCES hotel(id) ON DELETE CASCADE

-- If room type is deleted, its inventory is deleted
room_type_inventory.room_type_id REFERENCES room_type(id) ON DELETE CASCADE

-- Reservations are NOT deleted if hotel is deleted (use RESTRICT)
reservation.hotel_id REFERENCES hotel(id) ON DELETE RESTRICT
```

---

### 7.2 Check Constraints

**Prevent Invalid Data:**

```sql
-- Reservation dates
CHECK (check_out_date > check_in_date)

-- Non-negative values
CHECK (total_inventory >= 0)
CHECK (total_reserved >= 0)
CHECK (price >= 0)

-- Inventory constraint (prevent overbooking)
CHECK (total_reserved <= total_inventory)

-- Room quantity
CHECK (number_of_rooms > 0)
```

---

### 7.3 Unique Constraints

**Prevent Duplicates:**

```sql
-- One price per room type per date
UNIQUE (hotel_id, room_type_id, date) on room_price

-- Guest email uniqueness
UNIQUE (email) on guest

-- Idempotency key uniqueness
UNIQUE (idempotency_key) on reservation
```

---

### 7.4 Data Validation

**Application-Level:**
- Validate email format
- Validate phone format
- Validate date ranges (check-in >= today)
- Validate guest count <= room max occupancy

**Database-Level:**
- ENUMs for status fields (prevents invalid values)
- CHECK constraints for ranges

---

### 7.5 Idempotency

**Problem:** User clicks "Complete Booking" twice → duplicate bookings?

**Solution:**

```sql
-- Unique idempotency key per booking attempt
CREATE UNIQUE INDEX idx_reservation_idempotency
  ON reservation(idempotency_key)
  WHERE idempotency_key IS NOT NULL;
```

**Implementation:**

1. Frontend generates UUID: `idempotency_key`
2. Include in POST request header: `Idempotency-Key: <uuid>`
3. Backend checks if reservation with this key exists:
   ```sql
   SELECT * FROM reservation WHERE idempotency_key = :key;
   ```
4. If exists: return existing reservation (200 OK)
5. If not: create new reservation with this key

**Result:**
- Multiple requests with same key → same reservation
- No duplicate charges
- No duplicate inventory deduction

---

### 7.6 Data Consistency Checks (Background Jobs)

**Reconciliation Job:** (runs nightly)

```sql
-- Find discrepancies between total_reserved and actual paid reservations
SELECT
  i.hotel_id,
  i.room_type_id,
  i.date,
  i.total_reserved AS inventory_reserved,
  COALESCE(SUM(r.number_of_rooms), 0) AS actual_reserved
FROM room_type_inventory i
LEFT JOIN reservation r
  ON r.hotel_id = i.hotel_id
  AND r.room_type_id = i.room_type_id
  AND r.status = 'PAID'
  AND i.date >= r.check_in_date
  AND i.date < r.check_out_date
WHERE i.date >= CURRENT_DATE
GROUP BY i.hotel_id, i.room_type_id, i.date, i.total_reserved
HAVING i.total_reserved != COALESCE(SUM(r.number_of_rooms), 0);
```

**Expired Reservation Cleanup:** (runs every 15 minutes)

```sql
-- Mark expired PENDING reservations as REJECTED
UPDATE reservation
SET status = 'REJECTED'
WHERE status = 'PENDING'
  AND expires_at < NOW();
```

---

## Summary

### Key Design Decisions

✅ **Room Type Model:** Simpler than individual room tracking  
✅ **Per-Day Inventory:** `room_type_inventory` table is the core  
✅ **Pessimistic Locking:** Safe concurrency control for MVP  
✅ **Database Constraints:** Prevent overbooking at DB level  
✅ **Idempotency:** Prevent duplicate bookings  
✅ **Two-Phase Booking:** PENDING → PAID workflow  

### Performance Characteristics

- Availability check: **< 5ms** (with indexes)
- Booking transaction: **< 50ms** (including locking)
- Concurrent bookings: **100+ per second per room type**
- Data size: **~1KB per inventory row** (manageable for years)

### Scalability Considerations

**Current Design Handles:**
- 10,000 hotels
- 100 room types per hotel
- 365 days inventory per room type
- = ~365M rows in `room_type_inventory`
- With indexes: still performant

**Future Optimizations:**
- Partition `room_type_inventory` by date
- Shard by hotel_id or region
- Cache frequent queries (Redis)
- Read replicas for search queries

This database design provides a solid foundation for a production-ready hotel booking system with strong consistency, no overbooking, and good performance.

