# Architecture & Diagrams

## Table of Contents
1. [System Architecture](#1-system-architecture)
2. [High-Level Architecture](#2-high-level-architecture)
3. [Microservices Architecture](#3-microservices-architecture)
4. [Database Architecture](#4-database-architecture)
5. [Booking Flow Sequence](#5-booking-flow-sequence)
6. [Concurrency Control](#6-concurrency-control)
7. [Deployment Architecture](#7-deployment-architecture)

---

## 1. System Architecture

### 1.1 Overview

The hotel booking system follows a **microservices architecture** with clear separation of concerns. Each service owns its domain logic and data, communicating through well-defined APIs.

**Key Principles:**
- **Service Isolation:** Each service can be developed, deployed, and scaled independently
- **Data Ownership:** Each service owns its data (no shared database)
- **API Gateway:** Single entry point for all client requests
- **Event-Driven:** Services communicate via events for async operations
- **Scalability:** Horizontal scaling for each service independently

---

## 2. High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         CLIENTS                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │  Web Browser │  │  Mobile App  │  │ Hotel Admin  │     │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘     │
└─────────┼──────────────────┼──────────────────┼─────────────┘
          │                  │                  │
          └──────────────────┼──────────────────┘
                             │
┌────────────────────────────▼─────────────────────────────────┐
│                      CDN / Load Balancer                      │
└────────────────────────────┬─────────────────────────────────┘
                             │
┌────────────────────────────▼─────────────────────────────────┐
│                    API GATEWAY (Kong/NGINX)                   │
│  • Authentication & Authorization                             │
│  • Rate Limiting                                              │
│  • Request Routing                                            │
│  • Response Caching                                           │
│  • Logging & Monitoring                                       │
└───────┬─────────┬─────────┬─────────┬─────────┬─────────────┘
        │         │         │         │         │
   ┌────▼───┐ ┌──▼───┐ ┌───▼──┐ ┌───▼──┐ ┌───▼────┐
   │ Hotel  │ │ Rate │ │ Res. │ │Guest │ │Payment │
   │Service │ │Service│ │Service│ │Service│ │Service│
   └────┬───┘ └──┬───┘ └───┬──┘ └───┬──┘ └───┬────┘
        │        │         │        │        │
   ┌────▼────────▼─────────▼────────▼────────▼────┐
   │            PostgreSQL Database(s)             │
   │  (Each service has its own database)          │
   └───────────────────────────────────────────────┘
        │
   ┌────▼──────────────────────────────────────────┐
   │       Message Queue (RabbitMQ/Kafka)          │
   │  • Async event processing                     │
   │  • Booking confirmations                      │
   │  • Email notifications                        │
   └───────────────────────────────────────────────┘
        │
   ┌────▼──────────────────────────────────────────┐
   │       Cache Layer (Redis)                     │
   │  • Session storage                            │
   │  • Search result caching                      │
   │  • Rate limiting counters                     │
   └───────────────────────────────────────────────┘
```

---

## 3. Microservices Architecture

### 3.1 Service Breakdown

```
┌─────────────────────────────────────────────────────────────┐
│                     PUBLIC API GATEWAY                       │
│                   (External-Facing REST API)                 │
└──────────┬──────────────────────────────────────────────────┘
           │
    ┌──────┼──────┬──────────┬──────────┬──────────┐
    │      │      │          │          │          │
    ▼      ▼      ▼          ▼          ▼          ▼
┌────────────────────────────────────────────────────────────┐
│                      MICROSERVICES                          │
├────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────────────────────────────────────────────┐  │
│  │  HOTEL SERVICE                                      │  │
│  │  • Manage hotel data (CRUD)                         │  │
│  │  • Hotel search & filtering                         │  │
│  │  • Room type management                             │  │
│  │  • Amenities & policies                             │  │
│  │  DB: hotels, room_types, amenities                  │  │
│  └─────────────────────────────────────────────────────┘  │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐  │
│  │  RATE SERVICE                                       │  │
│  │  • Pricing management                               │  │
│  │  • Inventory tracking (room_type_inventory)         │  │
│  │  • Availability calendar                            │  │
│  │  • Dynamic pricing (future)                         │  │
│  │  DB: room_type_inventory, room_price                │  │
│  └─────────────────────────────────────────────────────┘  │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐  │
│  │  RESERVATION SERVICE ⭐ CORE                        │  │
│  │  • Create reservations (PENDING)                    │  │
│  │  • Confirm reservations (PAID)                      │  │
│  │  • Cancel reservations                              │  │
│  │  • Availability checks (with locking)               │  │
│  │  • Idempotency handling                             │  │
│  │  DB: reservations                                   │  │
│  └─────────────────────────────────────────────────────┘  │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐  │
│  │  PAYMENT SERVICE                                    │  │
│  │  • Process payments (Stripe/PayPal)                 │  │
│  │  • Refund processing                                │  │
│  │  • Payment method storage (tokenized)               │  │
│  │  • PCI compliance handling                          │  │
│  │  DB: payments                                       │  │
│  └─────────────────────────────────────────────────────┘  │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐  │
│  │  GUEST SERVICE                                      │  │
│  │  • Guest profile management                         │  │
│  │  • Guest authentication (optional)                  │  │
│  │  • Booking history                                  │  │
│  │  • Preferences & saved cards                        │  │
│  │  DB: guests, user_accounts                          │  │
│  └─────────────────────────────────────────────────────┘  │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐  │
│  │  NOTIFICATION SERVICE (Background)                  │  │
│  │  • Booking confirmation emails                      │  │
│  │  • Cancellation emails                              │  │
│  │  • Reminders (check-in approaching)                 │  │
│  │  • SMS notifications (optional)                     │  │
│  └─────────────────────────────────────────────────────┘  │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

### 3.2 Service Communication

**Synchronous (HTTP/gRPC):**
- API Gateway → Services: REST API calls
- Service → Service: gRPC for performance (optional: REST)

**Asynchronous (Message Queue):**
- Reservation confirmed → Send confirmation email
- Payment failed → Notify support team
- Cancellation → Release inventory, send email

**Example Event Flow:**

```
┌──────────────┐         ┌──────────────┐        ┌──────────────┐
│ Reservation  │ confirm │   Payment    │ charge │   Stripe     │
│   Service    ├────────►│   Service    ├───────►│   (PSP)      │
└──────┬───────┘         └──────┬───────┘        └──────────────┘
       │                        │
       │ success                │ success
       ◄────────────────────────┘
       │
       │ publish: "reservation.confirmed"
       ▼
┌──────────────┐
│ Message Queue│
└──────┬───────┘
       │ consume
       ▼
┌──────────────┐
│ Notification │ ───► Send email to guest
│   Service    │ ───► Send confirmation to hotel
└──────────────┘
```

---

## 4. Database Architecture

### 4.1 Data Model (Entity Relationship)

```
┌──────────────────────────────────────────────────────────────┐
│                      DATABASE SCHEMA                          │
└──────────────────────────────────────────────────────────────┘

┌─────────────┐
│   HOTEL     │
│─────────────│
│ id (PK)     │◄──────────────┐
│ name        │                │
│ city        │                │
│ country     │                │
│ star_rating │                │
│ latitude    │                │
│ longitude   │                │
│ ...         │                │
└─────────────┘                │
       │                       │
       │ 1:N                   │
       ▼                       │
┌─────────────┐                │
│ ROOM_TYPE   │                │
│─────────────│                │
│ id (PK)     │                │
│ hotel_id(FK)├────────────────┘
│ name        │
│ max_occ.    │
│ bed_type    │◄──────────────────┐
│ ...         │                   │
└─────────────┘                   │
       │                          │
       │ 1:N                      │
       ▼                          │
┌─────────────────────┐           │
│ ROOM_TYPE_INVENTORY │⭐ CORE    │
│─────────────────────│           │
│ hotel_id (PK, FK)   ├───────────┘
│ room_type_id(PK,FK) ├───────────┐
│ date (PK)           │           │
│ total_inventory     │           │
│ total_reserved      │           │
│ version             │           │
└─────────────────────┘           │
       ▲                          │
       │                          │
       │ updated by               │
       │                          │
┌─────────────┐                   │
│ RESERVATION │⭐ CORE             │
│─────────────│                   │
│ id (PK)     │                   │
│ guest_id(FK)├──────┐            │
│ hotel_id(FK)├──────┼────────────┘
│ room_type_id├──────┘
│ check_in    │
│ check_out   │
│ num_rooms   │
│ status      │ (PENDING, PAID, CANCELLED)
│ total_price │
│ idempotency │
│ ...         │
└─────┬───────┘
      │ 1:1
      ▼
┌─────────────┐
│  PAYMENT    │
│─────────────│
│ id (PK)     │
│ reserv_id(FK)
│ amount      │
│ status      │
│ provider_id │
│ ...         │
└─────────────┘

┌─────────────┐
│   GUEST     │
│─────────────│
│ id (PK)     │
│ first_name  │
│ last_name   │
│ email       │
│ phone       │
│ ...         │
└─────────────┘
      ▲
      │
      └─────── FK from RESERVATION
```

---

### 4.2 Inventory Table Detail

**The Core of Availability Management:**

```
room_type_inventory
┌─────────────┬──────────────┬────────┬───────────┬──────────────┐
│  hotel_id   │ room_type_id │  date  │total_inv  │total_reserved│
├─────────────┼──────────────┼────────┼───────────┼──────────────┤
│ hotel-1     │ deluxe-king  │ Jan 2  │    10     │      8       │
│ hotel-1     │ deluxe-king  │ Jan 3  │    10     │      9       │ ← 1 left
│ hotel-1     │ deluxe-king  │ Jan 4  │    10     │      10      │ ← SOLD OUT
│ hotel-1     │ deluxe-king  │ Jan 5  │    10     │      7       │
│ hotel-1     │ superior-queen│ Jan 2 │    15     │      12      │
│ ...         │ ...          │ ...    │    ...    │     ...      │
└─────────────┴──────────────┴────────┴───────────┴──────────────┘

Available = total_inventory - total_reserved
```

**Key Properties:**
- Composite Primary Key: `(hotel_id, room_type_id, date)`
- Constraint: `total_reserved <= total_inventory` (prevents overbooking)
- Updated atomically during booking/cancellation
- Indexed for fast date range queries

---

## 5. Booking Flow Sequence

### 5.1 Complete Booking Sequence (No Double Booking)

```
┌──────┐    ┌─────┐   ┌──────┐  ┌──────┐  ┌───────┐  ┌────────┐
│Client│    │  API│   │Reserv│  │ Rate │  │Payment│  │Inventory│
│      │    │Gateway│  │Service  │Service  │Service  │  DB    │
└───┬──┘    └──┬──┘   └───┬──┘  └───┬──┘  └───┬───┘  └───┬────┘
    │          │          │         │         │          │
    │ 1. POST /reservations         │         │          │
    ├─────────►│          │         │         │          │
    │          │          │         │         │          │
    │          │ 2. Create reservation (PENDING)          │
    │          ├─────────►│         │         │          │
    │          │          │         │         │          │
    │          │          │ 3. Check availability        │
    │          │          ├────────►│         │          │
    │          │          │         │ 4. Query inventory │
    │          │          │         ├────────────────────►│
    │          │          │         │         │          │
    │          │          │         │ 5. FOR UPDATE lock │
    │          │          │         │◄────────────────────┤
    │          │          │         │         │          │
    │          │          │◄────────┤ 6. Available: true │
    │          │          │         │         │          │
    │          │◄─────────┤ 7. Reservation created       │
    │◄─────────┤           (status=PENDING, expires in 15min)
    │          │          │         │         │          │
    │ 8. Show review page with price holdTimer           │
    │          │          │         │         │          │
    │ 9. POST /reservations/{id}/confirm                 │
    │          │  (Idempotency-Key: abc-123)             │
    ├─────────►│          │         │         │          │
    │          │          │         │         │          │
    │          │ 10. Confirm reservation                 │
    │          ├─────────►│         │         │          │
    │          │          │         │         │          │
    │          │          │ 11. Check idempotency key    │
    │          │          │ (if exists, return cached)   │
    │          │          │         │         │          │
    │          │          │ 12. Process payment          │
    │          │          ├─────────┼────────►│          │
    │          │          │         │         │ Charge $400
    │          │          │         │         │ (to Stripe)
    │          │          │◄────────┼─────────┤          │
    │          │          │         │ Success │          │
    │          │          │         │         │          │
    │          │          │ 13. BEGIN TRANSACTION        │
    │          │          ├──────────────────────────────►│
    │          │          │         │         │          │
    │          │          │ 14. Lock inventory (FOR UPDATE)
    │          │          │◄──────────────────────────────┤
    │          │          │         │         │          │
    │          │          │ 15. Update: total_reserved += 2
    │          │          ├──────────────────────────────►│
    │          │          │         │         │          │
    │          │          │ 16. Update reservation status │
    │          │          │     (PENDING → PAID)         │
    │          │          │         │         │          │
    │          │          │ 17. COMMIT                   │
    │          │          │◄──────────────────────────────┤
    │          │          │         │         │          │
    │          │◄─────────┤ 18. Confirmed (status=PAID)  │
    │◄─────────┤          │         │         │          │
    │          │          │         │         │          │
    │ 19. Show confirmation page (BK-123456)             │
    │          │          │         │         │          │
    │          │ 20. Publish event: "reservation.confirmed"
    │          │          ├─────────┼─────────┼──────────►
    │          │          │         │         │ (Message Queue)
    │          │          │         │         │          │
    │          │          │         │ 21. Notification Service
    │          │          │         │         │   sends email
    │          │          │         │         │          │
    └──────────┴──────────┴─────────┴─────────┴──────────┴────────┘
```

---

### 5.2 Race Condition Prevention (Two Users, One Room Left)

```
┌─────────┐  ┌─────────┐         ┌──────────────┐
│ User A  │  │ User B  │         │  Inventory   │
│         │  │         │         │  (1 room)    │
└────┬────┘  └────┬────┘         └──────┬───────┘
     │            │                     │
     │ 1. POST /reservations            │
     ├──────────────────────────────────►
     │            │                     │
     │            │ 2. POST /reservations
     │            ├─────────────────────►
     │            │                     │
     │      3. Lock inventory (User A)  │
     │◄────────────────────────────────┤
     │            │ LOCKED              │
     │            │                     │
     │      4. Check: 1 room available  │
     │            │                     │
     │      5. User B tries to lock     │
     │            │◄────────────────────┤
     │            │ WAITING (blocked)   │
     │            │                     │
     │      6. Reserve for User A       │
     │      (total_reserved = 1)        │
     ├─────────────────────────────────►
     │            │                     │
     │      7. COMMIT & Release lock    │
     ├─────────────────────────────────►
     │            │ UNLOCKED            │
     │            │                     │
     │            │ 8. User B acquires lock
     │            │◄────────────────────┤
     │            │                     │
     │            │ 9. Check: 0 rooms available
     │            │     (total_reserved = 1)
     │            │                     │
     │            │ 10. SOLD OUT error  │
     │            │◄────────────────────┤
     │            │                     │
     │  11. Confirmation ✅             │
     │◄─────────────────────────────────┤
     │            │                     │
     │            │ 12. "Sorry, sold out" ❌
     │            │◄────────────────────┤
     │            │                     │
```

**Key Mechanisms:**
- `FOR UPDATE` locks inventory rows during transaction
- User B's transaction waits until User A commits
- After commit, User B sees updated `total_reserved`
- Database constraint prevents overbooking even if logic fails

---

### 5.3 Idempotency (Preventing Duplicate Bookings)

```
┌──────┐              ┌───────────────┐
│Client│              │ Reservation   │
│      │              │   Service     │
└───┬──┘              └───────┬───────┘
    │                         │
    │ 1. POST /confirm        │
    │ Idempotency-Key: key-123│
    ├────────────────────────►│
    │                         │
    │          2. Check cache/DB for key-123
    │                   (not found)
    │                         │
    │          3. Process payment
    │                   ✅ Success
    │                         │
    │          4. Save result with key-123
    │                         │
    │◄────────────────────────┤
    │   5. Return: 200 OK     │
    │   Booking: BK-123456    │
    │                         │
    │ 6. User clicks again    │
    │ POST /confirm           │
    │ Idempotency-Key: key-123│ (SAME KEY)
    ├────────────────────────►│
    │                         │
    │          7. Check cache/DB for key-123
    │                   (FOUND!)
    │                         │
    │          8. Return cached result
    │◄────────────────────────┤
    │   9. Return: 200 OK     │
    │   Booking: BK-123456    │ (SAME BOOKING)
    │   (No duplicate charge) │
    │                         │
```

**Benefits:**
- ✅ Safe retries
- ✅ No duplicate bookings
- ✅ No duplicate payments
- ✅ Idempotent by design

---

## 6. Concurrency Control

### 6.1 Pessimistic Locking (MVP Approach)

```sql
-- Step 1: Begin transaction
BEGIN;

-- Step 2: Lock inventory rows (blocks other transactions)
SELECT date, total_inventory, total_reserved
FROM room_type_inventory
WHERE hotel_id = 'hotel-123'
  AND room_type_id = 'deluxe-king'
  AND date >= '2025-01-02'
  AND date < '2025-01-05'
FOR UPDATE;

-- Step 3: Check availability in application code
-- If available:

-- Step 4: Update inventory
UPDATE room_type_inventory
SET total_reserved = total_reserved + 2
WHERE hotel_id = 'hotel-123'
  AND room_type_id = 'deluxe-king'
  AND date >= '2025-01-02'
  AND date < '2025-01-05';

-- Step 5: Update reservation status
UPDATE reservation
SET status = 'PAID'
WHERE id = 'reservation-abc';

-- Step 6: Commit (releases lock)
COMMIT;
```

**Pros:**
- ✅ Simple to implement
- ✅ Guarantees no race conditions
- ✅ Good for moderate concurrency

**Cons:**
- ❌ Lower throughput (locks block others)
- ❌ Potential deadlocks if not careful

---

### 6.2 Optimistic Locking (Alternative)

```sql
-- Step 1: Read inventory with version
SELECT date, total_inventory, total_reserved, version
FROM room_type_inventory
WHERE hotel_id = 'hotel-123'
  AND room_type_id = 'deluxe-king'
  AND date >= '2025-01-02'
  AND date < '2025-01-05';

-- Application checks availability

-- Step 2: Update with version check
UPDATE room_type_inventory
SET total_reserved = total_reserved + 2,
    version = version + 1
WHERE hotel_id = 'hotel-123'
  AND room_type_id = 'deluxe-king'
  AND date = '2025-01-02'
  AND version = 5;  -- Only update if version matches

-- Step 3: Check affected rows
-- If affected_rows < expected: version conflict, retry
```

**Pros:**
- ✅ Higher concurrency (no blocking)
- ✅ Better performance at scale

**Cons:**
- ❌ More complex (retry logic)
- ❌ Can fail under high contention

---

### 6.3 Database Constraint (Safety Net)

```sql
-- Constraint prevents invalid state
ALTER TABLE room_type_inventory
  ADD CONSTRAINT check_no_overbooking
  CHECK (total_reserved <= total_inventory);
```

**Behavior:**
- If UPDATE would violate constraint → Transaction fails
- Application must handle error gracefully
- **Ultimate safety net** even if locking fails

---

## 7. Deployment Architecture

### 7.1 Cloud Deployment (AWS Example)

```
┌────────────────────────────────────────────────────────────┐
│                    Route 53 (DNS)                          │
└─────────────────────────┬──────────────────────────────────┘
                          │
┌─────────────────────────▼──────────────────────────────────┐
│              CloudFront (CDN + Edge Caching)               │
└─────────────────────────┬──────────────────────────────────┘
                          │
┌─────────────────────────▼──────────────────────────────────┐
│                Application Load Balancer                   │
│                   (Multi-AZ, SSL/TLS)                      │
└───────┬──────────────────┬─────────────────────────────────┘
        │                  │
┌───────▼──────────────────▼─────────────────────────────────┐
│                    ECS / EKS Cluster                        │
│                  (Container Orchestration)                  │
│                                                             │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐          │
│  │ API Gateway│  │   Hotel    │  │    Rate    │          │
│  │  Service   │  │  Service   │  │  Service   │          │
│  │ (Fargate)  │  │ (Fargate)  │  │ (Fargate)  │          │
│  └────────────┘  └────────────┘  └────────────┘          │
│                                                             │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐          │
│  │Reservation │  │   Guest    │  │  Payment   │          │
│  │  Service   │  │  Service   │  │  Service   │          │
│  │ (Fargate)  │  │ (Fargate)  │  │ (Fargate)  │          │
│  └────────────┘  └────────────┘  └────────────┘          │
└─────────┬───────────────┬────────────────────────────────┘
          │               │
┌─────────▼───────────────▼────────────────────────────────┐
│               RDS PostgreSQL (Multi-AZ)                   │
│              (Primary + Read Replica)                     │
└───────────────────────────────────────────────────────────┘

┌───────────────────────────────────────────────────────────┐
│              ElastiCache (Redis) - Caching                │
└───────────────────────────────────────────────────────────┘

┌───────────────────────────────────────────────────────────┐
│         SQS / SNS - Message Queue & Notifications         │
└───────────────────────────────────────────────────────────┘

┌───────────────────────────────────────────────────────────┐
│        S3 - Static Assets (Images, Documents)             │
└───────────────────────────────────────────────────────────┘

┌───────────────────────────────────────────────────────────┐
│     CloudWatch - Monitoring, Logging, Alerts              │
└───────────────────────────────────────────────────────────┘
```

---

### 7.2 Kubernetes Deployment (Alternative)

```yaml
# Example K8s deployment for Reservation Service

apiVersion: apps/v1
kind: Deployment
metadata:
  name: reservation-service
spec:
  replicas: 3
  selector:
    matchLabels:
      app: reservation-service
  template:
    metadata:
      labels:
        app: reservation-service
    spec:
      containers:
      - name: reservation-service
        image: hotel-booking/reservation-service:v1.0
        ports:
        - containerPort: 8080
        env:
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: db-credentials
              key: url
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "512Mi"
            cpu: "500m"
        livenessProbe:
          httpGet:
            path: /health
            port: 8080
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /ready
            port: 8080
          initialDelaySeconds: 5
          periodSeconds: 5

---

apiVersion: v1
kind: Service
metadata:
  name: reservation-service
spec:
  selector:
    app: reservation-service
  ports:
  - port: 80
    targetPort: 8080
  type: ClusterIP

---

apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: reservation-service-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: reservation-service
  minReplicas: 3
  maxReplicas: 10
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
```

---

### 7.3 Scalability Considerations

**Horizontal Scaling:**
- Each microservice can scale independently
- Add more instances during peak booking times
- Auto-scaling based on CPU/memory/request count

**Database Scaling:**
- Read replicas for search queries
- Connection pooling (PgBouncer)
- Partitioning `room_type_inventory` by date
- Sharding by `hotel_id` for very large scale

**Caching Strategy:**
- Redis for:
  - Search results (TTL: 5 minutes)
  - Hotel details (TTL: 1 hour)
  - Session data
  - Rate limiting counters
  - Idempotency keys (TTL: 24 hours)

**CDN Strategy:**
- CloudFront/Cloudflare for:
  - Static assets (images, CSS, JS)
  - API Gateway responses (where appropriate)
  - Geographic distribution

---

### 7.4 High Availability

**Multi-Region Deployment:**
```
┌─────────────────┐         ┌─────────────────┐
│   Region: US    │         │   Region: EU    │
│   (Primary)     │         │   (Secondary)   │
├─────────────────┤         ├─────────────────┤
│ • API Gateway   │         │ • API Gateway   │
│ • All Services  │         │ • All Services  │
│ • DB Primary    │◄────────┤ • DB Replica    │
│ • Redis Primary │  Sync   │ • Redis Replica │
└─────────────────┘         └─────────────────┘
```

**Disaster Recovery:**
- RTO (Recovery Time Objective): < 1 hour
- RPO (Recovery Point Objective): < 5 minutes
- Automated backups (daily + point-in-time)
- Cross-region replication

---

### 7.5 Monitoring & Observability

**Metrics:**
- Request rate, latency, error rate
- Database connection pool utilization
- Cache hit/miss ratio
- Booking conversion rate
- Overbooking incidents (should be 0)

**Logging:**
- Centralized logging (ELK/CloudWatch)
- Request tracing (OpenTelemetry/Jaeger)
- Correlation IDs across services

**Alerting:**
- High error rate (> 1%)
- Slow response time (P95 > 500ms)
- Database connection exhaustion
- Payment failures spike
- Inventory sync issues

---

## Summary

### Architecture Highlights

✅ **Microservices:** Independent, scalable services  
✅ **Database per Service:** Clear ownership, no shared DB  
✅ **API Gateway:** Single entry point, centralized concerns  
✅ **Event-Driven:** Async processing via message queue  
✅ **Pessimistic Locking:** Safe concurrency (MVP)  
✅ **Idempotency:** Duplicate prevention  
✅ **Horizontal Scaling:** Auto-scaling by service  
✅ **High Availability:** Multi-AZ, replicas, backups  

### Key Design Patterns

- **Two-Phase Booking:** PENDING → PAID
- **Inventory Locking:** `FOR UPDATE` on reservation
- **Database Constraints:** Ultimate safety net
- **Idempotency Keys:** Prevent duplicate operations
- **Circuit Breaker:** Graceful degradation (future)
- **Saga Pattern:** Distributed transactions (future)

This architecture supports **100+ bookings per second** with room for growth to **1000+** via horizontal scaling, caching, and database optimizations.

