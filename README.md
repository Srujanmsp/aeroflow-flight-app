# AeroFlow — Flight Management Web App

A fully responsive flight booking and management PWA built with React 19, TypeScript, Tailwind CSS v4, and Zustand. Users can search flights, select seats on an interactive map, book with passenger details, and manage their reservations (reschedule or cancel).

---
## Live Demo
- **Vercel Deployment**: [https://aeroflow-flight-app.vercel.app](https://aeroflow-flight-app.vercel.app)

- **Local Dev**: [http://localhost:3000](http://localhost:3000)

---
## Tech Stack

- **Frontend**: React 19 + TypeScript
- **Routing / Steps**: Zustand-driven multi-step flow (no external router needed)
- **Styling**: Tailwind CSS v4 (via Vite plugin)
- **State Management**: Zustand with `persist` middleware
- **Database / Auth**: Supabase (PostgreSQL + RLS + Realtime)
- **Bundler**: Vite 6
- **PWA**: Custom service worker with offline support

---

## Project Structure

```
aeroflow-flight-app/
├── public/
│   ├── manifest.json              # PWA manifest
│   ├── offline.html               # Offline fallback page
│   ├── sw.js                      # Service worker
│   └── icons/
│       ├── icon-192x192.png       # PWA icon
│       └── icon-512x512.png       # PWA icon
├── supabase/
│   └── migrations/
│       ├── 20260520000001_initial_schema.sql     # Tables, indexes, constraints
│       ├── 20260520000002_triggers_and_rpcs.sql  # RLS, triggers, seat-lock RPC
│       └── 20260520000003_seed_data.sql          # 14 flights across 7 routes + seats
├── src/
│   ├── main.tsx
│   ├── App.tsx                    # Shell, nav, step routing
│   ├── store.ts                   # Zustand stores (useFlightStore, useUserStore)
│   ├── types.ts                   # Shared TypeScript interfaces
│   ├── supabaseClient.ts          # Supabase client initialization
│   ├── supabaseSim.ts             # Local in-memory DB simulation
│   └── components/
│       ├── SearchPage.tsx         # Flight search form
│       ├── ResultsPage.tsx        # Flight results listing
│       ├── SeatMap.tsx            # Interactive seat grid with Realtime
│       ├── PassengerFormPage.tsx  # Passenger details form
│       ├── ConfirmationPage.tsx   # Booking confirmation + PNR
│       ├── MyBookingsPage.tsx     # Manage bookings (reschedule/cancel)
│       ├── SupabaseTerminal.tsx   # Live DB query log viewer
│       └── InstallPrompt.tsx      # PWA install banner
├── index.html
├── vite.config.ts
├── tsconfig.json
├── package.json
└── .env.example
```

---

## Database Schema

Five tables in Supabase (PostgreSQL):

| Table | Purpose |
|---|---|
| `flights` | Flight schedules, routes, pricing, status |
| `seats` | Seat inventory per flight (economy/business/first) |
| `bookings` | Passenger reservations with PNR codes |
| `passengers` | Personal details linked to each booking |
| `reschedules` | Audit trail for flight changes |

Key constraints:
- Row Level Security (RLS) on all tables — users only see their own bookings
- `reserve_seat_and_book_atomic()` RPC prevents double-booking with row-level locks
- `BEFORE UPDATE` trigger rejects cancellations/reschedules within 2 hours of departure

---

## Zustand Store Design

### `useFlightStore`
Manages the multi-step booking flow:
- `activeQuery` — current search parameters
- `selectedFlight` — chosen flight
- `selectedSeat` / `selectedSeats` — chosen seat(s)
- `currentStep` — which page to show (`search → results → seats → form → confirmation`)
- `passengerForm` — in-progress form data
- `optimisticSelectedSeatId` — seat selected in UI before DB write confirms

Persisted fields: `activeQuery`, `currentStep` (so users can resume after tab close).  
Excluded from localStorage via `partialize`: `passengerForm.passportNo` (PII).

### `useUserStore`
Manages auth session and cached bookings:
- `user` — current logged-in user
- `sessionToken` — persisted auth token
- `cachedBookings` / `cachedPassengers` — local cache for offline reading

Persisted: `sessionToken` only.

---

## Local Setup

### Prerequisites
- Node.js v18 or above

### Install & Run

```bash
# Install dependencies
npm install

# Start dev server
npm run dev
```

### Other Commands

```bash
npm run build    # Production build → /dist
npm run preview  # Preview production build locally
npm run lint     # TypeScript type check
```

### Environment Variables

Create a `.env.local` file in the root folder with these values:

```
VITE_SUPABASE_URL=https://fwejcqeeqshxedrpdzyp.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ3ZWpjcWVlcXNoeGVkcnBkenlwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkzNDU1MDYsImV4cCI6MjA5NDkyMTUwNn0.ILJPIyos3s09pQ0gH-NQwjVa3Oa095kk3hPxcdR5F-o
```
- The anon key is safe to share publicly — Supabase is designed for this.
- RLS policies ensure users can only access their own data.

---

## Test Account
- **Email**: `user@aeroflow.com`
- **Password**: `test1234`

---

## Supabase Migration Guide

Run the migrations in order using the Supabase SQL editor:

```bash
# 1. supabase/migrations/20260520000001_initial_schema.sql
# 2. supabase/migrations/20260520000002_triggers_and_rpcs.sql
# 3. supabase/migrations/20260520000003_seed_data.sql
```
This creates all tables, RLS policies, triggers, RPCs, and seeds 14 flights across 7 routes with a full seat map per flight.

---

## PWA Configuration

The app includes a `manifest.json` with:
- App name, short name, theme colour
- 192×192 and 512×512 icons
- `display: standalone` for installable experience

Cache strategies (via service worker):
- `StaleWhileRevalidate` — flight search results
- `CacheFirst` — static assets
- Offline fallback page when network is unavailable
- My Bookings readable offline from last-cached data

---

## Key Design Decisions & Trade-offs

**Supabase integration**: The `supabaseClient.ts` handles real Supabase auth using environment credentials. The `supabaseSim.ts` mirrors the full PostgreSQL behavior in-memory — including row-level locking, the 2-hour trigger, and Realtime seat updates — ensuring all features work consistently.

**Booking persistence trade-off**: The booking flow currently uses an in-memory simulation (`supabaseSim.ts`) that mirrors real Supabase behavior exactly — same RLS policies, same atomic RPCs, same 2-hour cancellation constraint. Bookings reset on page refresh. Full Supabase integration for bookings (replacing `dbSim` calls with `supabase-js` client) is the clear next step. The SQL schema, RLS policies, triggers, and RPCs are all production-ready and correctly written.

**Zustand over Context**: The multi-step booking flow has several interdependent pieces of state that need to survive navigation and tab closes. Zustand's `persist` middleware handles this cleanly without prop drilling or complex reducer setups.

**Optimistic seat selection**: Seats are marked selected in the store immediately on click, before the DB write resolves. If the write fails (e.g., race condition), the store rolls back. This keeps the UI snappy.

**PNR-level group booking**: Multiple passengers on the same booking share a PNR code. Reschedules update all seats under that PNR atomically — if any seat is unavailable on the new flight, the whole reschedule is rejected.

**Sensitive data protection**: Passport numbers are explicitly excluded from localStorage via Zustand's `partialize` config, ensuring PII never persists in the browser.

---

## Lighthouse Audit

![Lighthouse Score](./lighthouse.png)

| Category | Score |
|---|---|
| Performance | 90 |
| Accessibility | 72 |
| Best Practices | 100 |
| SEO | 100 |

---