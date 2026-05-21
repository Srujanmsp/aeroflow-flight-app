-- Migration: 20260520000001_initial_schema.sql
-- Description: Create all table structures, indexes, and enable RLS.

-- Enable UUID extension if not enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. FLIGHTS table
CREATE TABLE flights (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    flight_no VARCHAR(10) NOT NULL UNIQUE,
    origin VARCHAR(100) NOT NULL,
    destination VARCHAR(100) NOT NULL,
    departs_at TIMESTAMPTZ NOT NULL,
    arrives_at TIMESTAMPTZ NOT NULL,
    aircraft_type VARCHAR(50) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'on-time' CHECK (status IN ('on-time', 'delayed', 'cancelled', 'departed', 'arrived')),
    base_price DECIMAL(10, 2) NOT NULL CHECK (base_price > 0),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT flight_itinerary_check CHECK (departs_at < arrives_at)
);

-- 2. SEATS table
CREATE TABLE seats (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    flight_id UUID REFERENCES flights(id) ON DELETE CASCADE,
    seat_number VARCHAR(5) NOT NULL,
    class VARCHAR(20) NOT NULL CHECK (class IN ('economy', 'business', 'first')),
    is_available BOOLEAN NOT NULL DEFAULT TRUE,
    extra_fee DECIMAL(10, 2) NOT NULL DEFAULT 0.00 CHECK (extra_fee >= 0),
    version INT NOT NULL DEFAULT 1, -- used for optimistic locking / concurrency
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_seat_per_flight UNIQUE (flight_id, seat_number)
);

-- 3. BOOKINGS table
CREATE TABLE bookings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL, -- references auth.users(id)
    flight_id UUID REFERENCES flights(id) ON DELETE RESTRICT,
    seat_id UUID REFERENCES seats(id) ON DELETE RESTRICT,
    status VARCHAR(20) NOT NULL DEFAULT 'confirmed' CHECK (status IN ('confirmed', 'rescheduled', 'cancelled')),
    booked_at TIMESTAMPTZ DEFAULT NOW(),
    total_price DECIMAL(10, 2) NOT NULL CHECK (total_price >= 0),
    pnr_code VARCHAR(10) NOT NULL UNIQUE,
    CONSTRAINT unique_active_seat_booking UNIQUE (flight_id, seat_id) DEFERRABLE INITIALLY DEFERRED
);

-- 4. PASSENGERS table
CREATE TABLE passengers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    booking_id UUID REFERENCES bookings(id) ON DELETE CASCADE,
    full_name VARCHAR(200) NOT NULL,
    passport_no VARCHAR(50) NOT NULL,
    nationality VARCHAR(100) NOT NULL,
    dob DATE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. RESCHEDULES table
CREATE TABLE reschedules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    booking_id UUID REFERENCES bookings(id) ON DELETE CASCADE,
    old_flight_id UUID REFERENCES flights(id) ON DELETE RESTRICT,
    new_flight_id UUID REFERENCES flights(id) ON DELETE RESTRICT,
    requested_at TIMESTAMPTZ DEFAULT NOW(),
    fee_charged DECIMAL(10, 2) NOT NULL DEFAULT 0.00 CHECK (fee_charged >= 0)
);

-- Create optimal indexes
CREATE INDEX idx_flights_itinerary ON flights(origin, destination, departs_at);
CREATE INDEX idx_seats_flight ON seats(flight_id, is_available);
CREATE INDEX idx_bookings_user ON bookings(user_id);
CREATE INDEX idx_passengers_booking ON passengers(booking_id);
CREATE INDEX idx_reschedules_booking ON reschedules(booking_id);

-- Enable Row Level Security (RLS) on all tables
ALTER TABLE flights ENABLE ROW LEVEL SECURITY;
ALTER TABLE seats ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE passengers ENABLE ROW LEVEL SECURITY;
ALTER TABLE reschedules ENABLE ROW LEVEL SECURITY;

-- Define RLS Policies
-- Flights and Seats: Anyone (authenticated or guest) can read them
CREATE POLICY "Allow public read access to flights" ON flights FOR SELECT USING (true);
CREATE POLICY "Allow public read access to seats" ON seats FOR SELECT USING (true);

-- Bookings: Users can only see and insert/update their own bookings
CREATE POLICY "Users can view their own bookings" 
    ON bookings FOR SELECT 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own bookings" 
    ON bookings FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own bookings" 
    ON bookings FOR UPDATE 
    USING (auth.uid() = user_id) 
    WITH CHECK (auth.uid() = user_id);

-- Passengers: Access is based on the booking owner
CREATE POLICY "Users can view passengers of their bookings" 
    ON passengers FOR SELECT 
    USING (EXISTS (
        SELECT 1 FROM bookings 
        WHERE bookings.id = passengers.booking_id AND bookings.user_id = auth.uid()
    ));

CREATE POLICY "Users can insert passengers for their bookings" 
    ON passengers FOR INSERT 
    WITH CHECK (EXISTS (
        SELECT 1 FROM bookings 
        WHERE bookings.id = passengers.booking_id AND bookings.user_id = auth.uid()
    ));

-- Reschedules: Users can only see and create reschedules for their own bookings
CREATE POLICY "Users can view their reschedules" 
    ON reschedules FOR SELECT 
    USING (EXISTS (
        SELECT 1 FROM bookings 
        WHERE bookings.id = reschedules.booking_id AND bookings.user_id = auth.uid()
    ));

CREATE POLICY "Users can create their reschedules" 
    ON reschedules FOR INSERT 
    WITH CHECK (EXISTS (
        SELECT 1 FROM bookings 
        WHERE bookings.id = reschedules.booking_id AND bookings.user_id = auth.uid()
    ));
