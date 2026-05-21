import { useState } from 'react';
import { useFlightStore } from '../store';
import { dbSim } from '../supabaseSim';
import { ArrowLeft, Clock, Plane, ArrowRight, ShieldCheck, Tag } from 'lucide-react';
import { Flight } from '../types';

export default function ResultsPage() {
  const { activeQuery, setSelectedFlight, setStep, setSelectedSeat } = useFlightStore();
  const [selectedSort, setSelectedSort] = useState<'price' | 'time'>('price');

  if (!activeQuery) {
    return (
      <div className="text-center p-8 bg-white rounded-2xl border border-slate-100">
        <p className="text-slate-500">Please start a flight search query first.</p>
        <button onClick={() => setStep('search')} className="mt-4 bg-orange-600 text-white px-4 py-2 rounded-xl text-xs">
          Return to Search
        </button>
      </div>
    );
  }

  // Ensure matching flights exist for this route query
  dbSim.ensureFlightsExist(activeQuery.origin, activeQuery.destination);

  // Fetch from our persistent simulated DB
  const rawFlights = dbSim.getFlights();

  // Filter flights matching route
  let matchedFlights = rawFlights.filter(
    (f) =>
      f.origin.toLowerCase().includes(activeQuery.origin.split(' ')[0].toLowerCase()) &&
      f.destination.toLowerCase().includes(activeQuery.destination.split(' ')[0].toLowerCase())
  );

  // Fallback (failsafe): if no exact matching route, use raw flights
  if (matchedFlights.length === 0) {
    matchedFlights = rawFlights;
  }

  // Sort
  const sortedFlights = [...matchedFlights].sort((a, b) => {
    if (selectedSort === 'price') return a.base_price - b.base_price;
    return new Date(a.departs_at).getTime() - new Date(b.departs_at).getTime();
  });

  const handleSelectFlight = (flight: Flight) => {
    setSelectedFlight(flight);
    setSelectedSeat(null); // Clear selected seat upon new flight selection
    setStep('seats');
  };

  const getDurationString = (dep: string, arr: string) => {
    const diffMs = new Date(arr).getTime() - new Date(dep).getTime();
    const hours = Math.floor(diffMs / (60 * 60 * 1000));
    const mins = Math.floor((diffMs % (60 * 60 * 1000)) / (60 * 1000));
    return `${hours}h ${mins}m`;
  };

  return (
    <div className="space-y-6">
      {/* Back to search & stats */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <button
          onClick={() => setStep('search')}
          className="flex items-center gap-1.5 text-slate-500 hover:text-orange-500 text-xs font-semibold cursor-pointer transition uppercase tracking-wider"
        >
          <ArrowLeft className="w-4 h-4" />
          Modify Search
        </button>
        <div className="flex bg-slate-100 p-0.5 rounded-lg text-xs font-medium">
          <button
            onClick={() => setSelectedSort('price')}
            className={`px-3 py-1.5 rounded-md transition ${
              selectedSort === 'price'
                ? 'bg-white text-slate-900 shadow-sm font-semibold'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            Cheapest First
          </button>
          <button
            onClick={() => setSelectedSort('time')}
            className={`px-3 py-1.5 rounded-md transition ${
              selectedSort === 'time'
                ? 'bg-white text-slate-900 shadow-sm font-semibold'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            Earliest Departure
          </button>
        </div>
      </div>

      {/* Flight Cards list */}
      <div className="space-y-4">
        {sortedFlights.map((flight) => {
          const depTime = new Date(flight.departs_at);
          const arrTime = new Date(flight.arrives_at);

          // Calculate hours/minutes till departure to flag quick tests
          const diffHours = (depTime.getTime() - dbSim.simulatedTime.getTime()) / (60 * 60 * 1000);
          const isLooming = diffHours > 0 && diffHours < 2;

          return (
            <div
              key={flight.id}
              className="bg-white border border-slate-100 hover:border-slate-200 rounded-2xl p-5 md:p-6 shadow-sm hover:shadow-md transition duration-200"
            >
              <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-50 pb-4 mb-4">
                <div className="flex items-center gap-3">
                  <div className="bg-orange-50 text-orange-600 p-2.5 rounded-xl">
                    <Plane className="w-5 h-5 rotate-45" />
                  </div>
                  <div>
                    <span className="font-mono text-xs font-bold text-slate-400 uppercase tracking-widest">{flight.flight_no}</span>
                    <h3 className="text-slate-800 text-sm font-bold mt-0.5">{flight.aircraft_type}</h3>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {isLooming ? (
                    <span className="bg-amber-50 border border-amber-500/20 text-amber-700 font-medium text-[10px] px-2.5 py-1 rounded-full animate-pulse uppercase tracking-wider">
                      ✈️ Leaving in {diffHours.toFixed(1)}h (Cancellation Locked)
                    </span>
                  ) : (
                    <span className="bg-indigo-50 border border-indigo-100 text-indigo-700 font-medium text-[10px] px-2.5 py-1 rounded-full uppercase tracking-wider">
                      Reschedulable
                    </span>
                  )}
                  <span className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded ${
                    flight.status === 'on-time' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' :
                    flight.status === 'delayed' ? 'bg-rose-50 text-rose-700 border border-rose-100' : 'bg-slate-100 text-slate-600'
                  }`}>
                    {flight.status}
                  </span>
                </div>
              </div>

              {/* Itinerary Grid */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
                {/* Clock Departures */}
                <div className="md:col-span-8 grid grid-cols-11 items-center gap-2 text-center md:text-left">
                  <div className="col-span-4">
                    <p className="font-mono text-xl font-extrabold text-slate-900">
                      {depTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                    <p className="text-xs text-slate-500 font-semibold mt-1 truncate">{flight.origin}</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">{depTime.toLocaleDateString([], { month: 'short', day: 'numeric' })}</p>
                  </div>

                  <div className="col-span-3 flex flex-col items-center justify-center">
                    <span className="text-[10px] text-slate-400 font-mono font-medium flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      {getDurationString(flight.departs_at, flight.arrives_at)}
                    </span>
                    {/* Visual Vector line */}
                    <div className="relative w-full h-[2px] bg-slate-100 my-2">
                      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white px-1">
                        <Plane className="w-3.5 h-3.5 text-slate-300 rotate-90" />
                      </div>
                    </div>
                    <span className="text-[9px] text-emerald-600 font-semibold uppercase tracking-widest">Non-Stop</span>
                  </div>

                  <div className="col-span-4 text-center md:text-right">
                    <p className="font-mono text-xl font-extrabold text-slate-900">
                      {arrTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                    <p className="text-xs text-slate-500 font-semibold mt-1 truncate">{flight.destination}</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">{arrTime.toLocaleDateString([], { month: 'short', day: 'numeric' })}</p>
                  </div>
                </div>

                {/* Price and CTA */}
                <div className="md:col-span-4 flex flex-col items-center md:items-end justify-center border-t md:border-t-0 md:border-l border-slate-100 pt-4 md:pt-0 md:pl-6">
                  <div className="text-center md:text-right mb-2">
                    <span className="text-[10px] text-slate-450 uppercase tracking-widest font-semibold flex items-center gap-1">
                      <Tag className="w-3 h-3 text-slate-400" /> From Base Price
                    </span>
                    <p className="text-2xl font-black text-slate-900 tracking-tight font-mono mt-0.5">
                      ${flight.base_price.toFixed(2)}
                    </p>
                  </div>
                  <button
                    onClick={() => handleSelectFlight(flight)}
                    className="w-full bg-slate-900 hover:bg-orange-600 text-white hover:text-white text-xs font-bold py-2.5 px-4 rounded-xl flex items-center justify-center gap-1 cursor-pointer transition active:scale-95"
                  >
                    Select Cabin Seats &rarr;
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
