# Environment Setup

Create a `.env` file in the root directory with the following content:

```env
# Database - Update with your PostgreSQL credentials
DATABASE_URL="postgresql://user:password@localhost:5432/hotel_booking?schema=public"

# Next.js
NEXT_PUBLIC_API_URL="http://localhost:3000/api"

# Payment (Stripe) - Optional for MVP
STRIPE_SECRET_KEY="sk_test_..."
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_test_..."

# Email (SendGrid) - Optional for MVP
SENDGRID_API_KEY="SG..."
SENDGRID_FROM_EMAIL="noreply@hotel-booking.com"

# Redis (Optional for MVP)
REDIS_URL="redis://localhost:6379"
```

## Quick Start with Local PostgreSQL

### Option 1: Using Docker
```bash
docker run --name hotel-booking-db \
  -e POSTGRES_PASSWORD=password \
  -e POSTGRES_DB=hotel_booking \
  -p 5432:5432 \
  -d postgres:14
```

Then use:
```env
DATABASE_URL="postgresql://postgres:password@localhost:5432/hotel_booking?schema=public"
```

### Option 2: Local PostgreSQL Installation
If you have PostgreSQL installed locally:
```bash
createdb hotel_booking
```

Then use:
```env
DATABASE_URL="postgresql://YOUR_USER:YOUR_PASSWORD@localhost:5432/hotel_booking?schema=public"
```

## Running Migrations

After setting up your database:

```bash
# Generate Prisma Client
npx prisma generate

# Create the database schema
npx prisma db push

# Seed sample data
npx prisma db seed
```

## Verifying the Setup

```bash
# Open Prisma Studio to view your data
npx prisma studio
```

This will open a web interface at http://localhost:5555 where you can view and edit your database records.

