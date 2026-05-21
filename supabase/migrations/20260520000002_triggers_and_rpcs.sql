-- Migration: 20260520000002_triggers_and_rpcs.sql
-- Description: Create triggers for safety and RPCs for concurrency-proof booking.

-- 1. Trigger to block cancellation within 2 hours of flight departure
CREATE OR REPLACE FUNCTION check_booking_cancellation_time()
RETURNS TRIGGER AS $$
DECLARE
    flight_departure TIMESTAMPTZ;
BEGIN
    -- Only double check when booking status shifts to 'cancelled'
    IF NEW.status = 'cancelled' AND OLD.status != 'cancelled' THEN
        SELECT departs_at INTO flight_departure
        FROM flights
        WHERE id = NEW.flight_id;
        
        -- Enforce rule: cancellations within 2 hours of departure are blocked
        IF flight_departure IS NOT NULL AND (flight_departure - NOW()) < INTERVAL '2 hours' THEN
            RAISE EXCEPTION 'Booking cancellation is rejected: Cannot cancel within 2 hours of departure (Departure: %, Current: %)', 
                flight_departure, NOW();
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER enforce_booking_cancellation_constraint
    BEFORE UPDATE ON bookings
    FOR EACH ROW
    WHEN (NEW.status = 'cancelled')
    EXECUTE FUNCTION check_booking_cancellation_time();


-- 2. Trigger to block rescheduling within 2 hours of flight departure (Old flight departure check)
CREATE OR REPLACE FUNCTION check_booking_reschedule_time()
RETURNS TRIGGER AS $$
DECLARE
    old_flight_departure TIMESTAMPTZ;
BEGIN
    SELECT departs_at INTO old_flight_departure
    FROM flights
    WHERE id = NEW.old_flight_id;
    
    -- Enforce rule: reschedule within 2 hours of old flight departure is blocked
    IF old_flight_departure IS NOT NULL AND (old_flight_departure - NOW()) < INTERVAL '2 hours' THEN
        RAISE EXCEPTION 'Flight reschedule is rejected: Cannot change flight within 2 hours of departure (Departure: %, Current: %)', 
            old_flight_departure, NOW();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER enforce_booking_reschedule_constraint
    BEFORE INSERT ON reschedules
    FOR EACH ROW
    EXECUTE FUNCTION check_booking_reschedule_time();


-- 3. Robust RPC function to lock a seat and book atomically (concurrency-safe)
-- This function uses "SELECT ... FOR UPDATE" to lock the seat row, checking is_available before completing the transaction.
CREATE OR REPLACE FUNCTION reserve_seat_and_book(
    p_user_id UUID,
    p_flight_id UUID,
    p_seat_id UUID,
    p_total_price DECIMAL(10, 2),
    p_pnr_code VARCHAR(10),
    p_passenger_name VARCHAR(200),
    p_passport_no VARCHAR(50),
    p_nationality VARCHAR(100),
    p_dob DATE
)
RETURNS UUID AS $$
DECLARE
    v_booking_id UUID;
    v_seat_available BOOLEAN;
BEGIN
    -- 1. Acquire row lock on the seat to block concurrent transactions on this specific seat
    SELECT is_available INTO v_seat_available
    FROM seats
    WHERE id = p_seat_id AND flight_id = p_flight_id
    FOR UPDATE;
    
    -- 2. Verify availability
    IF v_seat_available IS NULL THEN
        RAISE EXCEPTION 'Seat was not found on this flight.';
    ELSIF v_seat_available = FALSE THEN
        RAISE EXCEPTION 'Double-booking exception: This seat is already locked or booked.';
    END IF;
    
    -- 3. Mark the seat as unavailable
    UPDATE seats
    SET is_available = FALSE, version = version + 1
    WHERE id = p_seat_id;
    
    -- 4. Create the Booking entry
    INSERT INTO bookings (user_id, flight_id, seat_id, status, booked_at, total_price, pnr_code)
    VALUES (p_user_id, p_flight_id, p_seat_id, 'confirmed', NOW(), p_total_price, p_pnr_code)
    RETURNING id INTO v_booking_id;
    
    -- 5. Insert Passenger info corresponding to this booking
    INSERT INTO passengers (booking_id, full_name, passport_no, nationality, dob)
    VALUES (v_booking_id, p_passenger_name, p_passport_no, p_nationality, p_dob);
    
    RETURN v_booking_id;
EXCEPTION
    WHEN OTHERS THEN
        -- PostgreSQL naturally rolls back the entire block upon encountering unhandled exceptions
        RAISE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 4. Robust RPC function to cancel a booking and release the seat atomically
CREATE OR REPLACE FUNCTION cancel_booking_atomic(
    p_booking_id UUID,
    p_user_id UUID
)
RETURNS BOOLEAN AS $$
DECLARE
    v_seat_id UUID;
    v_flight_id UUID;
    v_user_matches BOOLEAN;
BEGIN
    -- Fetch booking info & lock row for update
    SELECT seat_id, flight_id, (user_id = p_user_id)
    INTO v_seat_id, v_flight_id, v_user_matches
    FROM bookings
    WHERE id = p_booking_id
    FOR UPDATE;
    
    IF v_seat_id IS NULL THEN
        RAISE EXCEPTION 'Booking not found.';
    END IF;
    
    IF v_user_matches = FALSE THEN
        RAISE EXCEPTION 'Access Denied: You cannot cancel someone else''s booking.';
    END IF;
    
    -- Mark booking as cancelled (this will trigger check_booking_cancellation_time)
    UPDATE bookings
    SET status = 'cancelled'
    WHERE id = p_booking_id;
    
    -- Free the seat row
    UPDATE seats
    SET is_available = TRUE
    WHERE id = v_seat_id AND flight_id = v_flight_id;
    
    RETURN TRUE;
EXCEPTION
    WHEN OTHERS THEN
        RAISE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
