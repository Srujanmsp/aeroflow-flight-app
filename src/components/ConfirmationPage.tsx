import { useFlightStore, useUserStore } from '../store';
import { dbSim } from '../supabaseSim';
import { CheckCircle, Calendar, Armchair, ArrowRight, ClipboardCheck, Sparkles, MapPin } from 'lucide-react';

export default function ConfirmationPage() {
  const { selectedFlight, selectedSeats, resetStore, setStep } = useFlightStore();
  const { cachedBookings, user } = useUserStore();

  // Find all active bookings matching the current selection
  const activeBookings = cachedBookings.filter(
    (b) => b.flight_id === selectedFlight?.id && selectedSeats.some(s => s.id === b.seat_id) && b.status === 'confirmed'
  );

  const handleGoToMyBookings = () => {
    resetStore(); // Reset search store
    // Open My Bookings directly (handled by the App component's tab toggle layout)
    const tabChanger = (window as any).setActiveAppTab;
    if (tabChanger) {
      tabChanger('bookings');
    }
  };

  if (!selectedFlight || selectedSeats.length === 0 || activeBookings.length === 0) {
    return (
      <div className="text-center p-8 bg-white border border-slate-100 rounded-2xl max-w-sm mx-auto shadow-sm">
        <CheckCircle className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
        <h3 className="text-lg font-bold text-slate-900">Booking Finalized!</h3>
        <p className="text-slate-500 text-xs mt-2">Check the 'My Bookings' section to manage this transaction details.</p>
        <button
          onClick={handleGoToMyBookings}
          className="mt-4 bg-slate-950 text-white hover:bg-orange-600 text-xs font-bold py-2 px-4 rounded-xl transition cursor-pointer"
        >
          View My Bookings
        </button>
      </div>
    );
  }

  const depDateObj = new Date(selectedFlight.departs_at);
  const pnrCode = activeBookings[0]?.pnr_code || 'PNR-ERR';
  const totalCombinedCost = activeBookings.reduce((sum, b) => sum + b.total_price, 0);

  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-6 md:p-8 shadow-sm max-w-xl mx-auto space-y-6">
      <div className="text-center space-y-2">
        <div className="inline-flex items-center justify-center p-3 bg-emerald-50 rounded-full border border-emerald-100">
          <CheckCircle className="w-8 h-8 text-emerald-600" />
        </div>
        <h2 className="text-2xl font-black text-slate-900 tracking-tight">Booking Confirmed!</h2>
        <p className="text-xs text-slate-500">Atomic database locking transaction complete. Relational schemas synced.</p>
      </div>

      {/* Handcrafted Boarding Ticket Visual */}
      <div className="bg-slate-950 text-white rounded-2xl overflow-hidden relative shadow-lg">
        {/* Ticket Header */}
        <div className="bg-gradient-to-r from-slate-900 to-indigo-950 px-5 py-4 flex justify-between items-center border-b border-slate-800">
          <div className="flex items-center gap-2">
            <span className="bg-orange-500 text-white p-1 rounded-md text-[10px] uppercase font-bold tracking-widest leading-none">PASS</span>
            <span className="font-mono text-xs font-bold uppercase tracking-widest text-slate-350">{selectedFlight.flight_no}</span>
          </div>
          <div className="text-right">
            <span className="text-[9px] uppercase tracking-widest text-slate-450 block font-semibold leading-none">Shared Itinerary PNR</span>
            <span className="font-mono text-sm text-orange-400 font-extrabold tracking-wider">{pnrCode}</span>
          </div>
        </div>

        {/* Ticket Body */}
        <div className="p-5 space-y-4 text-slate-300">
          <div className="flex justify-between items-center gap-3">
            <div>
              <span className="text-[10px] text-slate-500 block uppercase font-mono tracking-widest">Departure Station</span>
              <span className="text-white font-extrabold text-sm">{selectedFlight.origin}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 block uppercase font-mono tracking-widest text-right">Arrival Station</span>
              <span className="text-white font-extrabold text-sm text-right block">{selectedFlight.destination}</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 border-t border-slate-800/80 pt-4 text-xs font-mono">
            <div>
              <span className="text-[9px] text-slate-500 block uppercase">Boarding Date</span>
              <span className="text-white font-bold">{depDateObj.toLocaleDateString([], { month: 'short', day: 'numeric' })}</span>
            </div>
            <div>
              <span className="text-[9px] text-slate-500 block uppercase">Gate Departure</span>
              <span className="text-indigo-400 font-bold">{depDateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
            </div>
          </div>

          {/* Individual Passengers Lists */}
          <div className="border-t border-slate-800/80 pt-4 space-y-2">
            <span className="text-[9px] text-slate-500 block uppercase font-mono tracking-widest font-bold">Assigned suites & Guests</span>
            <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
              {activeBookings.map((booking) => {
                const passenger = dbSim.getPassengerForBooking(booking.id, user?.id || '');
                const seatNumber = selectedSeats.find(s => s.id === booking.seat_id)?.seat_number || 'N/A';
                return (
                  <div key={booking.id} className="flex justify-between items-center bg-slate-900/60 p-2.5 rounded-xl border border-slate-800 text-xs">
                    <div className="flex items-center gap-2">
                      <ClipboardCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                      <div>
                        <span className="text-slate-400 text-[10px] block">Lounge Guest</span>
                        <span className="text-white font-bold">{passenger?.full_name || 'Anonymous Passenger'}</span>
                      </div>
                    </div>
                    <div className="text-right flex items-center gap-2">
                      <span className="bg-orange-500 text-white rounded font-mono font-bold px-2 py-0.5 text-[10px] uppercase">
                        Suite {seatNumber}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Receipt Footer */}
          <div className="border-t border-slate-800/80 pt-3 flex justify-between items-center text-xs">
            <span className="text-slate-450 font-mono">Charge (inclusive of all surcharges)</span>
            <span className="text-white font-mono font-black text-sm">${totalCombinedCost.toFixed(2)}</span>
          </div>
        </div>

        {/* Half circle ticket punch simulation */}
        <div className="absolute left-0 bottom-1/4 -translate-x-1/2 w-4 h-8 bg-white rounded-r-full border-r border-slate-200"></div>
        <div className="absolute right-0 bottom-1/4 translate-x-1/2 w-4 h-8 bg-white rounded-l-full border-l border-slate-200"></div>
      </div>

      <div className="space-y-3">
        <button
          onClick={handleGoToMyBookings}
          className="w-full bg-slate-900 hover:bg-orange-600 text-white font-bold py-3.5 px-4 rounded-xl shadow-md transition hover:shadow-lg active:scale-98 flex items-center justify-center gap-2 cursor-pointer"
        >
          Manage Bookings & Test Rescheduling
          <ArrowRight className="w-4 h-4" />
        </button>
        <button
          onClick={() => { resetStore(); setStep('search'); }}
          className="w-full bg-transparent hover:bg-slate-50 text-slate-500 hover:text-slate-800 text-xs font-semibold py-2.5 px-4 rounded-xl border border-slate-200 transition font-bold cursor-pointer"
        >
          Book Another Ticket
        </button>
      </div>
    </div>
  );
}
