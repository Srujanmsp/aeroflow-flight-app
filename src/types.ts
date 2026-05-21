export interface Flight {
  id: string;
  flight_no: string;
  origin: string;
  destination: string;
  departs_at: string; // ISO String
  arrives_at: string; // ISO String
  aircraft_type: string;
  status: 'on-time' | 'delayed' | 'cancelled' | 'departed' | 'arrived';
  base_price: number;
}

export interface Seat {
  id: string;
  flight_id: string;
  seat_number: string;
  class: 'economy' | 'business' | 'first';
  is_available: boolean;
  extra_fee: number;
}

export interface Booking {
  id: string;
  user_id: string;
  flight_id: string;
  seat_id: string;
  status: 'confirmed' | 'rescheduled' | 'cancelled';
  booked_at: string; // ISO String
  total_price: number;
  pnr_code: string;
}

export interface Passenger {
  id: string;
  booking_id: string;
  full_name: string;
  passport_no: string;
  nationality: string;
  dob: string; // YYYY-MM-DD
}

export interface Reschedule {
  id: string;
  booking_id: string;
  old_flight_id: string;
  new_flight_id: string;
  requested_at: string;
  fee_charged: number;
}

export interface FlightSearchQuery {
  origin: string;
  destination: string;
  date: string; // YYYY-MM-DD
  passengerCount: number;
}

export interface PassengerForm {
  fullName: string;
  passportNo: string;
  nationality: string;
  dob: string;
}

export interface FlightStore {
  activeQuery: FlightSearchQuery | null;
  selectedFlight: Flight | null;
  selectedSeats: Seat[];
  selectedSeat: Seat | null;
  currentStep: 'search' | 'results' | 'seats' | 'form' | 'confirmation';
  passengerForm: PassengerForm;
  optimisticSelectedSeatId: string | null;
  
  // Actions
  setActiveQuery: (query: FlightSearchQuery | null) => void;
  setSelectedFlight: (flight: Flight | null) => void;
  setSelectedSeats: (seats: Seat[]) => void;
  setSelectedSeat: (seat: Seat | null) => void;
  setStep: (step: 'search' | 'results' | 'seats' | 'form' | 'confirmation') => void;
  setPassengerForm: (form: Partial<PassengerForm>) => void;
  setOptimisticSeat: (seatId: string | null) => void;
  resetStore: () => void;
}

export interface User {
  id: string;
  email: string;
}

export interface UserStore {
  sessionToken: string | null;
  user: User | null;
  cachedBookings: Booking[];
  cachedPassengers: Record<string, Passenger>;  // booking_id -> Passenger
  
  // Actions
  login: (email: string) => void;
  logout: () => void;
  setCachedBookings: (bookings: Booking[]) => void;
  addCachedBooking: (booking: Booking, passenger: Passenger) => void;
  updateBookingFlight: (bookingId: string, newFlightId: string, newSeatId: string, fee: number) => void;
  updatePnrFlight: (pnrCode: string, newFlightId: string, seatSelections: Array<{ bookingId: string; seatId: string; fee: number }>) => void;
  cancelCachedBookingInStore: (bookingId: string) => void;
}
