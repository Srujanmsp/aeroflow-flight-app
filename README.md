# AeroFlow — Flight Management Web App

A fully responsive flight booking and management PWA built with React 19, TypeScript, Tailwind CSS v4, and Zustand. Users can search flights, select seats on an interactive map, book with passenger details, and manage their reservations (reschedule or cancel).

---

## Tech Stack

- **Frontend**: React 19 + TypeScript
- **Routing / Steps**: Zustand-driven multi-step flow (no external router needed)
- **Styling**: Tailwind CSS v4 (via Vite plugin)
- **State Management**: Zustand with `persist` middleware
- **Database / Auth**: Supabase (PostgreSQL + RLS + Realtime) — simulated locally via `supabaseSim.ts`
- **Bundler**: Vite 6

---

## Project Structure

```
aeroflow-flight-app/
├── index.html
├── vite.config.ts
├── tsconfig.json
├── package.json
├── .env.example
├── supabase/
│   └── migrations/
│       ├── 20260520000001_initial_schema.sql     # Tables, indexes, constraints
│       ├── 20260520000002_triggers_and_rpcs.sql  # RLS, triggers, seat-lock RPC
│       └── 20260520000003_seed_data.sql          # 8 flights across 4 routes + seats
└── src/
    ├── main.tsx
    ├── App.tsx              # Shell, nav, step routing
    ├── store.ts             # Zustand stores (useFlightStore, useUserStore)
    ├── types.ts             # Shared TypeScript interfaces
    ├── supabaseSim.ts       # Local in-memory DB simulation (mirrors Supabase behavior)
    └── components/
        ├── SearchPage.tsx         # Flight search form
        ├── ResultsPage.tsx        # Flight results listing
        ├── SeatMap.tsx            # Interactive seat grid with Realtime simulation
        ├── PassengerFormPage.tsx  # Passenger details form
        ├── ConfirmationPage.tsx   # Booking confirmation + PNR
        ├── MyBookingsPage.tsx     # Manage bookings (reschedule/cancel)
        └── SupabaseTerminal.tsx   # Live DB query log viewer (dev tool)
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

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Other Commands

```bash
npm run build    # Production build → /dist
npm run preview  # Preview production build locally
npm run lint     # TypeScript type check
```

### Environment Variables

Copy `.env.example` to `.env.local` and fill in your Supabase credentials:

```bash
cp .env.example .env.local
```

```
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

> **Note**: The app currently runs with a local in-memory simulation (`supabaseSim.ts`) that mirrors the full Supabase schema and behavior, including RLS policies, atomic RPCs, and the 2-hour cancellation constraint. Plugging in real Supabase credentials requires replacing `dbSim` calls with the `@supabase/supabase-js` client.

---

## Supabase Migration Guide

If deploying against a real Supabase project, run the migrations in order:

```bash
# Using Supabase CLI
supabase db push

# Or manually in the Supabase SQL editor:
# 1. supabase/migrations/20260520000001_initial_schema.sql
# 2. supabase/migrations/20260520000002_triggers_and_rpcs.sql
# 3. supabase/migrations/20260520000003_seed_data.sql
```

This seeds 8 flights across 4 routes with a full seat map per flight.

**Test credentials** (seeded by migration 3):
- Email: `user@aeroflow.com`
- Password: `test1234`

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

**Local simulation vs. real Supabase**: The `supabaseSim.ts` file mirrors the full PostgreSQL behavior in-memory — including row-level locking, the 2-hour trigger, and Realtime seat updates. This made it possible to demo every feature without requiring a live Supabase project, but means the next step is a real integration layer swapping `dbSim` for `supabase-js`.

**Zustand over Context**: The multi-step booking flow has several interdependent pieces of state that need to survive navigation and tab closes. Zustand's `persist` middleware handles this cleanly without prop drilling or complex reducer setups.

**Optimistic seat selection**: Seats are marked selected in the store immediately on click, before the DB write resolves. If the write fails (e.g., race condition), the store rolls back. This keeps the UI snappy.

**PNR-level group booking**: Multiple passengers on the same booking share a PNR code. Reschedules update all seats under that PNR atomically — if any seat is unavailable on the new flight, the whole reschedule is rejected.
