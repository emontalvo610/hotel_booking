# User Experience Design

## Table of Contents
1. [Personas](#1-personas)
2. [Guest User Experience](#2-guest-user-experience)
3. [Hotel Staff Experience](#3-hotel-staff-experience)
4. [Mobile Considerations](#4-mobile-considerations)
5. [Accessibility & Performance](#5-accessibility--performance)

---

## 1. Personas

### 1.1 Guest (End User)
**Demographics:**
- Age: 25-65
- Tech savvy: Moderate to high
- Devices: Desktop, mobile, tablet

**Goals:**
- Search hotels by destination and dates
- Compare options (price, amenities, location, reviews)
- Book rooms quickly and securely
- Manage bookings (view, modify, cancel)
- Receive booking confirmation and reminders

**Pain Points:**
- Unclear pricing (hidden fees)
- Rooms sold out during checkout
- Complicated cancellation policies
- Slow or confusing booking process

**Success Metrics:**
- Time to complete booking < 3 minutes
- Booking abandonment rate < 30%
- Customer satisfaction score > 4.5/5

---

### 1.2 Hotel Staff / Revenue Manager
**Demographics:**
- Role: Property manager, revenue manager, front desk
- Tech savvy: Moderate
- Devices: Desktop primarily, tablet occasionally

**Goals:**
- Maintain accurate room inventory
- Set competitive prices
- Maximize occupancy and revenue
- Avoid overbooking
- Manage bookings and handle modifications

**Pain Points:**
- Manual inventory management errors
- Difficulty adjusting prices across date ranges
- Lack of visibility into booking trends
- Overbooking issues leading to customer complaints

**Success Metrics:**
- Zero overbooking incidents
- Inventory update time < 1 minute
- Revenue optimization (occupancy rate > 80%)

---

### 1.3 Customer Support Agent
**Demographics:**
- Role: Customer service representative
- Tech savvy: Moderate to high
- Devices: Desktop

**Goals:**
- Quickly look up reservations
- Modify/cancel bookings on behalf of guests
- Issue refunds
- Resolve customer issues efficiently

**Pain Points:**
- Slow search and retrieval
- Complex modification workflows
- Unclear refund policies
- Limited visibility into booking history

**Success Metrics:**
- Average handling time < 5 minutes
- First contact resolution rate > 85%
- Customer satisfaction after support > 4.5/5

---

## 2. Guest User Experience

### 2.1 Search & Browse Flow

#### 2.1.1 Entry Points

**Home Page**
- Prominent search hero section with background image
- Search form centered and easy to access
- Quick links to "Popular Destinations" below the fold
- Recent searches (if user is logged in)

**Deep Links**
- Marketing emails: "Hotels in Seattle, Jan 3-7 for 2 guests" → pre-filled search
- Push notifications: "Your saved search has new deals"
- Social media ads → specific destination landing pages

---

#### 2.1.2 Search Form

**Layout:**
```
┌─────────────────────────────────────────────────────┐
│  Where are you going?                               │
│  [Destination input with autocomplete        ] 🔍  │
│                                                     │
│  Check-in           Check-out         Guests       │
│  [Jan 02, 2025]    [Jan 05, 2025]    [2 guests] ▼ │
│                                                     │
│  [         Search Hotels         ]                 │
└─────────────────────────────────────────────────────┘
```

**Input Fields:**

1. **Destination** (Text input with autocomplete)
   - Placeholder: "City, hotel name, or landmark"
   - Autocomplete suggestions:
     - Cities (with country/state)
     - Hotel names
     - Landmarks
     - Airport codes
   - Shows icon (city 🏙️ / hotel 🏨 / landmark 📍)
   - Recent searches shown if available

2. **Check-in Date** (Date picker)
   - Opens calendar component
   - Disabled dates:
     - Past dates
     - Dates when hotel is closed (fetched from API)
   - Highlight weekends differently
   - Show "From $X" in calendar cells (if price data available)
   - Min/max stay restrictions shown as tooltips

3. **Check-out Date** (Date picker)
   - Auto-opens after check-in selection
   - Shows number of nights between dates
   - Minimum 1 night stay enforced
   - Visual connection between check-in and check-out dates

4. **Number of Guests** (Dropdown/Stepper)
   - Adults (default: 2) - stepper ➖ 2 ➕
   - Children (default: 0) - stepper ➖ 0 ➕
   - Rooms (default: 1) - stepper ➖ 1 ➕
   - Shows total guest count in button

**Validation:**
- Check-in must be before check-out
- Check-in must be today or future date
- At least 1 guest required
- Maximum 8 guests per search
- Maximum 4 rooms per search (MVP limit)

**Error Handling:**
- Inline validation on blur
- Red border + error message below field
- Example: "Check-out date must be after check-in date"

**Loading State:**
- Search button shows spinner during API call
- "Searching 1000+ hotels..." loading message

---

#### 2.1.3 Search Results Page

**Layout Structure:**

```
┌─────────────────────────────────────────────────────┐
│ [Search Bar - Sticky]  Seattle | Jan 2-5 | 2 guests│
│                                         [Modify]    │
├─────────────┬───────────────────────────────────────┤
│             │  Sort: [Recommended ▼]  [Map View]   │
│  FILTERS    │                                       │
│  ─────────  │  ┌─────────────────────────────────┐ │
│  Price      │  │ 📷 Seattle Downtown Hotel    ★★★│ │
│  ☐ $0-100   │  │ Downtown • 0.5 mi from center   │ │
│  ☐ $100-200 │  │                                 │ │
│  ☐ $200+    │  │ From $120 / night              │ │
│             │  │ • Free WiFi • Breakfast         │ │
│  Star Rating│  │ • Free cancellation            │ │
│  ☐ 5 stars  │  │                                 │ │
│  ☐ 4 stars  │  │ [View Rooms]                    │ │
│  ☐ 3 stars  │  └─────────────────────────────────┘ │
│             │                                       │
│  Amenities  │  ┌─────────────────────────────────┐ │
│  ☐ WiFi     │  │ 📷 Waterfront Hotel          ★★│ │
│  ☐ Parking  │  │ Waterfront • 1.2 mi from center │ │
│  ☐ Pool     │  │ ...                             │ │
│             │  └─────────────────────────────────┘ │
└─────────────┴───────────────────────────────────────┘
```

**Top Search Bar (Sticky):**
- Shows current search criteria
- "Modify" button opens modal to change dates/guests
- Shows result count: "134 hotels in Seattle"

**Filter Panel (Left sidebar, desktop):**

1. **Price Range** (Slider + checkboxes)
   - Min-Max slider with real-time updates
   - Shows number of hotels in each bracket
   - Example: "$0-$100 (23 hotels)"

2. **Star Rating** (Checkboxes)
   - 5 stars to 1 star
   - Shows count per rating

3. **Amenities** (Checkboxes)
   - Common: WiFi, Parking, Pool, Gym, Breakfast
   - Expandable "Show all amenities" (20+ options)

4. **Guest Rating** (Radio buttons)
   - 9+ Wonderful
   - 8+ Very Good
   - 7+ Good
   - 6+ Pleasant

5. **Cancellation Policy** (Checkboxes)
   - ☐ Free cancellation
   - ☐ Book now, pay later

6. **Distance from Center** (Slider)
   - 0-10+ miles range

**Actions:**
- "Clear all filters" link at bottom
- Filter count badge on mobile (e.g., "Filters (3)")

**Hotel Cards (Main content area):**

Each card displays:

```
┌───────────────────────────────────────────────┐
│ [Image Carousel]          [❤️ Save]           │
│                                               │
│ Hotel Name                    ★★★★☆ (4.2/5)  │
│ Location • Distance from center              │
│                                               │
│ From $120 per night                          │
│ $360 total for 3 nights                      │
│                                               │
│ • Free WiFi  • Breakfast included            │
│ • Free cancellation until Jan 1              │
│                                               │
│ ⚠️ Only 2 rooms left at this price!          │
│                                               │
│ [View Rooms]                                  │
└───────────────────────────────────────────────┘
```

**Card Components:**

1. **Image Carousel** (3-5 images)
   - Auto-play on hover (desktop)
   - Dots indicator showing position
   - Lazy loaded for performance

2. **Hotel Name & Rating**
   - Clickable → opens hotel detail page
   - Star rating (visual stars)
   - Guest rating score (e.g., 4.2/5 from 234 reviews)

3. **Location**
   - Neighborhood or landmark
   - Distance from city center or searched landmark
   - Map icon → quick map preview on hover

4. **Pricing**
   - "From $X per night" (lowest available room type)
   - Total price for stay: "$360 total for 3 nights"
   - Includes taxes/fees indicator: "includes all fees"
   - Strike-through if discounted: ~~$140~~ $120

5. **Quick Amenities** (Top 3-4)
   - Icon + text
   - Free WiFi, Breakfast, Parking most common

6. **Cancellation Policy Badge**
   - Green: "Free cancellation until [date]"
   - Yellow: "Partially refundable"
   - Red: "Non-refundable"

7. **Urgency Indicators**
   - "Only 2 rooms left at this price!" (red/orange badge)
   - "Last booked 3 hours ago" (social proof)
   - "Great Deal" or "Best Value" badges

8. **Actions**
   - "View Rooms" primary button
   - Heart icon to save/favorite
   - Share icon (mobile)

**Sort Options:**
- Recommended (default)
- Price: Low to High
- Price: High to Low
- Star Rating
- Guest Rating
- Distance from Center

**Loading States:**
- Skeleton cards (6-8 visible)
- Shimmer animation
- "Loading more hotels..." at scroll bottom

**Empty State:**
- "No hotels found for your search"
- Suggestions:
  - Try different dates
  - Expand search area
  - Remove some filters
- "Search nearby" button

**Error State:**
- "Something went wrong"
- Retry button
- Support contact link

---

#### 2.1.4 Map View (Optional for MVP)

**Toggle:** "Map View" button in results header

**Split Layout:**
- Left: List of hotels (scrollable)
- Right: Interactive map with pins
- Hovering card highlights pin
- Clicking pin scrolls to card

---

### 2.2 Hotel Details & Room Selection

#### 2.2.1 Hotel Detail Page

**URL Pattern:** `/hotels/[hotelId]?checkIn=2025-01-02&checkOut=2025-01-05&guests=2`

**Header Section:**
```
┌───────────────────────────────────────────────────┐
│ [Photo Gallery - Hero Images]                     │
│ [Main image large] [4 smaller images in grid]    │
│                                                   │
└───────────────────────────────────────────────────┘

Seattle Downtown Hotel                    ★★★★☆ (4.2/5)
1234 Pike Street, Seattle, WA             [❤️ Save]  [Share]

✓ Free WiFi  ✓ Parking  ✓ Pool  ✓ Breakfast

[Show on Map]
```

**Photo Gallery:**
- Hero image (large)
- 4-5 thumbnail images
- "View all photos" button → opens lightbox modal
- Photo categories: Rooms, Property, Dining, Pool, etc.

**Quick Info Bar:**
- Star rating
- Guest rating with review count
- Top amenities (icons)
- Actions: Save, Share, Report

---

**Navigation Tabs:**

```
┌─────────────────────────────────────────────────┐
│ [Overview] [Rooms] [Amenities] [Reviews] [Map] │
└─────────────────────────────────────────────────┘
```

---

#### Tab 1: Overview

**About this hotel** (2-3 paragraphs)
- Hotel description
- Neighborhood info
- Popular nearby attractions

**Popular Amenities** (Icon grid)
- WiFi, Pool, Parking, Gym, Restaurant, etc.
- "View all amenities" expandable

**Property Policies**
- Check-in time: 3:00 PM
- Check-out time: 11:00 AM
- Cancellation policy summary
- Pet policy
- Age requirements

---

#### Tab 2: Rooms (Most Important for Booking)

**Date Selection Bar (Sticky):**
```
┌───────────────────────────────────────────────┐
│ Check-in: [Jan 2, 2025 ▼] | Check-out: [Jan 5, 2025 ▼] │
│ Guests: [2 adults ▼]  Rooms: [1 room ▼]      │
│                                [Update]       │
└───────────────────────────────────────────────┘
```

**Room Type List:**

Each room type card:

```
┌──────────────────────────────────────────────────┐
│ [Room Photos]                                    │
│                                                  │
│ Deluxe King Room                    ⚠️ 3 left   │
│ • 1 King Bed                                     │
│ • 350 sq ft                                      │
│ • Max occupancy: 2 guests                       │
│ • City view                                      │
│                                                  │
│ Amenities:                                       │
│ ✓ Free WiFi  ✓ Mini fridge  ✓ Coffee maker     │
│ ✓ Smart TV   ✓ Work desk                        │
│                                                  │
│ ┌──────────────────────────────────────────┐   │
│ │ Price Breakdown                          │   │
│ │ $120 × 3 nights        $360              │   │
│ │ Taxes & fees            $40              │   │
│ │ ────────────────────────────             │   │
│ │ Total                  $400              │   │
│ │                                          │   │
│ │ ✓ Free cancellation until Jan 1, 2025   │   │
│ │                                          │   │
│ │ How many rooms? [➖ 1 ➕]                │   │
│ │                                          │   │
│ │ [      Reserve This Room      ]          │   │
│ └──────────────────────────────────────────┘   │
└──────────────────────────────────────────────────┘
```

**Room Card Components:**

1. **Room Photos** (Carousel)
   - 3-5 images specific to room type
   - Shows bed type, view, bathroom

2. **Room Name & Scarcity**
   - Room type name
   - Urgency badge: "Only 3 left" (if inventory < 5)

3. **Room Details**
   - Bed configuration
   - Room size
   - Max occupancy
   - View type

4. **Amenities List**
   - Room-specific amenities
   - Checkmarks for available
   - Icons for visual appeal

5. **Price Breakdown**
   - Per night rate
   - Number of nights
   - Taxes and fees (expandable tooltip)
   - **Total price** (prominent)

6. **Cancellation Policy**
   - Visual indicator (green checkmark)
   - "Free cancellation until [date]"
   - Link to "View full policy"

7. **Room Quantity Selector**
   - Stepper: ➖ [quantity] ➕
   - Disabled if inventory unavailable
   - Shows "Max X rooms available" if limited

8. **Reserve Button**
   - Primary action button
   - Disabled if no availability
   - Shows "Sold Out" if unavailable
   - Loading state on click

**No Availability State:**
```
┌──────────────────────────────────────────┐
│ 😞 No rooms available for these dates    │
│                                          │
│ Try:                                     │
│ • Different dates                        │
│ • Fewer rooms                            │
│ • Other room types below                 │
└──────────────────────────────────────────┘
```

---

#### Tab 3: Amenities

**Categorized List:**
- General: WiFi, Air conditioning, Heating
- Dining: Restaurant, Breakfast, Room service
- Activities: Pool, Gym, Spa
- Business: Meeting rooms, Business center
- Accessibility: Wheelchair accessible, Grab bars

---

#### Tab 4: Reviews

**Summary:**
- Overall rating: 4.2/5 (from 234 reviews)
- Rating breakdown:
  - Cleanliness: 4.5/5
  - Service: 4.3/5
  - Location: 4.8/5
  - Value: 3.9/5

**Review Cards:**
- Guest name & date
- Rating (stars)
- Review text
- Room type stayed
- "Helpful" button
- Sort: Most Recent, Highest Rated, Lowest Rated

---

#### Tab 5: Map

- Interactive map showing hotel location
- Nearby attractions, restaurants, transport
- Distance indicators

---

### 2.3 Booking Flow (Two-Step Process)

#### 2.3.1 Step 1: Create Reservation Draft

**Trigger:** User clicks "Reserve This Room" on room card

**Action:**
1. Frontend calls `POST /v1/reservations` with:
   - hotelId, roomTypeId, checkIn, checkOut, numberOfRooms
   - Guest info (if logged in, pre-filled)

2. Backend response:
   - reservationId
   - status: PENDING
   - priceBreakdown
   - expiresAt (e.g., 15 minutes from now)

**UX Transition:**
- Show loading spinner on button: "Checking availability..."
- If successful: Navigate to Review page
- If failure:
  - **Sold out:** Show error modal: "Sorry, this room was just booked. Here are similar options..."
  - **Price changed:** Show warning: "Price has changed to $X. Continue?"

---

#### 2.3.2 Review & Payment Page

**URL:** `/reservations/[reservationId]/review`

**Layout:**
```
┌─────────────────────────────────────────────────┐
│           Review Your Booking                   │
│                                                 │
│ ┌─────────────────────┐  ┌──────────────────┐ │
│ │ Hotel Details       │  │ Price Summary    │ │
│ │                     │  │                  │ │
│ │ Seattle Downtown    │  │ 1 Deluxe King    │ │
│ │ Hotel ★★★★          │  │ 3 nights         │ │
│ │                     │  │                  │ │
│ │ Check-in            │  │ $120 × 3  $360   │ │
│ │ Jan 2, 2025 (3PM)   │  │ Taxes/fees  $40  │ │
│ │                     │  │ ──────────────   │ │
│ │ Check-out           │  │ Total      $400  │ │
│ │ Jan 5, 2025 (11AM)  │  │                  │ │
│ │                     │  │ ✓ Free cancel    │ │
│ │ 1 Room, 2 Guests    │  │   until Jan 1    │ │
│ └─────────────────────┘  └──────────────────┘ │
│                                                 │
│ ┌─────────────────────────────────────────────┐│
│ │ Guest Details                               ││
│ │ First Name: [Alex        ]                  ││
│ │ Last Name:  [Kim         ]                  ││
│ │ Email:      [alex@example.com]              ││
│ │ Phone:      [+1 555-1234  ]                 ││
│ │ Special Requests: [_________________]       ││
│ └─────────────────────────────────────────────┘│
│                                                 │
│ ┌─────────────────────────────────────────────┐│
│ │ Payment Method                              ││
│ │ ○ Credit/Debit Card                         ││
│ │   Card Number: [____-____-____-____]        ││
│ │   Expiry: [MM/YY]  CVV: [___]               ││
│ │                                             ││
│ │ ○ Saved Card ending in 1234                 ││
│ └─────────────────────────────────────────────┘│
│                                                 │
│ ☑️ I agree to cancellation policy and terms    │
│                                                 │
│ [ Complete My Booking ]                        │
│                                                 │
│ ⏱️ This price is held for 12 minutes           │
└─────────────────────────────────────────────────┘
```

**Components:**

1. **Hotel Summary Card** (Left column)
   - Hotel name, rating
   - Check-in/out dates and times
   - Room type and quantity
   - Guest count
   - Small image

2. **Price Summary** (Right column, sticky on desktop)
   - Itemized breakdown
   - Per-night rate × nights
   - Taxes and fees (expandable)
   - **Total** (prominent)
   - Cancellation policy badge

3. **Guest Details Form**
   - First Name, Last Name (required)
   - Email (required, used for confirmation)
   - Phone (required)
   - Special requests (optional textarea)
   - If logged in: Pre-filled, allow edit

4. **Payment Section**
   - Card option (default)
     - Card number input (with card type detection)
     - Expiry date
     - CVV
     - Billing zip code
   - Saved cards (if logged in)
   - Security badges: "Secure payment" icons

5. **Terms Checkbox**
   - Required checkbox
   - Link to cancellation policy
   - Link to terms and conditions

6. **Complete Booking Button**
   - Primary CTA
   - Disabled until form valid
   - Loading state: "Processing payment..."

7. **Timer/Urgency**
   - Countdown: "This price is held for 12 minutes"
   - Warning at 2 minutes: "⚠️ Hurry! Price expires in 2 minutes"

**Validation:**
- Real-time validation on blur
- Show errors inline below fields
- Prevent submit if any errors
- Credit card validation (Luhn algorithm)

---

#### 2.3.3 Step 2: Confirm Payment

**Trigger:** User clicks "Complete My Booking"

**Frontend Action:**
1. Generate Idempotency-Key (UUID)
2. Call `POST /v1/reservations/{id}/confirm` with:
   - paymentMethod details
   - Idempotency-Key header

**Backend Process:**
1. Check idempotency: If key exists → return existing result
2. Charge payment via Payment Service
3. If successful:
   - Update reservation status: PENDING → PAID
   - Update inventory: increment total_reserved
   - Return confirmation details
4. If failed:
   - Return error details
   - Keep reservation PENDING (allow retry)

**UX States:**

**Loading:**
```
┌──────────────────────────────────┐
│  🔄 Processing your payment...   │
│  Please don't close this window  │
└──────────────────────────────────┘
```

**Success → Navigate to Confirmation Page**

**Payment Failed:**
```
┌────────────────────────────────────────┐
│ ❌ Payment Failed                      │
│                                        │
│ Your card was declined.                │
│ Please try a different payment method. │
│                                        │
│ Your reservation is still held for    │
│ 10 more minutes.                       │
│                                        │
│ [ Try Again ]  [ Cancel Booking ]     │
└────────────────────────────────────────┘
```

---

#### 2.3.4 Confirmation Page

**URL:** `/reservations/[reservationId]/confirmation`

**Layout:**
```
┌──────────────────────────────────────────┐
│     ✅ Booking Confirmed!                │
│                                          │
│     Confirmation #: BK-123456            │
│                                          │
│ We've sent a confirmation email to:      │
│ alex@example.com                         │
│                                          │
├──────────────────────────────────────────┤
│ Seattle Downtown Hotel          ★★★★    │
│ 1234 Pike Street, Seattle, WA            │
│                                          │
│ Check-in: Wednesday, Jan 2, 2025 (3PM)  │
│ Check-out: Saturday, Jan 5, 2025 (11AM) │
│                                          │
│ 1 Deluxe King Room                       │
│ 2 Guests                                 │
│                                          │
│ Total Paid: $400                         │
│ Payment Method: Visa ending in 1234      │
│                                          │
│ Cancellation: Free cancellation until    │
│               January 1, 2025            │
├──────────────────────────────────────────┤
│                                          │
│ [📅 Add to Calendar]  [🖨️ Print]        │
│                                          │
│ [ View Booking Details ]                 │
│ [ Book Another Hotel ]                   │
│                                          │
└──────────────────────────────────────────┘
```

**Features:**
- Prominent confirmation number
- Email confirmation sent indicator
- Complete booking summary
- Quick actions:
  - Add to calendar (generates .ics file)
  - Print confirmation
  - View full details
  - Book another hotel (return to home)

**Email Confirmation:**
- Subject: "Booking Confirmed: Seattle Downtown Hotel"
- Contains:
  - Confirmation number
  - Hotel details
  - Check-in/out info
  - Cancellation policy
  - Link to manage booking
  - Support contact info

---

#### 2.3.5 Idempotency Handling (Double-Click Prevention)

**Problem:** User clicks "Complete Booking" twice or network retry causes duplicate requests.

**Solution:**

1. **Frontend:**
   - Generate UUID on page load: `idempotencyKey = generateUUID()`
   - Include in request header: `Idempotency-Key: {idempotencyKey}`
   - Disable button immediately on first click
   - Show loading state

2. **Backend:**
   - Store idempotency key + result in cache/DB
   - On subsequent request with same key:
     - Return cached result (same confirmation)
     - Don't charge payment again
     - Don't update inventory again

3. **UX:**
   - If user clicks twice → both requests succeed with same result
   - User sees confirmation page only once
   - No duplicate charges
   - No duplicate reservations

---

### 2.4 Manage Booking Experience

#### 2.4.1 My Trips / Bookings List

**URL:** `/my-trips` (requires login or email verification)

**Layout:**
```
┌──────────────────────────────────────────┐
│        My Trips                          │
│ [Upcoming] [Past] [Cancelled]            │
│                                          │
│ ┌────────────────────────────────────┐  │
│ │ Seattle Downtown Hotel    ★★★★     │  │
│ │ Jan 2-5, 2025                      │  │
│ │ Confirmation: BK-123456            │  │
│ │                                    │  │
│ │ [View Details] [Cancel Booking]    │  │
│ └────────────────────────────────────┘  │
│                                          │
│ ┌────────────────────────────────────┐  │
│ │ Portland City Hotel       ★★★      │  │
│ │ Feb 10-12, 2025                    │  │
│ │ Confirmation: BK-789012            │  │
│ │                                    │  │
│ │ [View Details] [Modify]            │  │
│ └────────────────────────────────────┘  │
└──────────────────────────────────────────┘
```

**Tabs:**
- **Upcoming:** Active bookings (check-in date >= today)
- **Past:** Completed stays (check-out date < today)
- **Cancelled:** Cancelled/refunded bookings

**Booking Cards:**
- Hotel name, rating, image
- Dates
- Confirmation number
- Quick actions based on status

---

#### 2.4.2 Booking Detail Page

**URL:** `/reservations/[reservationId]`

**Layout:**
```
┌──────────────────────────────────────────┐
│     Booking Details                      │
│     Confirmation #: BK-123456            │
│     Status: ✅ Confirmed                 │
│                                          │
├──────────────────────────────────────────┤
│ Hotel Information                        │
│ ─────────────────                        │
│ Seattle Downtown Hotel          ★★★★    │
│ 1234 Pike Street, Seattle, WA            │
│ Phone: (206) 555-1234                    │
│ [Show on Map]                            │
│                                          │
├──────────────────────────────────────────┤
│ Stay Details                             │
│ ─────────────                            │
│ Check-in:  Wednesday, Jan 2, 2025 (3PM) │
│ Check-out: Saturday, Jan 5, 2025 (11AM) │
│ Duration: 3 nights                       │
│                                          │
│ Room: 1 × Deluxe King Room               │
│ Guests: 2 adults                         │
│                                          │
├──────────────────────────────────────────┤
│ Guest Information                        │
│ ─────────────────                        │
│ Name: Alex Kim                           │
│ Email: alex@example.com                  │
│ Phone: +1 555-1234                       │
│                                          │
├──────────────────────────────────────────┤
│ Payment Information                      │
│ ───────────────────                      │
│ Total Paid: $400                         │
│ Breakdown:                               │
│   Room charges: $360                     │
│   Taxes & fees: $40                      │
│ Payment Method: Visa ****1234            │
│ Payment Date: Dec 20, 2024               │
│                                          │
├──────────────────────────────────────────┤
│ Cancellation Policy                      │
│ ──────────────────                       │
│ ✅ Free cancellation until Jan 1, 2025  │
│ After that: 50% refund                   │
│                                          │
│ [ Cancel This Booking ]                  │
│                                          │
├──────────────────────────────────────────┤
│ Actions                                  │
│ ───────                                  │
│ [📧 Resend Confirmation Email]           │
│ [📅 Add to Calendar]                     │
│ [🖨️ Print Confirmation]                  │
│ [💬 Contact Support]                     │
│                                          │
└──────────────────────────────────────────┘
```

---

#### 2.4.3 Cancel Booking Flow

**Trigger:** User clicks "Cancel This Booking"

**Step 1: Confirmation Modal**
```
┌──────────────────────────────────────────┐
│     Cancel Booking?                      │
│                                          │
│ Are you sure you want to cancel this     │
│ booking?                                 │
│                                          │
│ Refund Information:                      │
│ • Cancelling before Jan 1: Full refund  │
│ • Cancelling after Jan 1: 50% refund    │
│                                          │
│ Estimated refund: $400                   │
│ Refund processing: 5-7 business days     │
│                                          │
│ [ Go Back ]  [ Yes, Cancel Booking ]    │
└──────────────────────────────────────────┘
```

**Step 2: API Call**
- Frontend calls `POST /v1/reservations/{id}/cancel`
- Backend:
  - Updates reservation status to CANCELLED or REFUNDED
  - Processes refund via Payment Service
  - Updates inventory (decrease total_reserved)
  - Sends cancellation email

**Step 3: Confirmation**
```
┌──────────────────────────────────────────┐
│     ✅ Booking Cancelled                 │
│                                          │
│ Your booking has been cancelled.         │
│                                          │
│ Refund amount: $400                      │
│ Refund method: Visa ending in 1234       │
│ Expected in: 5-7 business days           │
│                                          │
│ We've sent a confirmation email to:      │
│ alex@example.com                         │
│                                          │
│ [ View My Trips ]  [ Book Another Hotel ]│
└──────────────────────────────────────────┘
```

**Edge Cases:**

**Too late to cancel:**
```
┌──────────────────────────────────────────┐
│ ⚠️ Cannot Cancel                         │
│                                          │
│ The free cancellation period has passed. │
│                                          │
│ Cancelling now will result in:          │
│ • $200 refund (50% of $400)              │
│                                          │
│ [ Go Back ]  [ Cancel Anyway ]          │
└──────────────────────────────────────────┘
```

**Already checked in:**
```
┌──────────────────────────────────────────┐
│ ❌ Cannot Cancel Online                  │
│                                          │
│ You've already checked in.               │
│ Please contact the hotel directly.       │
│                                          │
│ Hotel Phone: (206) 555-1234              │
│                                          │
│ [ Contact Support ]  [ Close ]          │
└──────────────────────────────────────────┘
```

---

### 2.5 Error & Edge Cases Handling

#### 2.5.1 Price Changed

**Scenario:** Price changed between search and booking.

**UX:**
```
┌──────────────────────────────────────────┐
│ ⚠️ Price Has Changed                     │
│                                          │
│ The price for this room has changed:     │
│                                          │
│ Previous: $120/night ($360 total)        │
│ New:      $130/night ($390 total)        │
│                                          │
│ Would you like to continue at the new    │
│ price?                                   │
│                                          │
│ [ Cancel ]  [ Accept New Price ]        │
└──────────────────────────────────────────┘
```

---

#### 2.5.2 Sold Out During Booking

**Scenario:** Room sold out between selection and payment.

**UX:**
```
┌──────────────────────────────────────────┐
│ 😞 Room No Longer Available              │
│                                          │
│ Unfortunately, the last room was just    │
│ booked by another guest.                 │
│                                          │
│ Here are similar options:                │
│                                          │
│ ┌────────────────────────────────────┐  │
│ │ Superior King Room                 │  │
│ │ Similar room • From $135/night     │  │
│ │ [View Details]                     │  │
│ └────────────────────────────────────┘  │
│                                          │
│ [ View All Available Rooms ]            │
│ [ Try Different Dates ]                 │
└──────────────────────────────────────────┘
```

---

#### 2.5.3 Payment Failed

**Scenario:** Payment declined or error.

**UX:**
```
┌──────────────────────────────────────────┐
│ ❌ Payment Failed                        │
│                                          │
│ Your payment could not be processed.     │
│                                          │
│ Reason: Card declined                    │
│                                          │
│ Your reservation is still held for       │
│ 10 more minutes.                         │
│                                          │
│ Please try:                              │
│ • A different payment method             │
│ • Checking your card details             │
│ • Contacting your bank                   │
│                                          │
│ [ Try Again ]  [ Cancel Booking ]       │
└──────────────────────────────────────────┘
```

---

#### 2.5.4 Session Expired

**Scenario:** User took too long to complete booking (>15 minutes).

**UX:**
```
┌──────────────────────────────────────────┐
│ ⏱️ Reservation Expired                   │
│                                          │
│ Your reservation has expired.            │
│                                          │
│ To ensure availability and pricing,      │
│ we hold rooms for 15 minutes.            │
│                                          │
│ [ Search Again ]                         │
└──────────────────────────────────────────┘
```

---

## 3. Hotel Staff Experience (Extranet)

### 3.1 Authentication & Dashboard

**Login:** `/extranet/login`
- Email + Password
- "Remember me" option
- MFA (optional for MVP)

**Dashboard:** `/extranet/dashboard`
```
┌──────────────────────────────────────────┐
│ Welcome back, Seattle Downtown Hotel     │
│                                          │
│ Today's Summary (Jan 2, 2025)            │
│ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐    │
│ │ 45   │ │ 32   │ │ 13   │ │ 89%  │    │
│ │Booked│ │Check │ │Check │ │ Occ  │    │
│ │ Today│ │ In   │ │ Out  │ │ Rate │    │
│ └──────┘ └──────┘ └──────┘ └──────┘    │
│                                          │
│ Quick Actions:                           │
│ • View Today's Arrivals                  │
│ • Manage Inventory                       │
│ • Update Prices                          │
│ • View All Bookings                      │
└──────────────────────────────────────────┘
```

---

### 3.2 Inventory Management

**URL:** `/extranet/inventory`

**Calendar View:**
```
┌──────────────────────────────────────────────────┐
│ Inventory Calendar - January 2025                │
│ Room Type: [Deluxe King Room ▼]                  │
│                                                  │
│ Sun  Mon  Tue  Wed  Thu  Fri  Sat               │
│ ─────────────────────────────────────────────── │
│      1    2    3    4    5    6    7            │
│     10   10   10   10   10   10   10   Total    │
│      8    9    7    8    6    5    4   Reserved │
│      2    1    3    2    4    5    6   Available│
│    $120 $120 $120 $150 $150 $150 $140  Price    │
│                                                  │
│      8    9   10   11   12   13   14            │
│     10   10   10   10   10   10   10            │
│      7    8    9    6    5    7    8            │
│      3    2    1    4    5    3    2            │
│    $140 $140 $120 $120 $120 $130 $130           │
│                                                  │
└──────────────────────────────────────────────────┘

[ Quick Edit ] [ Bulk Update ] [ Export ]
```

**Cell Click → Quick Edit Modal:**
```
┌──────────────────────────────────────┐
│ Edit Inventory - Jan 5, 2025         │
│                                      │
│ Room Type: Deluxe King Room          │
│                                      │
│ Total Inventory: [10 ➖➕]           │
│ Reserved:        6 (read-only)       │
│ Available:       4 (calculated)      │
│                                      │
│ Price: [$150.00]                     │
│                                      │
│ Status: [Open for Sale ▼]           │
│   Options: Open, Closed              │
│                                      │
│ [ Cancel ] [ Save ]                  │
└──────────────────────────────────────┘
```

**Bulk Update:**
```
┌──────────────────────────────────────┐
│ Bulk Update Inventory                │
│                                      │
│ Room Type: [Deluxe King ▼]          │
│                                      │
│ Date Range:                          │
│ From: [Jan 10, 2025]                 │
│ To:   [Jan 20, 2025]                 │
│                                      │
│ ☑️ Update Inventory                  │
│    Total Rooms: [10 ➖➕]            │
│                                      │
│ ☑️ Update Price                      │
│    Price: [$140.00]                  │
│                                      │
│ ☐ Close for Sale                     │
│                                      │
│ [ Cancel ] [ Apply to 11 days ]     │
└──────────────────────────────────────┘
```

---

### 3.3 Bookings Management

**URL:** `/extranet/bookings`

**Search & Filter:**
```
┌──────────────────────────────────────────────────┐
│ Bookings Management                              │
│                                                  │
│ Search: [Confirmation #, Guest Name, Email    🔍]│
│                                                  │
│ Filters:                                         │
│ Status: [All ▼]  Dates: [Today ▼]  Room: [All ▼]│
│                                                  │
└──────────────────────────────────────────────────┘
```

**Bookings Table:**
```
┌────────────────────────────────────────────────────────┐
│ Conf #     Guest      Check-in  Room     Status  Total │
├────────────────────────────────────────────────────────┤
│ BK-123456  Alex Kim   Jan 2    Deluxe K  Paid   $400  │
│ BK-789012  Jane Doe   Jan 2    Superior  Paid   $500  │
│ BK-345678  John Smith Jan 3    Deluxe K  Pending $380 │
└────────────────────────────────────────────────────────┘
```

**Click Row → Booking Detail View:**
- Full guest information
- Payment details
- Special requests
- Actions:
  - Change room type
  - Extend stay
  - Cancel booking
  - Mark as no-show
  - Send email to guest

---

### 3.4 Reporting (Optional for MVP)

**URL:** `/extranet/reports`

**Available Reports:**
- Occupancy report (daily, monthly)
- Revenue report
- Booking source analysis
- Cancellation rate
- Average daily rate (ADR)
- RevPAR (Revenue per available room)

---

## 4. Mobile Considerations

### 4.1 Responsive Design

**Breakpoints:**
- Mobile: < 768px
- Tablet: 768px - 1024px
- Desktop: > 1024px

**Mobile-Specific UX:**

1. **Search Form:**
   - Full-width inputs
   - Stack vertically
   - Large touch targets (min 44×44pt)

2. **Search Results:**
   - Filter button opens bottom sheet
   - Single column hotel cards
   - Sticky "Show X hotels" button at bottom
   - Infinite scroll instead of pagination

3. **Hotel Detail:**
   - Tabs become horizontal scroll
   - Sticky "Reserve" button at bottom
   - Full-width CTAs

4. **Booking Flow:**
   - One field per row
   - Native date pickers
   - Large form inputs
   - Progress indicator at top

5. **Navigation:**
   - Bottom tab bar for main sections
   - Hamburger menu for secondary options

---

### 4.2 Performance Optimizations

1. **Image Optimization:**
   - Lazy loading
   - Responsive images (srcset)
   - WebP format with JPEG fallback
   - Low-quality image placeholders (LQIP)

2. **Code Splitting:**
   - Route-based splitting
   - Lazy load modals/carousels
   - Defer non-critical JS

3. **Data Loading:**
   - Skeleton screens
   - Optimistic UI updates
   - Cache API responses (SWR pattern)
   - Prefetch next page on scroll

4. **Offline Support:**
   - Service worker for shell caching
   - Graceful degradation when offline
   - Retry failed requests automatically

---

### 4.3 Touch Gestures

- Swipe to navigate image carousels
- Pull to refresh search results
- Swipe to dismiss modals
- Pinch to zoom on maps

---

## 5. Accessibility & Performance

### 5.1 Accessibility (WCAG 2.1 Level AA)

**1. Keyboard Navigation:**
- All interactive elements focusable
- Logical tab order
- Skip links for main content
- Escape key closes modals

**2. Screen Reader Support:**
- Semantic HTML (headings, landmarks)
- ARIA labels for icons
- Alt text for all images
- Live regions for dynamic content

**3. Color & Contrast:**
- 4.5:1 contrast ratio for text
- Not relying on color alone
- Focus indicators visible

**4. Forms:**
- Labels associated with inputs
- Error messages announced
- Required fields indicated
- Validation messages clear

**5. Responsive:**
- 200% zoom without horizontal scroll
- Text resizable
- No fixed pixel heights

---

### 5.2 Performance Targets

**Core Web Vitals:**
- LCP (Largest Contentful Paint): < 2.5s
- FID (First Input Delay): < 100ms
- CLS (Cumulative Layout Shift): < 0.1

**Other Metrics:**
- Time to Interactive: < 3.5s
- First Contentful Paint: < 1.5s
- Page size: < 1MB compressed

**Strategies:**
- CDN for static assets
- Image optimization
- Code splitting
- Server-side rendering (Next.js)
- HTTP/2 or HTTP/3
- Gzip/Brotli compression

---

### 5.3 Browser Support

**Required:**
- Chrome (last 2 versions)
- Safari (last 2 versions)
- Firefox (last 2 versions)
- Edge (last 2 versions)
- Mobile Safari (iOS 14+)
- Chrome Android (last 2 versions)

**Graceful Degradation:**
- Older browsers get functional experience
- Progressive enhancement for modern features

---

## 6. Analytics & Monitoring

### 6.1 User Analytics

**Track Events:**
- Search performed (destination, dates)
- Hotel viewed
- Room selected
- Booking initiated
- Booking completed
- Booking cancelled
- Errors encountered

**Funnels:**
- Search → Hotel Detail → Booking → Confirmation
- Drop-off points analysis

**Tools:**
- Google Analytics 4
- Mixpanel or Amplitude
- Hotjar for heatmaps

---

### 6.2 Error Tracking

**Frontend:**
- Sentry for error tracking
- Track JS errors
- Track failed API calls
- User session replay on errors

**Backend:**
- API error rates
- Slow query logs
- Failed payment attempts
- Inventory conflicts

---

## 7. Internationalization (Future)

**MVP:** English only, USD only

**Future:**
- Multi-language support (i18n)
- Multi-currency
- Local payment methods
- Regional date/time formats
- Right-to-left (RTL) support

---

## Summary

This UX design prioritizes:

✅ **Simplicity:** Clear flows, minimal steps  
✅ **Trust:** Transparent pricing, clear policies  
✅ **Speed:** Fast load times, optimistic UI  
✅ **Safety:** Idempotency, no double booking  
✅ **Mobile-First:** Responsive, touch-friendly  
✅ **Accessibility:** WCAG compliant, keyboard navigation  

The two-step booking process (reserve → confirm) ensures no double-booking while providing a smooth user experience. Price holds and inventory locks prevent "sold out at checkout" frustration.

