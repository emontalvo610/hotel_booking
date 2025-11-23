# Hotel Booking System - Quick Reference Guide

> **One-page cheat sheet** for developers implementing the system

---

## 🎯 Core Concept: Zero Overbooking

**Problem:** Two users booking the last room simultaneously  
**Solution:** Pessimistic locking + database constraints + idempotency

---

## 📊 Database - Critical Table

### `room_type_inventory` ⭐ The Heart of the System

```sql
CREATE TABLE room_type_inventory (
  hotel_id UUID,
  room_type_id UUID,
  date DATE,
  total_inventory INT NOT NULL CHECK (total_inventory >= 0),
  total_reserved INT NOT NULL DEFAULT 0 CHECK (total_reserved >= 0),
  PRIMARY KEY (hotel_id, room_type_id, date),
  CONSTRAINT no_overbooking CHECK (total_reserved <= total_inventory)
);
```

**Key Points:**
- Composite PK: `(hotel_id, room_type_id, date)`
- **Constraint prevents overbooking** at database level
- Each row = one room type's availability for one day
- `available = total_inventory - total_reserved` (computed, not stored)

---

## 🔄 Two-Phase Booking Flow

```
┌─────────────────────────────────────────────┐
│ PHASE 1: Create Reservation (PENDING)      │
├─────────────────────────────────────────────┤
│ POST /v1/reservations                       │
│ • Check availability (no locking yet)       │
│ • Create reservation with status=PENDING    │
│ • Return price hold (expires in 15 min)     │
│ • User reviews & enters payment info        │
└─────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────┐
│ PHASE 2: Confirm & Pay (PAID)              │
├─────────────────────────────────────────────┤
│ POST /v1/reservations/{id}/confirm          │
│ • Check idempotency key                     │
│ • Process payment (Stripe)                  │
│ • BEGIN TRANSACTION                         │
│   - SELECT ... FOR UPDATE (lock inventory)  │
│   - Check availability again                │
│   - UPDATE total_reserved += N              │
│   - UPDATE reservation status = PAID        │
│ • COMMIT                                    │
│ • Return confirmation number                │
└─────────────────────────────────────────────┘
```

**Why two phases?**
- Users need time to review and pay
- Holding locks for minutes = bad performance
- Only lock during actual reservation (< 50ms)

---

## 🔒 Preventing Double Booking (Code)

### ✅ Correct Implementation

```typescript
async function confirmReservation(reservationId: string, payment: Payment) {
  const reservation = await getReservation(reservationId);
  
  // 1. Check idempotency
  const existing = await checkIdempotencyKey(payment.idempotencyKey);
  if (existing) return existing; // Already processed
  
  // 2. Process payment first (can fail without side effects)
  const paymentResult = await stripe.charge(payment);
  if (!paymentResult.success) throw new PaymentFailedError();
  
  // 3. Start transaction with locking
  return await db.transaction(async (tx) => {
    // Lock inventory rows (blocks other transactions)
    const inventory = await tx.query(`
      SELECT date, total_inventory, total_reserved
      FROM room_type_inventory
      WHERE hotel_id = $1
        AND room_type_id = $2
        AND date >= $3
        AND date < $4
      FOR UPDATE
    `, [hotelId, roomTypeId, checkIn, checkOut]);
    
    // Check availability
    for (const row of inventory) {
      if (row.total_reserved + numRooms > row.total_inventory) {
        throw new SoldOutError();
      }
    }
    
    // Update inventory
    await tx.query(`
      UPDATE room_type_inventory
      SET total_reserved = total_reserved + $1
      WHERE hotel_id = $2
        AND room_type_id = $3
        AND date >= $4
        AND date < $5
    `, [numRooms, hotelId, roomTypeId, checkIn, checkOut]);
    
    // Update reservation
    await tx.query(`
      UPDATE reservation
      SET status = 'PAID', updated_at = NOW()
      WHERE id = $1 AND status = 'PENDING'
    `, [reservationId]);
    
    // Save idempotency key
    await tx.saveIdempotencyKey(payment.idempotencyKey, reservationId);
    
    return { success: true, reservationId };
  });
}
```

### ❌ Wrong Implementation (Race Condition)

```typescript
// BAD: No locking!
async function confirmReservation(reservationId: string) {
  // Check availability
  const available = await checkAvailability(hotelId, roomTypeId, dates);
  if (!available) throw new SoldOutError();
  
  // Another user could book here! ⚠️
  
  // Update inventory (TOO LATE!)
  await updateInventory(hotelId, roomTypeId, dates, numRooms);
  await updateReservation(reservationId, 'PAID');
}
```

---

## 🔑 Idempotency Pattern

```typescript
// Frontend: Generate key on page load (not on click!)
const [idempotencyKey] = useState(() => uuidv4());

// On "Complete Booking" click
await fetch('/api/reservations/123/confirm', {
  method: 'POST',
  headers: {
    'Idempotency-Key': idempotencyKey, // Same key on retry
  },
  body: JSON.stringify({ payment })
});

// Backend: Check & save key
async function handleConfirm(req, res) {
  const key = req.headers['idempotency-key'];
  
  // Check if already processed
  const cached = await redis.get(`idem:${key}`);
  if (cached) {
    return res.json(JSON.parse(cached)); // Return same result
  }
  
  // Process booking
  const result = await confirmReservation(...);
  
  // Cache result for 24 hours
  await redis.setex(`idem:${key}`, 86400, JSON.stringify(result));
  
  return res.json(result);
}
```

**Key Points:**
- Generate key on component mount, not on button click
- Send same key on retry
- Backend caches result by key
- Return cached result if key already exists
- **Result:** Safe retries, no duplicate bookings

---

## 📡 Critical API Endpoints

### 1. Search Hotels
```http
GET /v1/hotels/search?destination=seattle&checkIn=2025-01-02&checkOut=2025-01-05&guests=2
```

### 2. Get Hotel Details
```http
GET /v1/hotels/{hotelId}?checkIn=2025-01-02&checkOut=2025-01-05
```

### 3. Create Reservation (Phase 1)
```http
POST /v1/reservations
{
  "hotelId": "...",
  "roomTypeId": "...",
  "checkInDate": "2025-01-02",
  "checkOutDate": "2025-01-05",
  "numberOfRooms": 2,
  "guest": { "firstName": "Alex", "email": "alex@example.com" }
}
→ Returns: { reservationId, status: "PENDING", expiresAt: "..." }
```

### 4. Confirm Reservation (Phase 2)
```http
POST /v1/reservations/{id}/confirm
Idempotency-Key: unique-uuid

{
  "paymentMethod": {
    "type": "card",
    "token": "stripe_token"
  }
}
→ Returns: { confirmationNumber: "BK-123456", status: "PAID" }
```

### 5. Cancel Reservation
```http
POST /v1/reservations/{id}/cancel
{ "reason": "change_of_plans" }
→ Returns: { refund: { amount: 400, percentage: 100 } }
```

---

## 🗄️ Key Database Queries

### Check Availability
```sql
SELECT
  MIN(total_inventory - total_reserved) AS min_available
FROM room_type_inventory
WHERE hotel_id = $1
  AND room_type_id = $2
  AND date >= $3
  AND date < $4;

-- Available if: min_available >= requested_rooms
```

### Get Pricing for Date Range
```sql
SELECT date, price
FROM room_price
WHERE hotel_id = $1
  AND room_type_id = $2
  AND date >= $3
  AND date < $4
ORDER BY date;
```

### Find Hotels with Availability
```sql
SELECT DISTINCT h.id, h.name, h.city
FROM hotel h
JOIN room_type rt ON rt.hotel_id = h.id
JOIN room_type_inventory ri ON ri.room_type_id = rt.id
WHERE h.city = $1
  AND ri.date >= $2
  AND ri.date < $3
  AND (ri.total_inventory - ri.total_reserved) >= $4
GROUP BY h.id, h.name, h.city
HAVING COUNT(DISTINCT ri.date) = $5; -- All dates available
```

---

## 🚨 Error Handling

### HTTP Status Codes

| Code | Meaning | Example |
|------|---------|---------|
| 200 | OK | Successful GET/PUT |
| 201 | Created | Reservation created |
| 400 | Bad Request | Invalid date format |
| 401 | Unauthorized | Missing auth token |
| 404 | Not Found | Hotel doesn't exist |
| 409 | Conflict | Room sold out |
| 410 | Gone | Reservation expired |
| 422 | Validation Error | Email format invalid |
| 429 | Rate Limit | Too many requests |
| 500 | Server Error | Database down |

### Common Error Responses

**Sold Out:**
```json
{
  "error": {
    "code": "ROOM_UNAVAILABLE",
    "message": "The requested room type is no longer available",
    "details": {
      "roomTypeId": "...",
      "unavailableDates": ["2025-01-03"]
    }
  }
}
```

**Price Changed:**
```json
{
  "error": {
    "code": "PRICE_CHANGED",
    "message": "The price has changed since your search",
    "details": {
      "oldPrice": 120.00,
      "newPrice": 150.00
    }
  }
}
```

---

## ⚡ Performance Tips

### 1. Index Critical Columns
```sql
CREATE INDEX idx_inventory_lookup 
  ON room_type_inventory(hotel_id, room_type_id, date);

CREATE INDEX idx_reservation_dates 
  ON reservation(check_in_date, check_out_date);

CREATE INDEX idx_reservation_status 
  ON reservation(status) WHERE status IN ('PENDING', 'PAID');
```

### 2. Cache Search Results
```typescript
// Cache for 5 minutes
const cacheKey = `search:${destination}:${checkIn}:${checkOut}`;
const cached = await redis.get(cacheKey);
if (cached) return JSON.parse(cached);

const results = await searchHotels(...);
await redis.setex(cacheKey, 300, JSON.stringify(results));
return results;
```

### 3. Use Connection Pooling
```typescript
// PostgreSQL pool
const pool = new Pool({
  max: 20, // Max connections
  min: 5,  // Min connections
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});
```

### 4. Optimize Date Range Queries
```sql
-- Use date >= and date < (not BETWEEN)
WHERE date >= $1 AND date < $2

-- NOT: WHERE date BETWEEN $1 AND $2
```

---

## 🔐 Security Checklist

- [ ] **SQL Injection**: Use parameterized queries (Prisma/Drizzle)
- [ ] **XSS**: Sanitize user inputs (React auto-escapes)
- [ ] **CSRF**: Use SameSite cookies + CSRF tokens
- [ ] **Rate Limiting**: 1000 req/hour per user, 100/hour per IP
- [ ] **HTTPS**: All traffic over TLS
- [ ] **PCI Compliance**: Never store card data (use Stripe)
- [ ] **Input Validation**: Zod schemas on all inputs
- [ ] **Authentication**: JWT tokens with expiration
- [ ] **Authorization**: Check user permissions

---

## 📊 Monitoring Alerts

Set up alerts for:

| Metric | Threshold | Action |
|--------|-----------|--------|
| Error rate | > 1% | Page on-call engineer |
| Response time (P95) | > 500ms | Investigate |
| Overbooking incidents | > 0 | **CRITICAL** - Page immediately |
| Payment failures | > 5% | Check Stripe status |
| Database connections | > 80% | Scale database |
| Inventory drift | Any | Run reconciliation job |

---

## 🛠️ Useful Commands

```bash
# Database migrations
npm run db:migrate

# Seed sample data
npm run db:seed

# Check availability (psql)
psql -d hotel_booking -c "
  SELECT date, total_inventory, total_reserved, 
         (total_inventory - total_reserved) AS available
  FROM room_type_inventory
  WHERE hotel_id = '...' AND room_type_id = '...'
  ORDER BY date;
"

# Find reservations for a date
psql -d hotel_booking -c "
  SELECT r.id, r.status, g.email, r.number_of_rooms
  FROM reservation r
  JOIN guest g ON g.id = r.guest_id
  WHERE r.check_in_date = '2025-01-02';
"

# Check for inventory drift
psql -d hotel_booking -c "
  SELECT i.hotel_id, i.room_type_id, i.date,
         i.total_reserved AS inventory_reserved,
         COALESCE(SUM(r.number_of_rooms), 0) AS actual_reserved
  FROM room_type_inventory i
  LEFT JOIN reservation r
    ON r.hotel_id = i.hotel_id
    AND r.room_type_id = i.room_type_id
    AND r.status = 'PAID'
    AND i.date >= r.check_in_date
    AND i.date < r.check_out_date
  GROUP BY i.hotel_id, i.room_type_id, i.date, i.total_reserved
  HAVING i.total_reserved != COALESCE(SUM(r.number_of_rooms), 0);
"
```

---

## 🎓 Key Takeaways

1. **Always use FOR UPDATE** when checking and updating inventory
2. **Always use idempotency keys** for payment operations
3. **Always validate dates** (check-in < check-out, future dates)
4. **Always use transactions** for multi-step operations
5. **Always cache search results** (with short TTL)
6. **Never trust client-side availability** checks
7. **Never skip database constraints** (they're your safety net)
8. **Test concurrent bookings** thoroughly
9. **Monitor overbooking incidents** (should always be 0)
10. **Document your idempotency strategy** clearly

---

## 📚 Full Documentation

For comprehensive details, see:
- [UX Design](./01-UX-DESIGN.md) - 75 pages
- [Database Design](./02-DATABASE-DESIGN.md) - 40 pages
- [API Design](./03-API-DESIGN.md) - 50 pages
- [Architecture](./04-ARCHITECTURE-DIAGRAMS.md) - 35 pages

---

**Remember:** The goal is **ZERO OVERBOOKING**. Every design decision should support this goal.

---

*Last Updated: January 22, 2025*

