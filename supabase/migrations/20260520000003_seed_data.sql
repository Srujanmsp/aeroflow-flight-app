-- Migration: 20260520000003_seed_data.sql
-- Description: Seed database with sample flights, default seats, and mock configurations.

-- Clear existing data (for clean migration runs)
TRUNCATE reschedules, passengers, bookings, seats, flights CASCADE;

-- Insert 8 Flights across 4 routes
-- Routes:
-- 1. LAX -> JFK (Los Angeles to New York)
-- 2. SFO -> ORD (San Francisco to Chicago)
-- 3. JFK -> LHR (New York to London Heathrow)
-- 4. HND -> SFO (Tokyo Haneda to San Francisco)

-- Use custom variables for flight IDs to link seats securely inside standard seed procedures
-- However, we'll write clear standard INSERTs here.
-- To make this migration portable, we can pre-specify the UUIDs! This is extremely helpful!

-- Flight 1: LAX -> JFK (Future, departing in 2 days)
INSERT INTO flights (id, flight_no, origin, destination, departs_at, arrives_at, aircraft_type, status, base_price)
VALUES (
    'f1000000-0000-0000-0000-000000000001', 
    'UA-2401', 
    'Los Angeles (LAX)', 
    'New York (JFK)', 
    NOW() + INTERVAL '2 days', 
    NOW() + INTERVAL '2 days' + INTERVAL '5 hours 30 minutes', 
    'Boeing 737-Max 8', 
    'on-time', 
    240.00
);

-- Flight 2: LAX -> JFK (Upcoming soon, departing in 1.5 hours - handy to test the 2-hour blocking rule!)
INSERT INTO flights (id, flight_no, origin, destination, departs_at, arrives_at, aircraft_type, status, base_price)
VALUES (
    'f1000000-0000-0000-0000-000000000002', 
    'UA-2402', 
    'Los Angeles (LAX)', 
    'New York (JFK)', 
    NOW() + INTERVAL '1 hour 30 minutes', 
    NOW() + INTERVAL '7 hours', 
    'Boeing 737-Max 8', 
    'on-time', 
    299.00
);

-- Flight 3: SFO -> ORD (Future, departing in 3 days)
INSERT INTO flights (id, flight_no, origin, destination, departs_at, arrives_at, aircraft_type, status, base_price)
VALUES (
    'f1000000-0000-0000-0000-000000000003', 
    'AA-1045', 
    'San Francisco (SFO)', 
    'Chicago (ORD)', 
    NOW() + INTERVAL '3 days', 
    NOW() + INTERVAL '3 days' + INTERVAL '4 hours 15 minutes', 
    'Airbus A321neo', 
    'on-time', 
    180.00
);

-- Flight 4: SFO -> ORD (Future, departing in 1 day)
INSERT INTO flights (id, flight_no, origin, destination, departs_at, arrives_at, aircraft_type, status, base_price)
VALUES (
    'f1000000-0000-0000-0000-000000000004', 
    'AA-1046', 
    'San Francisco (SFO)', 
    'Chicago (ORD)', 
    NOW() + INTERVAL '1 day', 
    NOW() + INTERVAL '1 day' + INTERVAL '4 hours 20 minutes', 
    'Airbus A321neo', 
    'delayed', 
    195.00
);

-- Flight 5: JFK -> LHR (Future, departing in 4 days)
INSERT INTO flights (id, flight_no, origin, destination, departs_at, arrives_at, aircraft_type, status, base_price)
VALUES (
    'f1000000-0000-0000-0000-000000000005', 
    'BA-0178', 
    'New York (JFK)', 
    'London Heathrow (LHR)', 
    NOW() + INTERVAL '4 days', 
    NOW() + INTERVAL '4 days' + INTERVAL '7 hours 15 minutes', 
    'Boeing 777-300ER', 
    'on-time', 
    650.00
);

-- Flight 6: JFK -> LHR (Departing in 45 minutes - immediate departure test)
INSERT INTO flights (id, flight_no, origin, destination, departs_at, arrives_at, aircraft_type, status, base_price)
VALUES (
    'f1000000-0000-0000-0000-000000000006', 
    'BA-0179', 
    'New York (JFK)', 
    'London Heathrow (LHR)', 
    NOW() + INTERVAL '45 minutes', 
    NOW() + INTERVAL '8 hours', 
    'Boeing 777-300ER', 
    'on-time', 
    720.00
);

-- Flight 7: HND -> SFO (Future, departing in 5 days)
INSERT INTO flights (id, flight_no, origin, destination, departs_at, arrives_at, aircraft_type, status, base_price)
VALUES (
    'f1000000-0000-0000-0000-000000000007', 
    'JL-0002', 
    'Tokyo Haneda (HND)', 
    'San Francisco (SFO)', 
    NOW() + INTERVAL '5 days', 
    NOW() + INTERVAL '5 days' + INTERVAL '9 hours 30 minutes', 
    'Boeing 787-9 Dreamliner', 
    'on-time', 
    950.00
);

-- Flight 8: HND -> SFO (Future, departing in 12 hours)
INSERT INTO flights (id, flight_no, origin, destination, departs_at, arrives_at, aircraft_type, status, base_price)
VALUES (
    'f1000000-0000-0000-0000-000000000008', 
    'JL-0004', 
    'Tokyo Haneda (HND)', 
    'San Francisco (SFO)', 
    NOW() + INTERVAL '12 hours', 
    NOW() + INTERVAL '21 hours 30 minutes', 
    'Boeing 787-9 Dreamliner', 
    'on-time', 
    890.00
);


-- Seeding Seat Layout Configuration
-- We'll write an SQL function or structured INSERTs targeting seat map creation.
-- To make the seed fast and complete, let's inject rows dynamically for each seeded flight.
-- Seat config per flight:
-- Row 1-2 (First Class, extra_fee 150): Seats A, B, C, D
-- Row 3-4 (Business Class, extra_fee 75): Seats A, B, C, D
-- Row 5-10 (Economy Class, extra_fee 0): Seats A, B, C, D, E, F

-- Let's create an helper function to seed seats quickly!
CREATE OR REPLACE FUNCTION seed_flight_seats(p_flight_id UUID) 
RETURNS VOID AS $$
DECLARE
    r INT;
    col CHAR(1);
    extra_fee_val DECIMAL(10,2);
    seat_class VARCHAR(20);
BEGIN
    -- First Class rows (1, 2)
    FOR r IN 1..2 LOOP
        FOR col IN SELECT unnest(string_to_array('A,B,C,D', ',')) LOOP
            INSERT INTO seats (flight_id, seat_number, class, extra_fee, is_available)
            VALUES (p_flight_id, r::text || col, 'first', 150.00, TRUE);
        END LOOP;
    END LOOP;

    -- Business Class rows (3, 4)
    FOR r IN 3..4 LOOP
        FOR col IN SELECT unnest(string_to_array('A,B,C,D', ',')) LOOP
            INSERT INTO seats (flight_id, seat_number, class, extra_fee, is_available)
            VALUES (p_flight_id, r::text || col, 'business', 75.00, TRUE);
        END LOOP;
    END LOOP;

    -- Economy Class rows (5 to 10)
    FOR r IN 5..10 LOOP
        FOR col IN SELECT unnest(string_to_array('A,B,C,D,E,F', ',')) LOOP
            -- Randomly make 15% of Economy seats occupied to make the seat map feel alive!
            INSERT INTO seats (flight_id, seat_number, class, extra_fee, is_available)
            VALUES (p_flight_id, r::text || col, 'economy', 0.00, (random() > 0.18));
        END LOOP;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Apply seat seeding for all 8 flights
SELECT seed_flight_seats('f1000000-0000-0000-0000-000000000001');
SELECT seed_flight_seats('f1000000-0000-0000-0000-000000000002');
SELECT seed_flight_seats('f1000000-0000-0000-0000-000000000003');
SELECT seed_flight_seats('f1000000-0000-0000-0000-000000000004');
SELECT seed_flight_seats('f1000000-0000-0000-0000-000000000005');
SELECT seed_flight_seats('f1000000-0000-0000-0000-000000000006');
SELECT seed_flight_seats('f1000000-0000-0000-0000-000000000007');
SELECT seed_flight_seats('f1000000-0000-0000-0000-000000000008');

-- Drop the temporary seeding helper function
DROP FUNCTION seed_flight_seats(UUID);

-- ============================================================
-- Indian Routes (Added on top of existing international routes)
-- Routes:
-- 5. BLR -> DEL (Bengaluru to Delhi)
-- 6. DEL -> BOM (Delhi to Mumbai)
-- 7. BOM -> BLR (Mumbai to Bengaluru)
-- ============================================================

-- Flight 9: BLR -> DEL (Future, departing in 2 days)
INSERT INTO flights (id, flight_no, origin, destination, departs_at, arrives_at, aircraft_type, status, base_price)
VALUES (
    'f1000000-0000-0000-0000-000000000009',
    'AI-505',
    'Bengaluru (BLR)',
    'Delhi (DEL)',
    NOW() + INTERVAL '2 days',
    NOW() + INTERVAL '2 days' + INTERVAL '2 hours 45 minutes',
    'Airbus A320neo',
    'on-time',
    4500.00
);

-- Flight 10: BLR -> DEL (Future, departing in 4 days)
INSERT INTO flights (id, flight_no, origin, destination, departs_at, arrives_at, aircraft_type, status, base_price)
VALUES (
    'f1000000-0000-0000-0000-000000000010',
    'AI-507',
    'Bengaluru (BLR)',
    'Delhi (DEL)',
    NOW() + INTERVAL '4 days',
    NOW() + INTERVAL '4 days' + INTERVAL '2 hours 45 minutes',
    'Airbus A320neo',
    'on-time',
    3800.00
);

-- Flight 11: DEL -> BOM (Future, departing in 3 days)
INSERT INTO flights (id, flight_no, origin, destination, departs_at, arrives_at, aircraft_type, status, base_price)
VALUES (
    'f1000000-0000-0000-0000-000000000011',
    '6E-201',
    'Delhi (DEL)',
    'Mumbai (BOM)',
    NOW() + INTERVAL '3 days',
    NOW() + INTERVAL '3 days' + INTERVAL '2 hours 15 minutes',
    'Airbus A320',
    'on-time',
    3200.00
);

-- Flight 12: DEL -> BOM (Future, departing in 5 days)
INSERT INTO flights (id, flight_no, origin, destination, departs_at, arrives_at, aircraft_type, status, base_price)
VALUES (
    'f1000000-0000-0000-0000-000000000012',
    '6E-203',
    'Delhi (DEL)',
    'Mumbai (BOM)',
    NOW() + INTERVAL '5 days',
    NOW() + INTERVAL '5 days' + INTERVAL '2 hours 15 minutes',
    'Airbus A320',
    'on-time',
    2900.00
);

-- Flight 13: BOM -> BLR (Future, departing in 2 days)
INSERT INTO flights (id, flight_no, origin, destination, departs_at, arrives_at, aircraft_type, status, base_price)
VALUES (
    'f1000000-0000-0000-0000-000000000013',
    'SG-301',
    'Mumbai (BOM)',
    'Bengaluru (BLR)',
    NOW() + INTERVAL '2 days' + INTERVAL '6 hours',
    NOW() + INTERVAL '2 days' + INTERVAL '7 hours 45 minutes',
    'Boeing 737-800',
    'on-time',
    3500.00
);

-- Flight 14: BOM -> BLR (Future, departing in 6 days)
INSERT INTO flights (id, flight_no, origin, destination, departs_at, arrives_at, aircraft_type, status, base_price)
VALUES (
    'f1000000-0000-0000-0000-000000000014',
    'SG-303',
    'Mumbai (BOM)',
    'Bengaluru (BLR)',
    NOW() + INTERVAL '6 days',
    NOW() + INTERVAL '6 days' + INTERVAL '1 hours 45 minutes',
    'Boeing 737-800',
    'on-time',
    2800.00
);

-- Seed seats for all 6 new Indian flights
CREATE OR REPLACE FUNCTION seed_flight_seats_indian(p_flight_id UUID)
RETURNS VOID AS $$
DECLARE
    r INT;
    col CHAR(1);
BEGIN
    -- First Class rows (1, 2)
    FOR r IN 1..2 LOOP
        FOR col IN SELECT unnest(string_to_array('A,B,C,D', ',')) LOOP
            INSERT INTO seats (flight_id, seat_number, class, extra_fee, is_available)
            VALUES (p_flight_id, r::text || col, 'first', 2000.00, TRUE);
        END LOOP;
    END LOOP;

    -- Business Class rows (3, 4)
    FOR r IN 3..4 LOOP
        FOR col IN SELECT unnest(string_to_array('A,B,C,D', ',')) LOOP
            INSERT INTO seats (flight_id, seat_number, class, extra_fee, is_available)
            VALUES (p_flight_id, r::text || col, 'business', 1000.00, TRUE);
        END LOOP;
    END LOOP;

    -- Economy Class rows (5 to 10)
    FOR r IN 5..10 LOOP
        FOR col IN SELECT unnest(string_to_array('A,B,C,D,E,F', ',')) LOOP
            INSERT INTO seats (flight_id, seat_number, class, extra_fee, is_available)
            VALUES (p_flight_id, r::text || col, 'economy', 0.00, (random() > 0.18));
        END LOOP;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

SELECT seed_flight_seats_indian('f1000000-0000-0000-0000-000000000009');
SELECT seed_flight_seats_indian('f1000000-0000-0000-0000-000000000010');
SELECT seed_flight_seats_indian('f1000000-0000-0000-0000-000000000011');
SELECT seed_flight_seats_indian('f1000000-0000-0000-0000-000000000012');
SELECT seed_flight_seats_indian('f1000000-0000-0000-0000-000000000013');
SELECT seed_flight_seats_indian('f1000000-0000-0000-0000-000000000014');

DROP FUNCTION seed_flight_seats_indian(UUID);
