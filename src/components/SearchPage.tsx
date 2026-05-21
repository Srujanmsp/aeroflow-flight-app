import { useState, FormEvent } from 'react';
import { useFlightStore } from '../store';
import { PlaneTakeoff, PlaneLanding, Calendar, Users, ArrowRightLeft, Search } from 'lucide-react';

const POPULAR_LOCATIONS = [
  { code: 'DEL', name: 'Delhi (DEL)' },
  { code: 'BOM', name: 'Mumbai (BOM)' },
  { code: 'BLR', name: 'Bengaluru (BLR)' },
  { code: 'LAX', name: 'Los Angeles (LAX)' },
  { code: 'JFK', name: 'New York (JFK)' },
  { code: 'SFO', name: 'San Francisco (SFO)' },
  { code: 'ORD', name: 'Chicago (ORD)' },
  { code: 'HND', name: 'Tokyo Haneda (HND)' },
  { code: 'LHR', name: 'London Heathrow (LHR)' }
];

export default function SearchPage() {
  const { activeQuery, setActiveQuery, setStep } = useFlightStore();
  const [origin, setOrigin] = useState(activeQuery?.origin || 'Los Angeles (LAX)');
  const [destination, setDestination] = useState(activeQuery?.destination || 'New York (JFK)');
  const [date, setDate] = useState(activeQuery?.date || '2026-05-22');
  const [passengerCount, setPassengerCount] = useState(activeQuery?.passengerCount || 1);

  const handleSwap = () => {
    const temp = origin;
    setOrigin(destination);
    setDestination(temp);
  };

  const handleSearch = (e: FormEvent) => {
    e.preventDefault();
    setActiveQuery({
      origin,
      destination,
      date,
      passengerCount
    });
    setStep('results');
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-6 md:p-8 shadow-sm">
      <div className="mb-6">
        <h2 className="text-2xl font-semibold text-slate-900 tracking-tight">Search Flights</h2>
        <p className="text-sm text-slate-500 mt-1">Book schedules, choose class lounges, and pre-select custom seat suites live.</p>
      </div>

      <form onSubmit={handleSearch} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-9 gap-4 items-center">
          {/* Origin */}
          <div className="md:col-span-4 relative">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">Origin</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                <PlaneTakeoff className="w-5 h-5" />
              </span>
              <select
                value={origin}
                onChange={(e) => setOrigin(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 focus:border-orange-500 focus:bg-white text-slate-900 rounded-xl py-3 pl-11 pr-4 text-sm font-medium focus:ring-1 focus:ring-orange-500 focus:outline-none transition appearance-none cursor-pointer"
              >
                {POPULAR_LOCATIONS.map((loc) => (
                  <option key={loc.code} value={loc.name} disabled={loc.name === destination}>
                    {loc.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Swap Trigger */}
          <div className="md:col-span-1 flex justify-center mt-4 md:mt-5">
            <button
              type="button"
              onClick={handleSwap}
              className="p-2 w-10 h-10 rounded-full border border-slate-200 bg-white hover:bg-slate-50 text-slate-500 hover:text-orange-500 shadow-sm flex items-center justify-center transition active:scale-95"
              title="Reverse routing paths"
            >
              <ArrowRightLeft className="w-4 h-4 md:rotate-90" />
            </button>
          </div>

          {/* Destination */}
          <div className="md:col-span-4 relative">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">Destination</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                <PlaneLanding className="w-5 h-5" />
              </span>
              <select
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 focus:border-orange-500 focus:bg-white text-slate-900 rounded-xl py-3 pl-11 pr-4 text-sm font-medium focus:ring-1 focus:ring-orange-500 focus:outline-none transition appearance-none cursor-pointer"
              >
                {POPULAR_LOCATIONS.map((loc) => (
                  <option key={loc.code} value={loc.name} disabled={loc.name === origin}>
                    {loc.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Departure Date */}
          <div className="relative">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">Departure Date</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                <Calendar className="w-5 h-5" />
              </span>
              <input
                type="date"
                value={date}
                min="2026-05-20"
                max="2026-05-28"
                onChange={(e) => setDate(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 focus:border-orange-500 focus:bg-white text-slate-900 rounded-xl py-3 pl-11 pr-4 text-sm font-medium focus:ring-1 focus:ring-orange-500 focus:outline-none transition cursor-pointer"
              />
            </div>
          </div>

          {/* Passengers */}
          <div className="relative">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">Traveler Quantity</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                <Users className="w-5 h-5" />
              </span>
              <select
                value={passengerCount}
                onChange={(e) => setPassengerCount(Number(e.target.value))}
                className="w-full bg-slate-50 border border-slate-200 focus:border-orange-500 focus:bg-white text-slate-900 rounded-xl py-3 pl-11 pr-4 text-sm font-medium focus:ring-1 focus:ring-orange-500 focus:outline-none transition appearance-none cursor-pointer"
              >
                {[1, 2, 3, 4, 5].map((val) => (
                  <option key={val} value={val}>
                    {val} {val === 1 ? 'Adult' : 'Adults'}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Submit */}
        <button
          type="submit"
          className="w-full bg-orange-600 hover:bg-orange-700 text-white font-medium py-3.5 px-6 rounded-xl shadow-md cursor-pointer hover:shadow-lg hover:shadow-orange-500/10 active:scale-98 flex items-center justify-center gap-2 transition"
        >
          <Search className="w-5 h-5" />
          Find Flights
        </button>
      </form>
    </div>
  );
}
