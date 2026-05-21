import { useState } from 'react';
import { useUserStore } from '../store';
import { dbSim } from '../supabaseSim';
import { Flight, Booking, Seat } from '../types';
import { 
  Calendar, 
  Armchair, 
  BadgeAlert, 
  Trash2, 
  CheckCircle, 
  Compass, 
  Plane, 
  RefreshCw, 
  AlertCircle, 
  History,
  X,
  CreditCard,
  User
} from 'lucide-react';

export default function MyBookingsPage() {
  const { 
    user, 
    cachedBookings, 
    cachedPassengers, 
    cancelCachedBookingInStore, 
    updatePnrFlight 
  } = useUserStore();
  
  // Rescheduling modal state management
  const [reschedulePnr, setReschedulePnr] = useState<string | null>(null);
  const [rescheduleBookings, setRescheduleBookings] = useState<Booking[]>([]);
  const [alternateFlights, setAlternateFlights] = useState<Flight[]>([]);
  const [selectedAltFlight, setSelectedAltFlight] = useState<Flight | null>(null);
  const [altSeats, setAltSeats] = useState<Seat[]>([]);
  const [selectedAltSeats, setSelectedAltSeats] = useState<Record<string, Seat>>({});
  
  // Custom Confirmation Dialogs
  const [cancelTargetPnr, setCancelTargetPnr] = useState<string | null>(null);
  const [errorText, setErrorText] = useState<string | null>(null);
  const [successText, setSuccessText] = useState<string | null>(null);

  if (!user) {
    return (
      <div className="text-center p-8 bg-white border border-slate-100 rounded-2xl shadow-sm">
        <p className="text-slate-500 font-medium text-sm">Please log in to manage schedules and bookings.</p>
      </div>
    );
  }

  // Reload bookings from simulated DB
  const rawFlights = dbSim.getFlights();

  const handleTriggerCancelClick = (pnrCode: string) => {
    setErrorText(null);
    setSuccessText(null);
    setCancelTargetPnr(pnrCode);
  };

  const handleExecuteCancel = () => {
    if (!cancelTargetPnr) return;

    try {
      // Find all bookings with this PNR code
      const bookingsToCancel = cachedBookings.filter(b => b.pnr_code === cancelTargetPnr && b.status !== 'cancelled');
      
      for (const b of bookingsToCancel) {
        cancelCachedBookingInStore(b.id);
      }
      
      setSuccessText('Seat reservations returned successfully. All tickets under this shared PNR have been cancelled atomically.');
      setCancelTargetPnr(null);
    } catch (err: any) {
      setErrorText(err.message || 'Database error occurred during cancellation.');
      setCancelTargetPnr(null);
    }
  };

  // Rescheduling flow triggers
  const handleTriggerReschedule = (pnrCode: string) => {
    setErrorText(null);
    setSuccessText(null);
    
    // Find all active bookings matching this PNR code
    const groupBookings = cachedBookings.filter((b) => b.pnr_code === pnrCode && b.status !== 'cancelled');
    if (groupBookings.length === 0) return;

    const firstBooking = groupBookings[0];
    const currentFlight = rawFlights.find((f) => f.id === firstBooking.flight_id);
    if (!currentFlight) return;

    // Filter alternate flights going to the same destination route
    const routes = rawFlights.filter(
      (f) => 
        f.id !== currentFlight.id &&
        f.origin === currentFlight.origin &&
        f.destination === currentFlight.destination
    );

    setReschedulePnr(pnrCode);
    setRescheduleBookings(groupBookings);
    setAlternateFlights(routes);
    setSelectedAltFlight(null);
    setSelectedAltSeats({});
  };

  const handleSelectAltFlight = (flight: Flight) => {
    setSelectedAltFlight(flight);
    const seats = dbSim.getSeatsForFlight(flight.id).filter((s) => s.is_available);
    setAltSeats(seats);
    setSelectedAltSeats({});
  };

  const handleSelectSeatForBooking = (bookingId: string, seat: Seat) => {
    setSelectedAltSeats((prev) => ({
      ...prev,
      [bookingId]: seat
    }));
  };

  const handleExecuteRescheduleSubmit = () => {
    if (!reschedulePnr || !selectedAltFlight) return;

    // Validate a seat has been chosen for each traveler
    const allSeatsChosen = rescheduleBookings.every((b) => selectedAltSeats[b.id]);
    if (!allSeatsChosen) {
      setErrorText('Please select an alternative seat suite for all travelers in this itinerary.');
      return;
    }

    try {
      const originalFlight = rawFlights.find((f) => f.id === rescheduleBookings[0].flight_id);
      if (!originalFlight) return;

      // Charge delta for each booking on the new flight + seat
      const seatSelections = rescheduleBookings.map((b) => {
        const altSeat = selectedAltSeats[b.id];
        const baseDiff = selectedAltFlight.base_price - originalFlight.base_price;
        const extraDiff = altSeat.extra_fee;
        const feeCharged = Math.max(0, baseDiff + extraDiff);

        return {
          bookingId: b.id,
          seatId: altSeat.id,
          fee: feeCharged
        };
      });

      // Execute stored atomic update on Zustand & Database Simulation
      updatePnrFlight(reschedulePnr, selectedAltFlight.id, seatSelections);

      const totalFee = seatSelections.reduce((sum, item) => sum + item.fee, 0);
      setSuccessText(`Success! Atomic reschedule updated for ${rescheduleBookings.length} passenger(s). Fee delta charged: $${totalFee.toFixed(2)}`);
      setReschedulePnr(null);
      setRescheduleBookings([]);
    } catch (err: any) {
      setErrorText(err.message || 'Failed to reschedule.');
      setReschedulePnr(null);
      setRescheduleBookings([]);
    }
  };

  // Group bookings by PNR code
  const groups: Record<string, { pnr_code: string; bookings: Booking[]; flight: Flight; status: Booking['status'] }> = {};

  cachedBookings.forEach((b) => {
    const flight = rawFlights.find((f) => f.id === b.flight_id);
    if (!flight) return;

    if (!groups[b.pnr_code]) {
      groups[b.pnr_code] = {
        pnr_code: b.pnr_code,
        bookings: [],
        flight,
        status: b.status
      };
    }
    groups[b.pnr_code].bookings.push(b);
    
    // If any booking in PNR is confirmed/rescheduled, mark the whole group status as active
    if (b.status !== 'cancelled') {
      groups[b.pnr_code].status = b.status;
    }
  });

  const groupedList = Object.values(groups).sort((a, b) => {
    if (a.status === 'cancelled' && b.status !== 'cancelled') return 1;
    if (a.status !== 'cancelled' && b.status === 'cancelled') return -1;
    return new Date(a.flight.departs_at).getTime() - new Date(b.flight.departs_at).getTime();
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center border-b border-slate-50 pb-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-950 tracking-tight">Active Itineraries</h2>
          <p className="text-xs text-slate-500 mt-0.5">Cancel, modify seating charts, or reschedule flight times securely.</p>
        </div>
        <div className="border border-indigo-150 bg-indigo-50/50 px-3 py-1.5 rounded-xl flex items-center gap-2 text-xs font-semibold text-indigo-805">
          <History className="w-4 h-4 text-indigo-501 animate-spin" style={{ animationDuration: '6s' }} />
          <span>Syncing Live Updates</span>
        </div>
      </div>

      {successText && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-4 rounded-xl text-xs flex items-center justify-between gap-2 animate-fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{successText}</span>
          </div>
          <button onClick={() => setSuccessText(null)} className="text-emerald-900 font-bold hover:text-emerald-700 text-sm">&times;</button>
        </div>
      )}

      {errorText && (
        <div className="bg-rose-50 border border-rose-200 text-rose-700 p-4 rounded-xl text-xs flex items-start gap-2.5 animate-fade-in">
          <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold block uppercase tracking-wider mb-1 text-rose-800">DB Exception Blocked Update</span>
            {errorText}
          </div>
        </div>
      )}

      {groupedList.length === 0 ? (
        <div className="bg-slate-50/50 border border-dashed border-slate-205 py-12 px-6 rounded-2xl text-center max-w-md mx-auto">
          <Compass className="w-10 h-10 text-slate-350 mx-auto mb-3" />
          <h3 className="text-slate-750 font-bold text-sm">No bookings found</h3>
          <p className="text-slate-400 text-xs mt-1">Ready to explore? Choose an available route above and secure a seating suite to start your journey.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5">
          {groupedList.map((group) => {
            const { pnr_code, bookings, flight, status } = group;
            const departureTimeStr = new Date(flight.departs_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            const departureDateStr = new Date(flight.departs_at).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
            
            const totalCombinedPrice = bookings.reduce((sum, b) => sum + Number(b.total_price), 0);
            const isActive = status !== 'cancelled';

            return (
              <div 
                key={pnr_code} 
                className={`border rounded-2xl overflow-hidden bg-white hover:shadow-md transition duration-200 ${
                  status === 'cancelled' 
                    ? 'border-slate-100 bg-slate-50/20 opacity-70' 
                    : status === 'rescheduled'
                    ? 'border-amber-200 shadow-sm shadow-amber-500/5'
                    : 'border-slate-100'
                }`}
              >
                {/* Header line */}
                <div className={`px-5 py-3.5 flex justify-between items-center ${
                  status === 'cancelled' ? 'bg-slate-100/60' :
                  status === 'rescheduled' ? 'bg-amber-50/80 border-b border-amber-100' : 'bg-slate-50/80'
                }`}>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-black text-slate-500">Shared PNR: {pnr_code}</span>
                    <span className="text-[10px] text-slate-400 font-medium">({bookings.length} traveler{bookings.length > 1 ? 's' : ''})</span>
                    {status === 'rescheduled' && (
                      <span className="text-[9px] font-bold text-amber-700 bg-amber-100 border border-amber-200 px-2 py-0.5 rounded uppercase">
                        Modified
                      </span>
                    )}
                  </div>
                  <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider ${
                    status === 'confirmed' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' :
                    status === 'rescheduled' ? 'bg-amber-100 text-amber-800 border border-amber-200' :
                    'bg-slate-150 text-slate-500 border border-slate-200'
                  }`}>
                    {status}
                  </span>
                </div>

                {/* Itinerary grid */}
                <div className="p-5 md:p-6 grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
                  <div className="md:col-span-7 space-y-3">
                    <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-lg w-max shrink-0 border border-slate-100 mb-2">
                      <Plane className="w-4 h-4 text-slate-500 rotate-45" />
                      <span className="text-xs font-mono font-bold text-slate-700">{flight.flight_no}</span>
                      <span className="text-slate-350">|</span>
                      <span className="text-[11px] text-slate-500">{flight.aircraft_type}</span>
                    </div>

                    <div className="flex items-center gap-8">
                      <div>
                        <span className="text-[9px] uppercase tracking-wider text-slate-400 font-semibold font-mono block">Station From</span>
                        <span className="text-slate-800 font-extrabold text-sm">{flight.origin}</span>
                        <span className="text-slate-500 text-[10px] block mt-0.5">{departureDateStr}</span>
                      </div>
                      <div className="text-center font-mono text-[10px] text-slate-350">✈</div>
                      <div>
                        <span className="text-[9px] uppercase tracking-wider text-slate-400 font-semibold font-mono block">Station To</span>
                        <span className="text-slate-800 font-extrabold text-sm">{flight.destination}</span>
                        <span className="text-indigo-650 text-[10px] block mt-0.5">Depart @ {departureTimeStr}</span>
                      </div>
                    </div>
                  </div>

                  {/* Travelers info */}
                  <div className="md:col-span-5 border-t md:border-t-0 md:border-l border-slate-100 pt-4 md:pt-0 md:pl-6 space-y-3">
                    <div className="space-y-1.5 text-xs text-slate-405">
                      <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">Travelers Seating Summary</span>
                      <div className="space-y-1.5 max-h-32 overflow-y-auto pr-1">
                        {bookings.map((b) => {
                          const passenger = cachedPassengers[b.id];
                          const seatObj = dbSim.getSeatsForFlight(flight.id).find((s) => s.id === b.seat_id);
                          return (
                            <div key={b.id} className="flex justify-between items-center text-xs bg-slate-50 p-2 rounded-xl border border-slate-100 shadow-sm leading-tight">
                              <span className="text-slate-850 font-bold truncate max-w-[130px]" title={passenger?.full_name}>
                                👤 {passenger?.full_name || 'Passenger'}
                              </span>
                              <span className="font-mono text-[10px] bg-slate-900 text-white px-2 py-0.5 rounded font-black shrink-0">
                                Suite {seatObj?.seat_number || '??'}
                              </span>
                            </div>
                          );
                        })}
                      </div>

                      <div className="flex justify-between pt-2 border-t border-slate-100/60 font-semibold">
                        <span className="text-slate-405">Combined Fare:</span>
                        <span className="text-slate-900 font-mono font-bold">${totalCombinedPrice.toFixed(2)}</span>
                      </div>
                    </div>

                    {isActive && (
                      <div className="flex items-center gap-2 pt-1 border-t border-slate-100/50">
                        <button
                          onClick={() => handleTriggerReschedule(pnr_code)}
                          className="flex-1 bg-slate-950 hover:bg-amber-600 text-white text-[11px] font-bold py-2 px-2.5 rounded-lg border border-slate-800/20 active:scale-95 transition cursor-pointer flex items-center justify-center gap-1 shadow-sm"
                        >
                          <RefreshCw className="w-3.5 h-3.5" />
                          Reschedule Group
                        </button>
                        <button
                          onClick={() => handleTriggerCancelClick(pnr_code)}
                          className="p-2 text-rose-600 hover:text-white bg-rose-50 hover:bg-rose-600 border border-rose-100 hover:border-rose-500 rounded-lg active:scale-95 transition cursor-pointer"
                          title="Atomic cancellation for all seats"
                        >
                          <Trash2 className="w-4 h-4 font-black" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* RLS / Database Double-Confirm Cancellation Modal Dialog */}
      {cancelTargetPnr && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-fade-in text-slate-800">
          <div className="bg-white rounded-2xl max-w-md w-full border border-slate-100 shadow-2xl p-6 space-y-4">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="p-3 bg-rose-50 rounded-xl">
                <BadgeAlert className="w-6 h-6 shrink-0" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-950">Confirm Itinerary Cancellation?</h3>
                <p className="text-slate-500 text-xs font-semibold">This executes Postgres trigger constraints live.</p>
              </div>
            </div>

            <p className="text-slate-600 text-xs leading-relaxed">
              Are you sure you want to cancel flight bookings for shared PNR: <b className="text-slate-900 font-mono text-sm">{cancelTargetPnr}</b>? 
              This will atomically release all seats connected to this group itinerary immediately.
              <br /><br />
              <span className="text-rose-650 font-bold italic block">⚠️ Departure Exception Rules: Flight cancellations departing within 2 hours are rejected automatically.</span>
            </p>

            <div className="flex gap-2 pt-2 text-xs">
              <button
                onClick={() => setCancelTargetPnr(null)}
                className="flex-1 border border-slate-205 py-2.5 rounded-xl font-bold text-slate-500 hover:bg-slate-50 transition cursor-pointer"
              >
                No, Keep Bookings
              </button>
              <button
                onClick={handleExecuteCancel}
                className="flex-1 bg-rose-600 hover:bg-rose-700 text-white font-bold py-2.5 rounded-xl transition cursor-pointer"
              >
                Yes, Cancel Reservation
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Rescheduling Wizard Modal */}
      {reschedulePnr && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto text-slate-800">
          <div className="bg-white rounded-2xl max-w-xl w-full border border-slate-105 shadow-2xl p-6 space-y-5 my-8">
            <div className="flex justify-between items-center border-b border-slate-50 pb-3">
              <div className="flex items-center gap-2">
                <RefreshCw className="w-5 h-5 text-amber-500 animate-spin" style={{ animationDuration: '4s' }} />
                <h3 className="text-base font-bold text-slate-950">Flight Reschedule Terminal</h3>
              </div>
              <button onClick={() => { setReschedulePnr(null); setRescheduleBookings([]); }} className="text-slate-400 hover:text-slate-600 text-xl font-black cursor-pointer leading-none">&times;</button>
            </div>

            <p className="text-xs text-slate-500 leading-normal">
              Pick an alternative route scheduled in the flight database. We will atomically assign alternate seats for all passengers under PNR <b className="font-mono text-slate-800">{reschedulePnr}</b>.
            </p>

            {/* Alternates list */}
            {alternateFlights.length === 0 ? (
              <div className="bg-amber-50 border border-amber-100 text-amber-800 p-3 rounded-lg text-xs font-semibold text-center italic">
                No alternative scheduled flight times found on this exact route.
              </div>
            ) : (
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">Step 1: Pick Alternate Flight Time</label>
                  <div className="grid grid-cols-1 gap-1.5 max-h-40 overflow-y-auto pr-1">
                    {alternateFlights.map((alt) => (
                      <button
                        key={alt.id}
                        type="button"
                        onClick={() => handleSelectAltFlight(alt)}
                        className={`p-3 rounded-xl border text-left flex justify-between items-center transition cursor-pointer ${
                          selectedAltFlight?.id === alt.id
                            ? 'bg-amber-50 border-amber-300 shadow-sm'
                            : 'bg-white hover:bg-slate-50 border-slate-200'
                        }`}
                      >
                        <div className="text-xs font-semibold space-y-0.5">
                          <span className="font-mono text-[10px] text-amber-600 uppercase font-black block">{alt.flight_no}</span>
                          <span className="text-slate-800 block">{alt.aircraft_type}</span>
                          <span className="text-[10px] text-slate-400 block">Depart: {new Date(alt.departs_at).getUTCHours()}:{new Date(alt.departs_at).getUTCMinutes().toString().padStart(2, '0')} UTC</span>
                        </div>
                        <div className="text-right">
                          <span className="text-[10px] text-slate-405 block font-normal">Fares Book</span>
                          <span className="font-mono text-zinc-900 font-extrabold">${alt.base_price.toFixed(2)}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Traveler Seat Assignments */}
                {selectedAltFlight && (
                  <div className="space-y-4">
                    <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-405 block">Step 2: Assign Seats for Travelers</label>
                    <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
                      {rescheduleBookings.map((b) => {
                        const passenger = cachedPassengers[b.id];
                        const chosenSeat = selectedAltSeats[b.id];
                        const originSeat = dbSim.getSeatsForFlight(rescheduleBookings[0].flight_id).find((s) => s.id === b.seat_id);

                        return (
                          <div key={b.id} className="bg-slate-50 border border-slate-150 rounded-2xl p-4 space-y-2.5">
                            <div className="flex justify-between items-center border-b border-slate-200/60 pb-2">
                              <span className="text-xs font-extrabold text-slate-900 flex items-center gap-1.5">
                                <User className="w-3.5 h-3.5 text-indigo-500" />
                                {passenger?.full_name || 'Traveler'}
                              </span>
                              <span className="text-[10px] text-slate-400">
                                Current Suite: <strong className="text-slate-700 font-mono">{originSeat?.seat_number}</strong>
                              </span>
                            </div>

                            <div className="space-y-1.5">
                              <div className="flex justify-between items-center text-[10px] uppercase font-bold text-slate-400">
                                <span>Choose New Seating Suite:</span>
                                {chosenSeat && (
                                  <span className="text-orange-600 font-mono font-black">Selected: Suite {chosenSeat.seat_number}</span>
                                )}
                              </div>
                              
                              {altSeats.length === 0 ? (
                                <p className="text-xs text-slate-400 italic">No available seats left on this replacement flight.</p>
                              ) : (
                                <div className="flex flex-wrap gap-1.5 p-1 bg-white border border-slate-150 rounded-xl max-h-24 overflow-y-auto">
                                  {altSeats.map((seat) => {
                                    const isSelectedForMe = chosenSeat?.id === seat.id;
                                    const isSelectedForOther = Object.entries(selectedAltSeats).some(([bId, s]) => bId !== b.id && (s as Seat)?.id === seat.id);

                                    return (
                                      <button
                                        key={seat.id}
                                        type="button"
                                        disabled={isSelectedForOther}
                                        onClick={() => handleSelectSeatForBooking(b.id, seat)}
                                        className={`w-10 h-10 rounded border font-mono text-[10px] font-bold flex flex-col items-center justify-center transition cursor-pointer ${
                                          isSelectedForMe
                                            ? 'bg-orange-500 border-orange-600 text-white shadow-sm'
                                            : isSelectedForOther
                                            ? 'bg-slate-100 border-slate-150 text-slate-350 cursor-not-allowed opacity-50'
                                            : 'bg-slate-50 border-slate-200 text-slate-800 hover:border-orange-500 hover:bg-orange-500/10'
                                        }`}
                                        title={isSelectedForOther ? 'Assigned to other group traveler' : `Suite ${seat.seat_number} - surcharge: $${seat.extra_fee}`}
                                      >
                                        <span>{seat.seat_number}</span>
                                        <span className="text-[6.5px] uppercase leading-none opacity-80">{seat.class.slice(0, 3)}</span>
                                      </button>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Billing Summary breakdown */}
                {selectedAltFlight && rescheduleBookings.every((b) => selectedAltSeats[b.id]) && (
                  <div className="bg-amber-50/70 border border-amber-100 rounded-xl p-3.5 space-y-2 text-xs">
                    <div className="flex justify-between font-bold text-amber-900 uppercase tracking-wider text-[10px]">
                      <span>Delta Price Calculation</span>
                      <span>Itinerary Pricing</span>
                    </div>

                    <div className="space-y-1 text-slate-705">
                      {rescheduleBookings.map((b) => {
                        const passenger = cachedPassengers[b.id];
                        const altSeat = selectedAltSeats[b.id];
                        const originalFlight = rawFlights.find((f) => f.id === b.flight_id);
                        if (!originalFlight) return null;
                        
                        const baseDiff = selectedAltFlight.base_price - originalFlight.base_price;
                        const extraDiff = altSeat.extra_fee;
                        const delta = Math.max(0, baseDiff + extraDiff);

                        return (
                          <div key={b.id} className="flex justify-between">
                            <span>Passenger {passenger?.full_name}:</span>
                            <span className="font-mono">
                              Suite {altSeat.seat_number} (${delta.toFixed(2)} delta)
                            </span>
                          </div>
                        );
                      })}

                      <div className="flex justify-between border-t border-amber-250/50 pt-2 mt-2 font-extrabold text-amber-955 text-sm">
                        <span>Combined Delta Surcharge:</span>
                        <span className="font-mono font-black text-orange-600">
                          ${(() => {
                            let totalDelta = 0;
                            rescheduleBookings.forEach((b) => {
                              const altSeat = selectedAltSeats[b.id];
                              if (!altSeat) return;
                              const originalFlight = rawFlights.find((f) => f.id === b.flight_id);
                              if (!originalFlight) return;
                              const baseDiff = selectedAltFlight.base_price - originalFlight.base_price;
                              const extraDiff = altSeat.extra_fee;
                              totalDelta += Math.max(0, baseDiff + extraDiff);
                            });
                            return totalDelta.toFixed(2);
                          })()}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex gap-2 pt-2 text-xs">
                  <button
                    onClick={() => { setReschedulePnr(null); setRescheduleBookings([]); }}
                    className="flex-1 border border-slate-205 py-2.5 rounded-xl font-bold text-slate-500 hover:bg-slate-50 transition cursor-pointer"
                  >
                    Discard Changes
                  </button>
                  <button
                    onClick={handleExecuteRescheduleSubmit}
                    disabled={!selectedAltFlight || !rescheduleBookings.every((b) => selectedAltSeats[b.id])}
                    className="flex-1 bg-amber-600 hover:bg-amber-700 text-white font-bold py-2.5 rounded-xl shadow transition disabled:opacity-40 cursor-pointer"
                  >
                    Confirm Rescheduling Group ({rescheduleBookings.length} Pax)
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
