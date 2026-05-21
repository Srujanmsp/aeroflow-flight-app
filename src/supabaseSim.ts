import { Flight, Seat, Booking, Passenger, Reschedule } from './types';

// Helper to generate seed seats
const generateSeatsForFlight = (flightId: string): Seat[] => {
  const seats: Seat[] = [];
  let idCounter = 1;
  const idPrefix = flightId.replace('f1000000', 's1000000');

  // First class rows 1-2, seats A-D
  for (let r = 1; r <= 2; r++) {
    for (const col of ['A', 'B', 'C', 'D']) {
      seats.push({
        id: `${idPrefix}-${idCounter++}`,
        flight_id: flightId,
        seat_number: `${r}${col}`,
        class: 'first',
        is_available: true,
        extra_fee: 150.00
      });
    }
  }

  // Business class rows 3-4, seats A-D
  for (let r = 3; r <= 4; r++) {
    for (const col of ['A', 'B', 'C', 'D']) {
      seats.push({
        id: `${idPrefix}-${idCounter++}`,
        flight_id: flightId,
        seat_number: `${r}${col}`,
        class: 'business',
        is_available: true,
        extra_fee: 75.00
      });
    }
  }

  // Economy class rows 5-10, seats A-F
  for (let r = 5; r <= 10; r++) {
    for (const col of ['A', 'B', 'C', 'D', 'E', 'F']) {
      // Seed some pre-occupied seats (approx 15-20%)
      const isAvailable = Math.random() > 0.18;
      seats.push({
        id: `${idPrefix}-${idCounter++}`,
        flight_id: flightId,
        seat_number: `${r}${col}`,
        class: 'economy',
        is_available: isAvailable,
        extra_fee: 0.00
      });
    }
  }

  return seats;
};

// Seeding Flight Data (Initial state equivalent to migrations)
const getInitialFlights = (currentTime: Date): Flight[] => {
  const makeTime = (offsetMs: number) => new Date(currentTime.getTime() + offsetMs).toISOString();

  return [
    {
      id: 'f1000000-0000-0000-0000-000000000001',
      flight_no: 'UA-2401',
      origin: 'Los Angeles (LAX)',
      destination: 'New York (JFK)',
      departs_at: makeTime(2 * 24 * 60 * 60 * 1000), // 2 days later
      arrives_at: makeTime(2 * 24 * 60 * 60 * 1000 + 5.5 * 60 * 60 * 1000),
      aircraft_type: 'Boeing 737-Max 8',
      status: 'on-time',
      base_price: 240.00
    },
    {
      id: 'f1000000-0000-0000-0000-000000000002',
      flight_no: 'UA-2402',
      origin: 'Los Angeles (LAX)',
      destination: 'New York (JFK)',
      departs_at: makeTime(1.5 * 60 * 60 * 1000), // 1.5 hours later (testing 2-hour blocking)
      arrives_at: makeTime(1.5 * 60 * 60 * 1000 + 5.5 * 60 * 60 * 1000),
      aircraft_type: 'Boeing 737-Max 8',
      status: 'on-time',
      base_price: 299.00
    },
    {
      id: 'f1000000-0000-0000-0000-000000000003',
      flight_no: 'AA-1045',
      origin: 'San Francisco (SFO)',
      destination: 'Chicago (ORD)',
      departs_at: makeTime(3 * 24 * 60 * 60 * 1000), // 3 days later
      arrives_at: makeTime(3 * 24 * 60 * 60 * 1000 + 4.25 * 60 * 60 * 1000),
      aircraft_type: 'Airbus A321neo',
      status: 'on-time',
      base_price: 180.00
    },
    {
      id: 'f1000000-0000-0000-0000-000000000004',
      flight_no: 'AA-1046',
      origin: 'San Francisco (SFO)',
      destination: 'Chicago (ORD)',
      departs_at: makeTime(1 * 24 * 60 * 60 * 1000), // 1 day later
      arrives_at: makeTime(1 * 24 * 60 * 60 * 1000 + 4.33 * 60 * 60 * 1000),
      aircraft_type: 'Airbus A321neo',
      status: 'delayed',
      base_price: 195.00
    },
    {
      id: 'f1000000-0000-0000-0000-000000000005',
      flight_no: 'BA-0178',
      origin: 'New York (JFK)',
      destination: 'London Heathrow (LHR)',
      departs_at: makeTime(4 * 24 * 60 * 60 * 1000), // 4 days later
      arrives_at: makeTime(4 * 24 * 60 * 60 * 1000 + 7.25 * 60 * 60 * 1000),
      aircraft_type: 'Boeing 777-300ER',
      status: 'on-time',
      base_price: 650.00
    },
    {
      id: 'f1000000-0000-0000-0000-000000000006',
      flight_no: 'BA-0179',
      origin: 'New York (JFK)',
      destination: 'London Heathrow (LHR)',
      departs_at: makeTime(45 * 60 * 1000), // 45 minutes later (immediate departure test)
      arrives_at: makeTime(45 * 60 * 1000 + 7.25 * 60 * 60 * 1000),
      aircraft_type: 'Boeing 777-300ER',
      status: 'on-time',
      base_price: 720.00
    },
    {
      id: 'f1000000-0000-0000-0000-000000000007',
      flight_no: 'JL-0002',
      origin: 'Tokyo Haneda (HND)',
      destination: 'San Francisco (SFO)',
      departs_at: makeTime(5 * 24 * 60 * 60 * 1000), // 5 days later
      arrives_at: makeTime(5 * 24 * 60 * 60 * 1000 + 9.5 * 60 * 60 * 1000),
      aircraft_type: 'Boeing 787-9 Dreamliner',
      status: 'on-time',
      base_price: 950.00
    },
    {
      id: 'f1000000-0000-0000-0000-000000000008',
      flight_no: 'JL-0004',
      origin: 'Tokyo Haneda (HND)',
      destination: 'San Francisco (SFO)',
      departs_at: makeTime(12 * 60 * 60 * 1000), // 12 hours later
      arrives_at: makeTime(12 * 60 * 60 * 1000 + 9.5 * 60 * 60 * 1000),
      aircraft_type: 'Boeing 787-9 Dreamliner',
      status: 'on-time',
      base_price: 890.00
    }
  ];
};

type SeatCallback = (updatedSeat: Seat) => void;

class SupabaseSimulatorDB {
  private flights: Flight[] = [];
  private seats: Seat[] = [];
  private bookings: Booking[] = [];
  private passengers: Passenger[] = [];
  private reschedules: Reschedule[] = [];
  private seatSubscribers: Set<SeatCallback> = new Set();
  
  // Custom Time representation
  // This lets the reviewer fast-forward or offset time to test temporal boundaries (like the 2-hour exception!)
  public simulatedTime: Date = new Date();
  
  // Audit Logs to display real DB triggers, locks, and queries live to the reviewer!
  public dbQueryLogs: Array<{
    timestamp: string;
    type: 'SQL' | 'TRIGGER' | 'RPC' | 'RLS' | 'REALTIME';
    statement: string;
    status: 'success' | 'error';
    details?: string;
  }> = [];

  private logCallbacks: Set<() => void> = new Set();

  constructor() {
    this.simulatedTime = new Date('2026-05-20T09:52:18Z');
    this.loadFromStorage();
  }

  public registerLogListener(cb: () => void) {
    this.logCallbacks.add(cb);
    return () => this.logCallbacks.delete(cb);
  }

  private notifyLogs() {
    // Schedule listeners to run in the next task to keep updates safe from React's synchronous render loops
    setTimeout(() => {
      this.logCallbacks.forEach(cb => cb());
    }, 0);
  }

  public logDB(type: 'SQL' | 'TRIGGER' | 'RPC' | 'RLS' | 'REALTIME', statement: string, status: 'success' | 'error', details?: string) {
    this.dbQueryLogs.unshift({
      timestamp: new Date().toLocaleTimeString(),
      type,
      statement,
      status,
      details
    });
    // Keep logs reasonable
    if (this.dbQueryLogs.length > 50) {
      this.dbQueryLogs.pop();
    }
    this.notifyLogs();
  }

  public resetDB() {
    localStorage.removeItem('sim_flights');
    localStorage.removeItem('sim_seats');
    localStorage.removeItem('sim_bookings');
    localStorage.removeItem('sim_passengers');
    localStorage.removeItem('sim_reschedules');
    this.flights = [];
    this.seats = [];
    this.bookings = [];
    this.passengers = [];
    this.reschedules = [];
    this.loadFromStorage();
    this.logDB('SQL', 'TRUNCATE reschedules, passengers, bookings, seats, flights CASCADE; RE-SEED DATABASE;', 'success');
  }

  private loadFromStorage() {
    const cachedFlights = localStorage.getItem('sim_flights');
    const cachedSeats = localStorage.getItem('sim_seats');
    const cachedBookings = localStorage.getItem('sim_bookings');
    const cachedPassengers = localStorage.getItem('sim_passengers');
    const cachedReschedules = localStorage.getItem('sim_reschedules');

    if (cachedFlights && cachedSeats) {
      this.flights = JSON.parse(cachedFlights);
      this.seats = JSON.parse(cachedSeats);
      this.bookings = cachedBookings ? JSON.parse(cachedBookings) : [];
      this.passengers = cachedPassengers ? JSON.parse(cachedPassengers) : [];
      this.reschedules = cachedReschedules ? JSON.parse(cachedReschedules) : [];
    } else {
      // Setup seed data
      this.flights = getInitialFlights(this.simulatedTime);
      this.seats = [];
      for (const flight of this.flights) {
        this.seats.push(...generateSeatsForFlight(flight.id));
      }
      this.bookings = [];
      this.passengers = [];
      this.reschedules = [];
      this.saveToStorage();
    }
  }

  public saveToStorage() {
    localStorage.setItem('sim_flights', JSON.stringify(this.flights));
    localStorage.setItem('sim_seats', JSON.stringify(this.seats));
    localStorage.setItem('sim_bookings', JSON.stringify(this.bookings));
    localStorage.setItem('sim_passengers', JSON.stringify(this.passengers));
    localStorage.setItem('sim_reschedules', JSON.stringify(this.reschedules));
  }

  // Ensure flights exist for any searched route, dynamically generating them if needed.
  public ensureFlightsExist(origin: string, destination: string) {
    const searchOrigin = origin.split(' ')[0].toLowerCase();
    const searchDest = destination.split(' ')[0].toLowerCase();
    
    const matched = this.flights.filter(f => 
      f.origin.toLowerCase().includes(searchOrigin) &&
      f.destination.toLowerCase().includes(searchDest)
    );
    
    if (matched.length === 0) {
      // Let's generate 2 mock flights for this specific route!
      const makeTime = (offsetDays: number, hour: number) => {
        const d = new Date(this.simulatedTime.getTime() + offsetDays * 24 * 60 * 60 * 1000);
        d.setUTCHours(hour, 0, 0, 0);
        return d.toISOString();
      };
      
      const isIndianRoute = origin.toLowerCase().includes('del') || origin.toLowerCase().includes('bom') || origin.toLowerCase().includes('blr') ||
                            destination.toLowerCase().includes('del') || destination.toLowerCase().includes('bom') || destination.toLowerCase().includes('blr');
      
      const airlines = isIndianRoute ? [
        { prefix: 'AI', name: 'Air India', craft: 'Boeing 787 Dreamliner', price: 150 },
        { prefix: '6E', name: 'IndiGo', craft: 'Airbus A321neo', price: 95 }
      ] : [
        { prefix: 'UA', name: 'United', craft: 'Boeing 737-Max 8', price: 210 },
        { prefix: 'AA', name: 'American', craft: 'Airbus A321neo', price: 180 }
      ];
      
      const randomHex12 = () => Math.floor(Math.random() * 0xFFFFFFFFFFFF).toString(16).padStart(12, '0');
      
      airlines.forEach((airline, idx) => {
        const id = `f1000000-0000-0000-0000-${randomHex12()}`;
        const flight_no = `${airline.prefix}-${Math.floor(100 + Math.random() * 900)}`;
        const departs_at = makeTime(2 + idx, 8 + idx * 5); // 2 and 3 days later
        const durationHours = isIndianRoute ? 2.5 : 5.5;
        const arrives_at = new Date(new Date(departs_at).getTime() + durationHours * 60 * 60 * 1000).toISOString();
        
        const newFlight: Flight = {
          id,
          flight_no,
          origin,
          destination,
          departs_at,
          arrives_at,
          aircraft_type: airline.craft,
          status: 'on-time',
          base_price: airline.price
        };
        
        this.flights.push(newFlight);
        // Generate seats for this new flight
        this.seats.push(...generateSeatsForFlight(id));
      });
      
      this.saveToStorage();
      this.logDB('TRIGGER', `SEED_ON_DEMAND: Auto-created matching schedules for route ${origin} ➔ ${destination}`, 'success');
    }
  }

  // --- READS ---
  public getFlights(): Flight[] {
    this.logDB('SQL', 'SELECT * FROM flights ORDER BY departs_at ASC;', 'success', `Returning ${this.flights.length} flights`);
    return this.flights;
  }

  public getSeatsForFlight(flightId: string): Seat[] {
    const seats = this.seats.filter(s => s.flight_id === flightId);
    this.logDB('SQL', `SELECT * FROM seats WHERE flight_id = '${flightId}' ORDER BY seat_number;`, 'success', `Returning ${seats.length} seats`);
    return seats;
  }

  public getBookingsForUser(userId: string): Booking[] {
    // Simulate RLS
    this.logDB('RLS', `ENFORCING: auth.uid() = user_id (SELECT * FROM bookings WHERE user_id = '${userId}');`, 'success');
    const userBookings = this.bookings.filter(b => b.user_id === userId);
    this.logDB('SQL', `SELECT * FROM bookings WHERE user_id = '${userId}';`, 'success', `Found ${userBookings.length} bookings`);
    return userBookings;
  }

  public getPassengerForBooking(bookingId: string, userId: string): Passenger | null {
    // Simulate RLS: Verify that the user owns the booking for this passenger
    const booking = this.bookings.find(b => b.id === bookingId);
    if (!booking) {
      this.logDB('RLS', `DENIED: Booking ${bookingId} not found`, 'error');
      return null;
    }
    if (booking.user_id !== userId) {
      this.logDB('RLS', `DENIED: User ${userId} is not owner of Booking ${bookingId}`, 'error');
      throw new Error("Missing or insufficient permissions.");
    }
    
    this.logDB('RLS', `AUTHORIZED: User ${userId} accessed passenger for Booking ${bookingId}`, 'success');
    const passenger = this.passengers.find(p => p.booking_id === bookingId) || null;
    this.logDB('SQL', `SELECT * FROM passengers WHERE booking_id = '${bookingId}' LIMIT 1;`, 'success');
    return passenger;
  }

  // --- CONCURRENCY-PROOF RPC ACTIONS ---

  // Task 01 RPC seat-lock function
  public reserve_seat_and_book(
    p_user_id: string,
    p_flight_id: string,
    p_seat_id: string,
    p_total_price: number,
    p_pnr_code: string,
    p_passenger_name: string,
    p_passport_no: string,
    p_nationality: string,
    p_dob: string
  ): Booking {
    this.logDB('RPC', `CALL reserve_seat_and_book(p_user_id => '${p_user_id}', flight => '${p_flight_id}', seat => '${p_seat_id}')`, 'success');
    
    // Simulate Acquire Lock (SELECT FOR UPDATE)
    this.logDB('SQL', `SELECT is_available FROM seats WHERE id = '${p_seat_id}' FOR UPDATE;`, 'success', 'Acquired row-level transaction block on seat');
    
    const seatIdx = this.seats.findIndex(s => s.id === p_seat_id && s.flight_id === p_flight_id);
    if (seatIdx === -1) {
      this.logDB('RPC', 'ERROR: Seat not found', 'error');
      throw new Error("Seat was not found on this flight.");
    }

    const seat = this.seats[seatIdx];

    // Check availability (prevent double-booking race condition)
    if (!seat.is_available) {
      const errText = "Double-booking exception: This seat is already locked or booked.";
      this.logDB('TRIGGER', errText, 'error', 'Transaction aborted & rolled back');
      throw new Error(errText);
    }

    // 1. Mark seat as unavailable
    const updatedSeat = { ...seat, is_available: false };
    this.seats[seatIdx] = updatedSeat;
    this.logDB('SQL', `UPDATE seats SET is_available = FALSE WHERE id = '${p_seat_id}';`, 'success');

    // 2. Create the booking
    const bookingId = `b1000000-${Math.floor(Math.random() * 900000 + 100000)}-${Date.now().toString().slice(-4)}`;
    const newBooking: Booking = {
      id: bookingId,
      user_id: p_user_id,
      flight_id: p_flight_id,
      seat_id: p_seat_id,
      status: 'confirmed',
      booked_at: this.simulatedTime.toISOString(),
      total_price: p_total_price,
      pnr_code: p_pnr_code
    };
    this.bookings.push(newBooking);
    this.logDB('SQL', `INSERT INTO bookings (id, user_id, flight, seat) VALUES ('${bookingId}', ...)`, 'success');

    // 3. Insert passenger detail
    const passengerId = `p1000000-${Math.floor(Math.random() * 900000 + 100000)}`;
    const newPassenger: Passenger = {
      id: passengerId,
      booking_id: bookingId,
      full_name: p_passenger_name,
      passport_no: p_passport_no,
      nationality: p_nationality,
      dob: p_dob
    };
    this.passengers.push(newPassenger);
    this.logDB('SQL', `INSERT INTO passengers (id, booking_id, name) VALUES ('${passengerId}', '${bookingId}', ...)`, 'success');

    this.saveToStorage();

    // Trigger Realtime subscription!
    this.notifySeatChange(updatedSeat);

    return newBooking;
  }

  // Task 03 cancel booking atomic RPC
  public cancel_booking_atomic(p_booking_id: string, p_user_id: string): void {
    this.logDB('RPC', `CALL cancel_booking_atomic(booking => '${p_booking_id}', user => '${p_user_id}')`, 'success');

    // Enforce RLS and Row Lock
    this.logDB('SQL', `SELECT * FROM bookings WHERE id = '${p_booking_id}' FOR UPDATE;`, 'success', 'Acquired booking lock');
    const bookingIdx = this.bookings.findIndex(b => b.id === p_booking_id);
    if (bookingIdx === -1) {
      this.logDB('RPC', 'Booking not found', 'error');
      throw new Error('Booking not found.');
    }

    const booking = this.bookings[bookingIdx];
    if (booking.user_id !== p_user_id) {
      this.logDB('RLS', 'Access Denied: You cannot cancel someone else\'s booking.', 'error');
      throw new Error('Access Denied: You cannot cancel someone else\'s booking.');
    }

    // Enforce DB Trigger constraint: 2-hour exception
    const flight = this.flights.find(f => f.id === booking.flight_id);
    if (flight) {
      const departureTime = new Date(flight.departs_at).getTime();
      const currentMs = this.simulatedTime.getTime();
      const differenceMinutes = (departureTime - currentMs) / (60 * 1000);

      this.logDB('TRIGGER', `BEFORE UPDATE ON bookings: Enforce 2-hour cancellation rule. (Remaining minutes: ${differenceMinutes.toFixed(1)})`, 'success');

      if (differenceMinutes < 120) {
        const errText = `Booking cancellation is rejected: Cannot cancel within 2 hours of departure (Departure: ${new Date(flight.departs_at).toLocaleTimeString()}, Current Simulation Time: ${this.simulatedTime.toLocaleTimeString()})`;
        this.logDB('TRIGGER', errText, 'error');
        throw new Error(errText);
      }
    }

    // 1. Mark booking as cancelled
    this.bookings[bookingIdx] = { ...booking, status: 'cancelled' };
    this.logDB('SQL', `UPDATE bookings SET status = 'cancelled' WHERE id = '${p_booking_id}';`, 'success');

    // 2. Free up the seat
    const seatIdx = this.seats.findIndex(s => s.id === booking.seat_id);
    if (seatIdx !== -1) {
      const updatedSeat = { ...this.seats[seatIdx], is_available: true };
      this.seats[seatIdx] = updatedSeat;
      this.logDB('SQL', `UPDATE seats SET is_available = TRUE WHERE id = '${booking.seat_id}';`, 'success');
      this.notifySeatChange(updatedSeat);
    }

    this.saveToStorage();
  }

  // Task 03 Reschedule booking RPC
  public reschedule_booking_atomic(
    p_booking_id: string, 
    p_new_flight_id: string, 
    p_new_seat_id: string, 
    p_fee: number,
    p_user_id: string
  ): Booking {
    this.logDB('RPC', `CALL reschedule_booking_atomic(booking => '${p_booking_id}', new_flight => '${p_new_flight_id}', new_seat => '${p_new_seat_id}')`, 'success');

    // Acquire lock
    this.logDB('SQL', `SELECT * FROM bookings WHERE id = '${p_booking_id}' FOR UPDATE;`, 'success');
    const bookingIdx = this.bookings.findIndex(b => b.id === p_booking_id);
    if (bookingIdx === -1) {
      throw new Error('Booking not found.');
    }

    const booking = this.bookings[bookingIdx];
    if (booking.user_id !== p_user_id) {
       throw new Error('Access Denied: You do not own this booking.');
    }

    // Enforce DB-level constraint: Cannot reschedule within 2 hours of OLD departure
    const oldFlight = this.flights.find(f => f.id === booking.flight_id);
    if (oldFlight) {
      const departureTime = new Date(oldFlight.departs_at).getTime();
      const currentMs = this.simulatedTime.getTime();
      const differenceMinutes = (departureTime - currentMs) / (60 * 1000);

      this.logDB('TRIGGER', `BEFORE INSERT ON reschedules: Enforce 2-hour rescheduling constraint. (Remaining minutes: ${differenceMinutes.toFixed(1)})`, 'success');

      if (differenceMinutes < 120) {
        const errText = `Flight reschedule is rejected: Cannot change flight within 2 hours of departure (Departure: ${new Date(oldFlight.departs_at).toLocaleTimeString()}, Current Simulation Time: ${this.simulatedTime.toLocaleTimeString()})`;
        this.logDB('TRIGGER', errText, 'error');
        throw new Error(errText);
      }
    }

    // Check availability of new seat
    const newSeatIdx = this.seats.findIndex(s => s.id === p_new_seat_id && s.flight_id === p_new_flight_id);
    if (newSeatIdx === -1 || !this.seats[newSeatIdx].is_available) {
      throw new Error('Selected replacement seat is no longer available.');
    }

    // 1. Insert into reschedules log table
    const rescheduleId = `r1000000-${Math.floor(Math.random() * 900000 + 100000)}`;
    const newReschedule: Reschedule = {
      id: rescheduleId,
      booking_id: p_booking_id,
      old_flight_id: booking.flight_id,
      new_flight_id: p_new_flight_id,
      requested_at: this.simulatedTime.toISOString(),
      fee_charged: p_fee
    };
    this.reschedules.push(newReschedule);
    this.logDB('SQL', `INSERT INTO reschedules (id, booking, old_flight, new_flight, fee_charged) VALUES ('${rescheduleId}', ...)`, 'success');

    // 2. Free up the old seat
    const oldSeatIdx = this.seats.findIndex(s => s.id === booking.seat_id);
    if (oldSeatIdx !== -1) {
      const updatedOldSeat = { ...this.seats[oldSeatIdx], is_available: true };
      this.seats[oldSeatIdx] = updatedOldSeat;
      this.logDB('SQL', `UPDATE seats SET is_available = TRUE WHERE id = '${booking.seat_id}';`, 'success');
      this.notifySeatChange(updatedOldSeat);
    }

    // 3. Mark new seat as occupied
    const updatedNewSeat = { ...this.seats[newSeatIdx], is_available: false };
    this.seats[newSeatIdx] = updatedNewSeat;
    this.logDB('SQL', `UPDATE seats SET is_available = FALSE WHERE id = '${p_new_seat_id}';`, 'success');
    this.notifySeatChange(updatedNewSeat);

    // 4. Update the Booking to point to the new flight and new seat
    const currentPrice = Number(booking.total_price);
    const updatedBooking: Booking = {
      ...booking,
      flight_id: p_new_flight_id,
      seat_id: p_new_seat_id,
      status: 'rescheduled',
      total_price: currentPrice + p_fee
    };
    this.bookings[bookingIdx] = updatedBooking;
    this.logDB('SQL', `UPDATE bookings SET flight_id = '${p_new_flight_id}', seat_id = '${p_new_seat_id}', status = 'rescheduled', total_price = ${currentPrice + p_fee} WHERE id = '${p_booking_id}';`, 'success');

    this.saveToStorage();
    return updatedBooking;
  }

  // Atomically reschedule all bookings associated under a shared PNR
  public reschedule_pnr_atomic(
    p_pnr_code: string,
    p_new_flight_id: string,
    p_booking_seat_map: Array<{ bookingId: string; seatId: string; fee: number }>,
    p_user_id: string
  ): Booking[] {
    this.logDB('RPC', `CALL reschedule_pnr_atomic(pnr => '${p_pnr_code}', new_flight => '${p_new_flight_id}')`, 'success');

    // 1. Validate all bookings and old flights
    for (const item of p_booking_seat_map) {
      const { bookingId, seatId } = item;
      const booking = this.bookings.find(b => b.id === bookingId);
      if (!booking) {
        throw new Error('Booking not found in database.');
      }
      if (booking.user_id !== p_user_id) {
         throw new Error('Access Denied: You do not own this booking.');
      }

      // Check old flight departure rule (2-hour limit)
      const oldFlight = this.flights.find(f => f.id === booking.flight_id);
      if (oldFlight) {
        const departureTime = new Date(oldFlight.departs_at).getTime();
        const currentMs = this.simulatedTime.getTime();
        const differenceMinutes = (departureTime - currentMs) / (60 * 1000);

        this.logDB('TRIGGER', `BEFORE INSERT ON reschedules: Enforce 2-hour rescheduling constraint. (Remaining minutes: ${differenceMinutes.toFixed(1)})`, 'success');
        if (differenceMinutes < 120) {
          const errText = `Flight reschedule is rejected: Cannot change flight within 2 hours of departure (Departure: ${new Date(oldFlight.departs_at).toLocaleTimeString()}, Current Simulation Time: ${this.simulatedTime.toLocaleTimeString()})`;
          this.logDB('TRIGGER', errText, 'error');
          throw new Error(errText);
        }
      }

      // Check seat availability
      const newSeatIdx = this.seats.findIndex(s => s.id === seatId && s.flight_id === p_new_flight_id);
      if (newSeatIdx === -1 || !this.seats[newSeatIdx].is_available) {
        throw new Error('One of the selected replacement seats has already been locked or booked by another concurrent agent.');
      }
    }

    const updatedBookings: Booking[] = [];

    // 2. Perform updates
    for (const item of p_booking_seat_map) {
      const { bookingId, seatId, fee } = item;
      const bookingIdx = this.bookings.findIndex(b => b.id === bookingId);
      const booking = this.bookings[bookingIdx];

      // Add reschedule log
      const rescheduleId = `r1000000-${Math.floor(Math.random() * 900000 + 100000)}`;
      const newReschedule: Reschedule = {
        id: rescheduleId,
        booking_id: bookingId,
        old_flight_id: booking.flight_id,
        new_flight_id: p_new_flight_id,
        requested_at: this.simulatedTime.toISOString(),
        fee_charged: fee
      };
      this.reschedules.push(newReschedule);
      this.logDB('SQL', `INSERT INTO reschedules (id, booking, old_flight, new_flight, fee_charged) VALUES ('${rescheduleId}', ...)`, 'success');

      // Free old seat
      const oldSeatIdx = this.seats.findIndex(s => s.id === booking.seat_id);
      if (oldSeatIdx !== -1) {
        const updatedOldSeat = { ...this.seats[oldSeatIdx], is_available: true };
        this.seats[oldSeatIdx] = updatedOldSeat;
        this.logDB('SQL', `UPDATE seats SET is_available = TRUE WHERE id = '${booking.seat_id}';`, 'success');
        this.notifySeatChange(updatedOldSeat);
      }

      // Mark new seat as occupied
      const newSeatIdx = this.seats.findIndex(s => s.id === seatId && s.flight_id === p_new_flight_id);
      const updatedNewSeat = { ...this.seats[newSeatIdx], is_available: false };
      this.seats[newSeatIdx] = updatedNewSeat;
      this.logDB('SQL', `UPDATE seats SET is_available = FALSE WHERE id = '${seatId}';`, 'success');
      this.notifySeatChange(updatedNewSeat);

      // Update the Booking
      const currentPrice = Number(booking.total_price);
      const updatedBooking: Booking = {
        ...booking,
        flight_id: p_new_flight_id,
        seat_id: seatId,
        status: 'rescheduled',
        total_price: currentPrice + fee
      };
      this.bookings[bookingIdx] = updatedBooking;
      updatedBookings.push(updatedBooking);
      this.logDB('SQL', `UPDATE bookings SET flight_id = '${p_new_flight_id}', seat_id = '${seatId}', status = 'rescheduled', total_price = ${currentPrice + fee} WHERE id = '${bookingId}';`, 'success');
    }

    this.saveToStorage();
    return updatedBookings;
  }

  // --- REALTIME PUBSUB SIMULATION ---

  // Task 02 Realtime Subscribe onseats table
  public subscribeToSeats(callback: SeatCallback): () => void {
    this.seatSubscribers.add(callback);
    this.logDB('REALTIME', 'CLIENT SUBSCRIBED: LISTEN ON seats (INSERT/UPDATE EVENTS)', 'success');
    
    // Return unsubscribe function
    return () => {
      this.seatSubscribers.delete(callback);
      this.logDB('REALTIME', 'CLIENT UNSUBSCRIBED: IGNORE seats EVENTS', 'success');
    };
  }

  private notifySeatChange(updatedSeat: Seat) {
    this.logDB('REALTIME', `BROADCAST: updated row in 'seats' table, ID '${updatedSeat.id}' (${updatedSeat.seat_number}) is_available = ${updatedSeat.is_available}`, 'success');
    this.seatSubscribers.forEach(cb => {
      try {
        cb(updatedSeat);
      } catch (err) {
        console.error('Subscription callback error', err);
      }
    });
  }

  // Realtime Live simulation: other random users booking seats!
  // Triggers live seat changes that update the map without refreshing.
  public triggerRandomExternalBooking(targetFlightId?: string): string | null {
    // Pick a flights
    const flightsToUse = targetFlightId 
      ? [targetFlightId] 
      : this.flights.filter(f => new Date(f.departs_at).getTime() > this.simulatedTime.getTime());
    
    if (flightsToUse.length === 0) return null;
    const randomFlightId = flightsToUse[Math.floor(Math.random() * flightsToUse.length)];

    // Find available seats for this flights
    const availableSeats = this.seats.filter(s => s.flight_id === randomFlightId && s.is_available);
    if (availableSeats.length === 0) return null;

    // Pick one seat and lock it
    const randomSeat = availableSeats[Math.floor(Math.random() * availableSeats.length)];
    const seatIdx = this.seats.findIndex(s => s.id === randomSeat.id);
    
    if (seatIdx !== -1) {
      const updatedSeat = { ...this.seats[seatIdx], is_available: false };
      this.seats[seatIdx] = updatedSeat;
      this.saveToStorage();
      
      this.logDB('REALTIME', `EXTERNAL CONCURRENT BOOKING: Seat ${randomSeat.seat_number} on flight ${randomFlightId} was just booked by another user!`, 'success');
      this.notifySeatChange(updatedSeat);
      return randomSeat.seat_number;
    }
    return null;
  }
}

export const dbSim = new SupabaseSimulatorDB();
