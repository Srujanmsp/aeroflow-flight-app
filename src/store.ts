import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { FlightStore, UserStore, FlightSearchQuery, Flight, Seat, PassengerForm, Booking, Passenger } from './types';
import { dbSim } from './supabaseSim';
import { supabase, isSupabaseConfigured } from './supabaseClient';

const initialPassengerForm: PassengerForm = {
  fullName: '',
  passportNo: '',
  nationality: '',
  dob: ''
};

export const useFlightStore = create<FlightStore>()(
  persist(
    (set) => ({
      activeQuery: null,
      selectedFlight: null,
      selectedSeats: [],
      selectedSeat: null,
      currentStep: 'search',
      passengerForm: initialPassengerForm,
      optimisticSelectedSeatId: null,

      setActiveQuery: (query) => set({ activeQuery: query }),
      setSelectedFlight: (flight) => set({ selectedFlight: flight }),
      setSelectedSeats: (seats) => set({ selectedSeats: seats, selectedSeat: seats[0] || null }),
      setSelectedSeat: (seat) => set({ selectedSeat: seat, selectedSeats: seat ? [seat] : [] }),
      setStep: (step) => set({ currentStep: step }),
      setPassengerForm: (form) =>
        set((state) => ({
          passengerForm: { ...state.passengerForm, ...form }
        })),
      setOptimisticSeat: (seatId) => set({ optimisticSelectedSeatId: seatId }),

      resetStore: () =>
        set({
          activeQuery: null,
          selectedFlight: null,
          selectedSeats: [],
          selectedSeat: null,
          currentStep: 'search',
          passengerForm: initialPassengerForm,
          optimisticSelectedSeatId: null
        })
    }),
    {
      name: 'flight-store-storage',
      partialize: (state) => {
        const { passengerForm, ...rest } = state;
        return {
          ...rest,
          passengerForm: {
            ...passengerForm,
            passportNo: '' // exclude passport number from localStorage (PII protection)
          }
        };
      }
    }
  )
);

export const useUserStore = create<UserStore>()(
  persist(
    (set, get) => ({
      sessionToken: null,
      user: null,
      cachedBookings: [],
      cachedPassengers: {},

      login: (email: string) => {
        const userId = `u1000000-${email.split('@')[0] || 'user'}`;
        const mockUser = { id: userId, email };

        const bookings = dbSim.getBookingsForUser(userId);
        const passengers: Record<string, Passenger> = {};

        bookings.forEach(b => {
          try {
            const p = dbSim.getPassengerForBooking(b.id, userId);
            if (p) passengers[b.id] = p;
          } catch (err) {
            // ignore
          }
        });

        set({
          sessionToken: `session-${Date.now()}-${Math.random().toString(36).substring(2, 10)}`,
          user: mockUser,
          cachedBookings: bookings,
          cachedPassengers: passengers
        });
      },

      logout: async () => {
        // Sign out from real Supabase if configured
        if (isSupabaseConfigured()) {
          await supabase.auth.signOut();
        }

        set({
          sessionToken: null,
          user: null,
          cachedBookings: [],
          cachedPassengers: {}
        });

        useFlightStore.getState().resetStore();
      },

      setCachedBookings: (bookings) => set({ cachedBookings: bookings }),

      addCachedBooking: (booking, passenger) =>
        set((state) => ({
          cachedBookings: [booking, ...state.cachedBookings],
          cachedPassengers: {
            ...state.cachedPassengers,
            [booking.id]: passenger
          }
        })),

      updateBookingFlight: (bookingId, newFlightId, newSeatId, fee) => {
        const user = get().user;
        if (!user) return;

        try {
          const updatedBooking = dbSim.reschedule_booking_atomic(
            bookingId,
            newFlightId,
            newSeatId,
            fee,
            user.id
          );

          set((state) => ({
            cachedBookings: state.cachedBookings.map((b) =>
              b.id === bookingId ? updatedBooking : b
            )
          }));
        } catch (err: any) {
          throw new Error(err.message || 'Failed to reschedule.');
        }
      },

      updatePnrFlight: (pnrCode, newFlightId, seatSelections) => {
        const user = get().user;
        if (!user) return;

        try {
          const updatedBookings = dbSim.reschedule_pnr_atomic(
            pnrCode,
            newFlightId,
            seatSelections,
            user.id
          );

          set((state) => ({
            cachedBookings: state.cachedBookings.map((b) => {
              const match = updatedBookings.find((ub) => ub.id === b.id);
              return match ? match : b;
            })
          }));
        } catch (err: any) {
          throw new Error(err.message || 'Failed to reschedule multi-passenger booking.');
        }
      },

      cancelCachedBookingInStore: (bookingId) => {
        const user = get().user;
        if (!user) return;

        try {
          dbSim.cancel_booking_atomic(bookingId, user.id);

          set((state) => ({
            cachedBookings: state.cachedBookings.map((b) =>
              b.id === bookingId ? { ...b, status: 'cancelled' as const } : b
            )
          }));
        } catch (err: any) {
          throw new Error(err.message || 'Failed to cancel booking.');
        }
      }
    }),
    {
      name: 'user-store-storage',
      partialize: (state) => ({
        sessionToken: state.sessionToken
      })
    }
  )
);

// Rehydrate user session on app boot
export const rehydrateUserSession = async () => {
  // If Supabase is configured, check for an active session
  if (isSupabaseConfigured()) {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user?.email) {
      useUserStore.getState().login(session.user.email);
      return;
    }
  }

  // Fall back to persisted token or default user
  const token = useUserStore.getState().sessionToken;
  if (token) {
    useUserStore.getState().login('user@aeroflow.com');
  } else {
    useUserStore.getState().login('user@aeroflow.com');
  }
};
