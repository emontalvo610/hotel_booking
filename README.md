# Hotel Booking System - Design Documentation

## 📚 Documentation Index

This folder contains comprehensive design documentation for the Hotel Booking System MVP. All documents follow industry best practices and are based on patterns from "System Design Interview Volume 2" by Alex Xu.

---

## 📖 Documents Overview

### 1. [User Experience Design](./01-UX-DESIGN.md)
**75 pages | User-Facing Design**

Everything you need to know about the user experience:

**Contents:**
- 👥 User Personas (Guest, Hotel Staff, Support Agent)
- 🔍 Search & Browse Flows
- 🏨 Hotel Detail Pages
- 💳 Two-Step Booking Process
- 📱 Mobile UX Considerations
- ♿ Accessibility Guidelines
- ⚠️ Error Handling Patterns
- 🎨 UI Components & Wireframes

**Key Highlights:**
- Complete user journeys from search to confirmation
- Detailed wireframes for each screen
- Mobile-first responsive design
- WCAG 2.1 Level AA compliance
- Performance targets (LCP < 2.5s)

---

### 2. [Database Design](./02-DATABASE-DESIGN.md)
**40 pages | Data Architecture**

Complete database schema and design patterns:

**Contents:**
- 🗄️ PostgreSQL Schema (Complete SQL)
- 📊 Entity-Relationship Diagrams
- 🎯 Inventory Tracking Model
- 🔒 Concurrency Control (Pessimistic Locking)
- ⚡ Indexing & Performance
- 🛡️ Data Integrity & Constraints
- 🔄 Idempotency Handling

**Key Highlights:**
- **Room-type-based model** (not individual rooms)
- **Per-day inventory** tracking via `room_type_inventory` table
- **Zero overbooking** via `CHECK (total_reserved <= total_inventory)`
- Pessimistic locking for safe concurrent bookings
- Complete CREATE TABLE statements ready to execute

**Core Tables:**
```
hotel → room_type → room_type_inventory (⭐ core)
                  → room_price
guest → reservation → payment
```

---

### 3. [API Design](./03-API-DESIGN.md)
**50 pages | Backend APIs**

RESTful API specifications and contracts:

**Contents:**
- 🌐 Public APIs (Guest-Facing)
  - Search hotels
  - Get hotel details
  - Create & confirm reservations
  - Cancel bookings
- 🔐 Admin APIs (Hotel Extranet)
  - Manage inventory
  - Update pricing
  - View bookings
- 🔧 Internal Microservice APIs
- 🚨 Error Handling Patterns
- 🛡️ Security & Rate Limiting

**Key Highlights:**
- RESTful design with versioning (`/v1/`)
- Idempotency-Key header support
- Comprehensive error codes
- Rate limiting: 1000 req/hour per user
- Request/response examples for all endpoints

**Example Endpoints:**
```
POST /v1/reservations              # Create reservation (PENDING)
POST /v1/reservations/{id}/confirm # Confirm & pay (PAID)
GET  /v1/hotels/search             # Search hotels
PUT  /v1/admin/hotels/{id}/inventory # Update inventory
```

---

### 4. [Architecture & Diagrams](./04-ARCHITECTURE-DIAGRAMS.md)
**35 pages | System Design**

High-level architecture and deployment:

**Contents:**
- 🏗️ System Architecture Overview
- 🔧 Microservices Breakdown
- 📊 Data Flow Diagrams
- 🔄 Booking Sequence Diagrams
- 🔒 Concurrency Control Flow
- 🚀 Deployment Architecture
- 📈 Scaling Strategies
- 📊 Monitoring & Observability

**Key Highlights:**
- Microservices architecture (Hotel, Rate, Reservation, Payment, Guest services)
- Pessimistic locking sequence to prevent double-booking
- Kubernetes/ECS deployment patterns
- Horizontal scaling strategy
- Multi-region high availability

**Architecture Layers:**
```
Clients → CDN → API Gateway → Microservices → PostgreSQL
                                            → Redis (Cache)
                                            → Message Queue
```

---

## 🎯 Quick Start Guide

### For Product Managers
1. Start with **[UX Design](./01-UX-DESIGN.md)** to understand user flows
2. Review **[Architecture](./04-ARCHITECTURE-DIAGRAMS.md)** for system overview

### For Engineers
1. Read **[Database Design](./02-DATABASE-DESIGN.md)** to understand data model
2. Review **[API Design](./03-API-DESIGN.md)** for backend contracts
3. Study **[Architecture](./04-ARCHITECTURE-DIAGRAMS.md)** for system design

### For Designers
1. Focus on **[UX Design](./01-UX-DESIGN.md)** for wireframes and flows
2. Reference **[API Design](./03-API-DESIGN.md)** for data structures

### For QA/Testing
1. Review **[UX Design](./01-UX-DESIGN.md)** for test scenarios
2. Study **[API Design](./03-API-DESIGN.md)** for API test cases
3. Check **[Database Design](./02-DATABASE-DESIGN.md)** for data validation

---

## 📋 Document Summary

| Document | Pages | Focus Area | Target Audience |
|----------|-------|------------|-----------------|
| UX Design | 75 | User interface & flows | PM, Design, Frontend |
| Database Design | 40 | Data model & schema | Backend, DBA |
| API Design | 50 | API contracts | Backend, Frontend |
| Architecture | 35 | System design | All Engineering |

**Total:** 200+ pages of comprehensive design documentation

---

## 🔑 Key Concepts

### 1. Two-Phase Booking
```
Phase 1: Create Reservation (PENDING)
  ↓ Hold price for 15 minutes
Phase 2: Confirm & Pay (PAID)
  ↓ Lock inventory, process payment, update reservation
```

**Why?** Prevents showing "sold out" at checkout while allowing users time to complete payment.

---

### 2. Room-Type Inventory Model

Instead of tracking individual room numbers, we track **room types**:

```
Hotel has:
  ├── 10 × Deluxe King Rooms
  ├── 15 × Superior Queen Rooms
  └── 5 × Presidential Suites

For each room type, per day:
  total_inventory = 10
  total_reserved = 8
  available = 2
```

**Why?** Simpler to manage, flexible room assignment at check-in, standard industry practice.

---

### 3. Preventing Double Booking

**Three-Layer Protection:**

1. **Pessimistic Locking** (Application Level)
   ```sql
   SELECT ... FROM room_type_inventory
   WHERE ... FOR UPDATE;  -- Locks rows
   ```

2. **Database Constraint** (Database Level)
   ```sql
   CHECK (total_reserved <= total_inventory)
   ```

3. **Idempotency** (API Level)
   ```http
   Idempotency-Key: unique-uuid
   ```

**Result:** Zero overbooking, even under high concurrency.

---

### 4. Microservices Architecture

**Services:**
- **Hotel Service**: Hotel data, room types, amenities
- **Rate Service**: Pricing, inventory, availability calendar
- **Reservation Service**: Create/confirm/cancel bookings ⭐
- **Payment Service**: Process payments, refunds (Stripe)
- **Guest Service**: Guest profiles, authentication
- **Notification Service**: Emails, SMS (background)

**Communication:**
- Synchronous: HTTP/gRPC between services
- Asynchronous: Message queue (RabbitMQ/Kafka) for events

---

## 🛠️ Implementation Checklist

### Phase 1: MVP Core (Weeks 1-4)
- [ ] Set up PostgreSQL database with schema
- [ ] Implement Hotel Service (CRUD)
- [ ] Implement Rate Service (inventory + pricing)
- [ ] Implement Reservation Service (create, confirm, cancel)
- [ ] Integrate Payment Service (Stripe)
- [ ] Build search & hotel detail pages
- [ ] Build booking flow (2-step process)
- [ ] Set up email notifications

### Phase 2: Polish & Admin (Weeks 5-6)
- [ ] Build hotel admin panel
- [ ] Inventory management UI
- [ ] Booking management UI
- [ ] Add error handling & edge cases
- [ ] Implement rate limiting
- [ ] Add monitoring & logging

### Phase 3: Testing & Launch (Weeks 7-8)
- [ ] Unit tests (80%+ coverage)
- [ ] Integration tests
- [ ] E2E tests (critical paths)
- [ ] Load testing (100+ concurrent bookings)
- [ ] Security audit
- [ ] Performance optimization
- [ ] Production deployment

---

## 📊 Technical Specifications

### Performance Targets
- **Availability Check**: < 5ms
- **Booking Transaction**: < 50ms
- **Search Results**: < 200ms
- **Page Load (FCP)**: < 1.5s
- **Concurrent Bookings**: 100+ per second per room type

### Scalability
- **Hotels**: 10,000+
- **Bookings/day**: 100,000+
- **Concurrent users**: 10,000+
- **Database size**: 365M rows (room_type_inventory)

### Availability
- **Uptime SLA**: 99.9% (< 8.7 hours downtime/year)
- **RTO**: < 1 hour
- **RPO**: < 5 minutes

---

## 🔗 Related Resources

### External Documentation
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Next.js Documentation](https://nextjs.org/docs)
- [Stripe API Reference](https://stripe.com/docs/api)

### Reference Materials
- **Book**: "System Design Interview Volume 2" by Alex Xu (Chapter 7: Hotel Reservation System)
- **Patterns**: Event-Driven Architecture, CQRS, Saga Pattern
- **Standards**: REST API Design, OpenAPI Spec

### Inspiration
- **Booking.com**: Search & booking flow
- **Airbnb**: UX patterns & mobile design
- **Expedia**: Inventory management

---

## 🤝 Contributing to Documentation

### Documentation Standards
- **Format**: Markdown (.md)
- **Diagrams**: Mermaid syntax or ASCII art
- **Code**: Syntax-highlighted with language tags
- **Examples**: Real-world scenarios with sample data

### Updating Documentation
1. Edit the relevant `.md` file
2. Ensure diagrams render correctly
3. Add examples where helpful
4. Update this index if adding new sections
5. Submit PR with clear description

### Document Versioning
- Version number at top of each document
- Change log at bottom of document
- Date of last update

---

## 📞 Questions?

If you have questions about the design:

1. **Check existing docs first** - Most answers are here
2. **Review related sections** - Check cross-references
3. **Ask in Slack** - #hotel-booking-design channel
4. **Open a GitHub Discussion** - For design proposals

---

## 📝 Document Change Log

| Date | Document | Changes | Author |
|------|----------|---------|--------|
| 2025-01-22 | All | Initial creation | System |
| - | - | - | - |

---

**Last Updated:** January 22, 2025  
**Documentation Version:** 1.0.0  
**Status:** ✅ Complete - Ready for MVP Implementation

---

*This documentation represents 200+ pages of comprehensive design work, ready to guide the implementation of a production-ready hotel booking system with zero overbooking and industry-standard best practices.*

