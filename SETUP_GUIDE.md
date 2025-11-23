# 🚀 Hotel Booking MVP - Setup Guide

## ✅ What's Been Implemented

### Database & Backend
- ✅ **Prisma ORM** with PostgreSQL schema
- ✅ **Complete database model** (hotels, room_types, inventory, reservations, etc.)
- ✅ **Seed script** with sample data (3 hotels, 5 room types, 90 days of inventory)
- ✅ **Core API routes**:
  - `GET /api/hotels/search` - Search hotels
  - `GET /api/hotels/[id]` - Hotel details  
  - `POST /api/reservations` - Create reservation (Phase 1)
  - `POST /api/reservations/[id]/confirm` - Confirm with payment (Phase 2) ⭐
  - `GET /api/reservations/[id]` - Get reservation details
- ✅ **Pessimistic locking** in confirmation route to prevent double booking
- ✅ **Idempotency support** for safe retries

### Frontend
- ✅ **Home page** with search form
- ✅ **Responsive design** with Tailwind CSS

### Documentation
- ✅ 200+ pages of design docs in `/docs` folder
- ✅ Quick reference guide
- ✅ Professional README

---

## 📦 Prerequisites

Before you start, make sure you have:

- **Node.js 20+** installed
- **PostgreSQL 14+** running locally or via Docker
- **npm** or **yarn** package manager

---

## 🛠️ Setup Steps

### Step 1: Set Up PostgreSQL Database

**Option A: Using Docker (Recommended)**

```bash
docker run --name hotel-booking-db \
  -e POSTGRES_PASSWORD=password \
  -e POSTGRES_DB=hotel_booking \
  -p 5432:5432 \
  -d postgres:14
```

**Option B: Local PostgreSQL**

If you have PostgreSQL installed locally:

```bash
createdb hotel_booking
```

---

### Step 2: Configure Environment Variables

Create a `.env` file in the root directory:

```bash
# Copy and edit this:
DATABASE_URL="postgresql://postgres:password@localhost:5432/hotel_booking?schema=public"
NEXT_PUBLIC_API_URL="http://localhost:3000/api"
```

**Important:** Update `postgres:password` with your actual PostgreSQL username and password.

---

### Step 3: Install Dependencies

```bash
npm install
```

---

### Step 4: Set Up the Database

Generate Prisma Client:

```bash
npm run db:generate
```

Push the schema to your database (creates all tables):

```bash
npm run db:push
```

Seed with sample data:

```bash
npm run db:seed
```

**Expected Output:**
```
🌱 Starting database seed...
Creating hotels...
✅ Created 3 hotels
Creating room types...
✅ Created 5 room types
Creating inventory and pricing...
✅ Created inventory and pricing for 90 days
Creating sample guests...
✅ Created 2 sample guests
Creating sample reservations...
✅ Created 1 sample reservation with payment
🎉 Database seed completed successfully!
```

---

### Step 5: Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🧪 Testing the MVP

### 1. Test Search Functionality

1. Go to http://localhost:3000
2. Use the search form:
   - **Destination:** Seattle (or Portland, San Francisco)
   - **Check-in:** Tomorrow's date
   - **Check-out:** 3 days from tomorrow
   - **Guests:** 2
   - **Rooms:** 1
3. Click "Search Hotels"

**API Test (Terminal):**
```bash
curl "http://localhost:3000/api/hotels/search?destination=Seattle&checkIn=2025-01-25&checkOut=2025-01-28&guests=2&rooms=1"
```

---

### 2. Test Hotel Details

Get a hotel ID from the search results, then:

**API Test:**
```bash
# Replace HOTEL_ID with actual ID
curl "http://localhost:3000/api/hotels/HOTEL_ID?checkIn=2025-01-25&checkOut=2025-01-28&rooms=1"
```

---

### 3. Test Two-Phase Booking

#### Phase 1: Create Reservation (PENDING)

```bash
curl -X POST http://localhost:3000/api/reservations \
  -H "Content-Type: application/json" \
  -d '{
    "hotelId": "YOUR_HOTEL_ID",
    "roomTypeId": "YOUR_ROOM_TYPE_ID",
    "checkInDate": "2025-01-25",
    "checkOutDate": "2025-01-28",
    "numberOfRooms": 1,
    "guest": {
      "firstName": "John",
      "lastName": "Doe",
      "email": "john.doe@example.com",
      "phone": "+1-555-9999"
    },
    "specialRequests": "Late check-in please"
  }'
```

**Expected Response:**
```json
{
  "data": {
    "reservationId": "abc-123...",
    "status": "PENDING",
    "expiresAt": "2025-01-22T10:15:00Z",
    "pricing": {
      "total": 432
    }
  }
}
```

#### Phase 2: Confirm Reservation (PAID)

```bash
curl -X POST http://localhost:3000/api/reservations/RESERVATION_ID/confirm \
  -H "Content-Type: application/json" \
  -H "Idempotency-Key: unique-key-12345" \
  -d '{
    "paymentMethod": {
      "type": "card",
      "token": "mock_token_123"
    }
  }'
```

**Expected Response:**
```json
{
  "data": {
    "reservationId": "abc-123...",
    "confirmationNumber": "BK-ABC123",
    "status": "PAID",
    "payment": {
      "status": "SUCCEEDED"
    }
  }
}
```

---

### 4. Test Idempotency (Double-Click Prevention)

Run the same confirm request again with the **same Idempotency-Key**:

```bash
# Same request as above
curl -X POST http://localhost:3000/api/reservations/RESERVATION_ID/confirm \
  -H "Content-Type: application/json" \
  -H "Idempotency-Key: unique-key-12345" \
  -d '{ "paymentMethod": { "type": "card", "token": "mock_token_123" } }'
```

**Result:** Should return the same confirmation, **NOT** create a duplicate booking.

---

### 5. Test Concurrent Booking (Double Booking Prevention)

Open two terminal windows and run these simultaneously to try booking the last room:

**Terminal 1:**
```bash
curl -X POST http://localhost:3000/api/reservations/RESERVATION_ID/confirm \
  -H "Idempotency-Key: user-a-key" \
  -d '{ "paymentMethod": { "type": "card", "token": "token_a" } }'
```

**Terminal 2:**
```bash
curl -X POST http://localhost:3000/api/reservations/ANOTHER_RESERVATION_ID/confirm \
  -H "Idempotency-Key: user-b-key" \
  -d '{ "paymentMethod": { "type": "card", "token": "token_b" } }'
```

**Expected Result:**
- One succeeds: `"status": "PAID"`
- One fails: `"code": "ROOM_UNAVAILABLE"`

This proves the pessimistic locking works! 🎉

---

## 📊 View Database (Prisma Studio)

To visually explore your database:

```bash
npm run db:studio
```

Opens at http://localhost:5555

You can:
- View all tables and data
- Edit records
- Create test data
- Verify inventory updates

---

## 🐛 Troubleshooting

### Database Connection Error

```
Error: P1001: Can't reach database server
```

**Solution:**
1. Check PostgreSQL is running: `docker ps` or `psql -l`
2. Verify DATABASE_URL in `.env` is correct
3. Test connection: `psql -U postgres -d hotel_booking`

### Prisma Generate Error

```
Error: Prisma schema validation failed
```

**Solution:**
```bash
npm run db:generate
```

### Seed Script Fails

```
Error: Table doesn't exist
```

**Solution:**
```bash
npm run db:push  # Create tables first
npm run db:seed  # Then seed
```

### Port 3000 Already in Use

**Solution:**
```bash
# Kill the process
lsof -ti:3000 | xargs kill -9

# Or use a different port
PORT=3001 npm run dev
```

---

## 📁 Project Structure

```
hotel_booking/
├── prisma/
│   ├── schema.prisma          # Database schema
│   └── seed.ts                # Sample data script
├── src/
│   ├── app/
│   │   ├── api/               # API routes
│   │   │   ├── hotels/
│   │   │   └── reservations/
│   │   └── page.tsx           # Home page
│   └── lib/
│       ├── prisma.ts          # Prisma client
│       ├── types.ts           # TypeScript types
│       └── validations.ts     # Zod schemas
├── docs/                      # 200+ pages of design docs
├── .env                       # Environment variables (create this)
└── package.json
```

---

## 🚀 Next Steps

Now that you have the MVP running, you can:

1. **Explore the Documentation**
   - Read `/docs/QUICK-REFERENCE.md` for code examples
   - Study `/docs/02-DATABASE-DESIGN.md` for schema details
   - Review `/docs/03-API-DESIGN.md` for all endpoints

2. **Build the Frontend Pages**
   - Search results page (`/search`)
   - Hotel detail page (`/hotels/[id]`)
   - Booking flow pages (`/book/...`)
   - Admin panel (`/admin/...`)

3. **Add Features**
   - User authentication
   - Payment integration (Stripe)
   - Email notifications
   - Reviews and ratings
   - Admin dashboard

4. **Deploy to Production**
   - Use Vercel for Next.js app
   - Use Railway/Heroku for PostgreSQL
   - Set up monitoring (Sentry, DataDog)

---

## 📚 Key Concepts Implemented

### ⭐ Two-Phase Booking

```
Phase 1: POST /api/reservations
  → Creates reservation with status=PENDING
  → Holds price for 15 minutes
  → No inventory locked yet

Phase 2: POST /api/reservations/{id}/confirm
  → Process payment
  → Lock inventory rows (FOR UPDATE)
  → Update: total_reserved += N
  → Update status: PENDING → PAID
  → Commit transaction
```

### 🔒 Pessimistic Locking (SQL)

```sql
-- This blocks other transactions
SELECT * FROM room_type_inventory
WHERE hotel_id = ? AND room_type_id = ? AND date >= ? AND date < ?
FOR UPDATE;

-- Check availability while holding lock
-- If available:
UPDATE room_type_inventory
SET total_reserved = total_reserved + N
WHERE ...;
```

### 🔁 Idempotency

```typescript
// Frontend generates key once
const idempotencyKey = useState(() => uuidv4())

// Includes in header
headers: { 'Idempotency-Key': idempotencyKey }

// Backend checks if already processed
if (existingReservation) {
  return cachedResult // Same response
}
```

---

## 💡 Tips

1. **Use Prisma Studio** to debug inventory issues
2. **Check logs** for API errors: `console.log` outputs show in terminal
3. **Read the docs** in `/docs` folder for detailed explanations
4. **Test edge cases** like sold-out rooms, expired reservations
5. **Monitor database** constraints - they prevent overbooking

---

## 🎉 Success!

If you can:
- ✅ Search for hotels
- ✅ Create a PENDING reservation
- ✅ Confirm it to PAID status
- ✅ See inventory decrease in Prisma Studio
- ✅ Prevent double booking with concurrent requests

**You have a working hotel booking MVP with zero overbooking!** 🏆

---

## 📞 Need Help?

- **Documentation:** Check `/docs` folder
- **Quick Reference:** `/docs/QUICK-REFERENCE.md`
- **Database Issues:** Use `npm run db:studio`
- **API Testing:** Use Postman or curl

---

**Built with ❤️ following System Design Interview Vol. 2 best practices**

