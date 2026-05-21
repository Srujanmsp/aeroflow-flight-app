import { useEffect, useState, useRef } from 'react';
import { useFlightStore } from '../store';
import { dbSim } from '../supabaseSim';
import { Seat } from '../types';
import { Armchair, Sparkles, Gem, AlertTriangle, ArrowLeft, ArrowRight, CornerDownRight } from 'lucide-react';

export default function SeatMap() {
  const { 
    activeQuery,
    selectedFlight, 
    selectedSeats, 
    setSelectedSeats, 
    setStep, 
    optimisticSelectedSeatId, 
    setOptimisticSeat 
  } = useFlightStore();
  
  const passengerCount = activeQuery?.passengerCount || 1;
  const [seats, setSeats] = useState<Seat[]>([]);
  const [loading, setLoading] = useState(false);
  const subscriptionRef = useRef<(() => void) | null>(null);

  // Load seats from simulator & subscribe to live Realtime updates
  useEffect(() => {
    if (!selectedFlight) return;

    // Initial Fetch
    const activeSeats = dbSim.getSeatsForFlight(selectedFlight.id);
    setSeats(activeSeats);

    // Subscribe to Live Realtime updates on 'seats' table
    subscriptionRef.current = dbSim.subscribeToSeats((updatedSeat) => {
      // Check if this seat belongs to the currently viewed flight
      if (updatedSeat.flight_id === selectedFlight.id) {
        setSeats(currentSeats => 
          currentSeats.map(s => s.id === updatedSeat.id ? updatedSeat : s)
        );
      }
    });

    return () => {
      if (subscriptionRef.current) {
        subscriptionRef.current();
      }
    };
  }, [selectedFlight]);

  if (!selectedFlight) {
    return (
      <div className="text-center p-8 bg-white border border-slate-100 rounded-2xl">
        <p className="text-slate-500">No flight selected. Return to listings page.</p>
        <button onClick={() => setStep('results')} className="mt-4 bg-orange-600 text-white px-4 py-2 rounded-xl text-xs">
          Return to Flights
        </button>
      </div>
    );
  }

  // Handle seat clicks with OPTIMISTIC update flow (Task 04)
  const handleSeatClick = async (seat: Seat) => {
    if (!seat.is_available) return;

    const isSelected = selectedSeats.some(s => s.id === seat.id);
    let newSelected: Seat[];

    if (isSelected) {
      newSelected = selectedSeats.filter(s => s.id !== seat.id);
    } else {
      if (selectedSeats.length < passengerCount) {
        newSelected = [...selectedSeats, seat];
      } else {
        // Equal to passengerCount, replace oldest/first selection
        if (passengerCount === 1) {
          newSelected = [seat];
        } else {
          newSelected = [...selectedSeats.slice(1), seat];
        }
      }
    }

    // Mark as selected optimistically in the local component and Zustand state
    setOptimisticSeat(seat.id);
    setSelectedSeats(newSelected);
    
    // Simulate brief network latency for the RPC transaction
    setLoading(true);
    await new Promise(resolve => setTimeout(resolve, 250));
    setLoading(false);
    setOptimisticSeat(null);
  };

  // Organize seats by row
  const seatsByRow: Record<number, Seat[]> = {};
  seats.forEach((seat) => {
    const rowMatch = seat.seat_number.match(/^(\d+)/);
    if (rowMatch) {
      const rowNum = parseInt(rowMatch[1], 10);
      if (!seatsByRow[rowNum]) {
        seatsByRow[rowNum] = [];
      }
      seatsByRow[rowNum].push(seat);
    }
  });

  // Sort seats in each row by column letter (Letter at tail of seat_number)
  Object.keys(seatsByRow).forEach((rowKey) => {
    const rowNum = parseInt(rowKey, 10);
    seatsByRow[rowNum].sort((a, b) => {
      const colA = a.seat_number.slice(-1);
      const colB = b.seat_number.slice(-1);
      return colA.localeCompare(colB);
    });
  });

  const rowNumbers = Object.keys(seatsByRow)
    .map(Number)
    .sort((a, b) => a - b);

  const totalSeatsCount = seats.length;
  const availableSeatsCount = seats.filter(s => s.is_available).length;

  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm flex flex-col xl:flex-row gap-8">
      {/* Flight Detail summary + pricing info panel */}
      <div className="xl:w-80 flex flex-col justify-between gap-6 border-b xl:border-b-0 xl:border-r border-slate-100 pb-6 xl:pb-0 xl:pr-6">
        <div>
          <button
            onClick={() => setStep('results')}
            className="flex items-center gap-1.5 text-slate-500 hover:text-orange-500 text-xs font-semibold uppercase tracking-wider transition mb-4 cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to flights
          </button>

          <span className="font-mono text-xs font-bold text-slate-400 block uppercase tracking-widest">{selectedFlight.flight_no}</span>
          <h2 className="text-xl font-bold text-slate-900 mt-1">{selectedFlight.origin} to {selectedFlight.destination}</h2>
          
          <div className="bg-slate-50 border border-slate-100 p-4 rounded-xl mt-4 space-y-2.5">
            <div className="flex justify-between text-xs">
              <span className="text-slate-500 font-medium">Aircraft Model:</span>
              <span className="text-slate-800 font-bold">{selectedFlight.aircraft_type}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-slate-500 font-medium">Lounge Seats Total:</span>
              <span className="text-slate-850 font-semibold font-mono">{totalSeatsCount} Available</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-slate-500 font-medium">Free Remaining:</span>
              <span className="text-emerald-600 font-bold font-mono">{availableSeatsCount} left</span>
            </div>
          </div>
        </div>

        {/* Legend */}
        <div className="space-y-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Seat Suite Legends</h4>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="flex items-center gap-2">
              <span className="w-4 h-4 rounded bg-emerald-50 border border-emerald-300 inline-block"></span>
              <span className="text-slate-600 font-medium">Available</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-4 h-4 rounded bg-orange-500 border border-orange-600 inline-block"></span>
              <span className="text-slate-600 font-medium">Optimistic Lock</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-4 h-4 rounded bg-slate-100 border border-slate-200 inline-block"></span>
              <span className="text-slate-400 font-medium">Occupied</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-4 h-4 rounded bg-indigo-650 border border-indigo-700 inline-block"></span>
              <span className="text-slate-900 font-bold">Your Selection</span>
            </div>
          </div>

          <div className="border-t border-slate-100 pt-4 space-y-2 text-xs">
            <div className="flex items-center gap-2 text-amber-700 bg-amber-50/70 border border-amber-100 rounded-lg p-2.5">
              <Sparkles className="w-4 h-4 text-amber-600 shrink-0" />
              <span><b>First Zone</b>: Rows 1-2 (+ $150.00 surcharge)</span>
            </div>
            <div className="flex items-center gap-2 text-sky-700 bg-sky-50/70 border border-sky-100 rounded-lg p-2.5">
              <Gem className="w-4 h-4 text-sky-600 shrink-0" />
              <span><b>Business Lounge</b>: Rows 3-4 (+ $75.00 surcharge)</span>
            </div>
          </div>
        </div>

        {/* Selected Seat Checkout details */}
        <div className="border-t border-slate-100 pt-4">
          {selectedSeats.length > 0 ? (
            <div className="space-y-4">
              <div className="bg-indigo-50 border border-indigo-150 rounded-xl p-4 text-xs">
                <div className="flex justify-between font-bold text-indigo-950 mb-2 items-center">
                  <span className="flex items-center gap-1.5 font-bold uppercase tracking-wide">
                    <Armchair className="w-4 h-4 text-indigo-600" /> Suites Chosen ({selectedSeats.length} of {passengerCount})
                  </span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono ${selectedSeats.length === passengerCount ? 'bg-emerald-600 text-white' : 'bg-amber-500 text-white animate-pulse'}`}>
                    {selectedSeats.length === passengerCount ? 'COMPLETE' : `${selectedSeats.length}/${passengerCount}`}
                  </span>
                </div>
                
                <div className="space-y-1.5 max-h-32 overflow-y-auto pr-1 mb-2.5">
                  {selectedSeats.map((seat) => (
                    <div key={seat.id} className="flex justify-between items-center bg-white/70 dark:bg-slate-900/40 p-1.5 rounded-lg border border-indigo-100/50">
                      <span className="font-mono font-bold text-indigo-900">Suite {seat.seat_number} <span className="text-[10px] font-normal text-indigo-600 italic">({seat.class})</span></span>
                      <span className="font-mono text-indigo-900 font-bold">${(Number(selectedFlight.base_price) + seat.extra_fee).toFixed(2)}</span>
                    </div>
                  ))}
                </div>

                <div className="mt-3 space-y-1 text-indigo-850 pt-2 border-t border-indigo-200/50">
                  <div className="flex justify-between">
                    <span>Base Fare ({selectedSeats.length} pax):</span>
                    <span className="font-mono">${(Number(selectedFlight.base_price) * selectedSeats.length).toFixed(2)}</span>
                  </div>
                  {selectedSeats.reduce((sum, s) => sum + s.extra_fee, 0) > 0 && (
                    <div className="flex justify-between">
                      <span>Lounge Upgrades:</span>
                      <span className="font-mono text-amber-700 font-semibold">+ ${selectedSeats.reduce((sum, s) => sum + s.extra_fee, 0).toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-extrabold border-t border-indigo-200/50 pt-1.5 mt-1.5 text-indigo-900 text-xs md:text-sm">
                    <span>Grand Total:</span>
                    <span className="font-mono text-orange-600 font-black text-sm md:text-md">
                      ${(Number(selectedFlight.base_price) * selectedSeats.length + selectedSeats.reduce((sum, s) => sum + s.extra_fee, 0)).toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>

              {selectedSeats.length < passengerCount && (
                <div className="bg-amber-50 border border-amber-200 text-amber-800 rounded-lg p-2.5 text-[11px] font-medium leading-normal animate-fade-in">
                  💡 Select <b>{passengerCount - selectedSeats.length} more seat(s)</b> on the map below for all {passengerCount} travelers to unlock checkout.
                </div>
              )}

              <button
                onClick={() => setStep('form')}
                disabled={selectedSeats.length !== passengerCount || loading}
                className="w-full bg-slate-900 hover:bg-orange-600 text-white font-bold py-3.5 px-4 rounded-xl shadow-md transition hover:shadow-lg active:scale-98 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {loading ? 'Securing Seat Suites...' : selectedSeats.length === passengerCount ? 'Next: Passenger Info' : `Select ${passengerCount - selectedSeats.length} more seat(s)`}
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 text-center">
              <p className="text-slate-400 text-xs py-2 font-medium">Please click and select exact {passengerCount} armchair seat suite(s) on the cabin grid below</p>
            </div>
          )}
        </div>
      </div>

      {/* Seating Fuselage visual column */}
      <div className="flex-1 flex flex-col items-center">
        <div className="w-full max-w-lg bg-slate-50 border border-slate-200 rounded-t-[140px] rounded-b-3xl p-6 relative shadow-inner overflow-x-auto touch-pan-x select-none">
          {/* Plane Cockpit Head */}
          <div className="text-center py-6 mb-8 border-b border-dashed border-slate-200">
            <span className="text-[10px] text-slate-450 uppercase tracking-widest font-mono font-bold">Cockpit / Nose Section</span>
            <div className="flex justify-center gap-1.5 mt-2">
              <span className="w-2.5 h-1 bg-slate-350 rounded-full"></span>
              <span className="w-8 h-1 bg-slate-400 rounded-full"></span>
              <span className="w-2.5 h-1 bg-slate-350 rounded-full"></span>
            </div>
          </div>

          {/* Fuselage body scroll container */}
          <div className="min-w-[280px] space-y-4 pb-8">
            {rowNumbers.map((rowNum) => {
              const rowSeats = seatsByRow[rowNum];
              const isFirstClass = rowSeats[0]?.class === 'first';
              const isBusiness = rowSeats[0]?.class === 'business';

              return (
                <div key={rowNum} className="space-y-1">
                  {/* Category separator overlays */}
                  {rowNum === 1 && (
                    <div className="text-center py-1 mb-2 bg-amber-50/60 border border-amber-300/30 rounded-md text-[9px] uppercase tracking-wider font-extrabold text-amber-700 flex items-center justify-center gap-1">
                      <Sparkles className="w-3.5 h-3.5" /> First Zone Cabin
                    </div>
                  )}
                  {rowNum === 3 && (
                    <div className="text-center py-1 my-2 bg-sky-50/60 border border-sky-300/30 rounded-md text-[9px] uppercase tracking-wider font-extrabold text-sky-700 flex items-center justify-center gap-1">
                      <Gem className="w-3.5 h-3.5" /> Business Lounge Cabin
                    </div>
                  )}
                  {rowNum === 5 && (
                    <div className="text-center py-1 my-2 bg-slate-150 border border-slate-300/30 rounded-md text-[9px] uppercase tracking-wider font-extrabold text-slate-600 flex items-center justify-center gap-1">
                      Economy Cabin
                    </div>
                  )}

                  {/* Seat matrix row layout with proper middle aisles */}
                  <div className="flex items-center justify-between gap-1">
                    {/* Row Indicator at left */}
                    <span className="w-6 font-mono font-bold text-slate-400 text-xs text-center">{rowNum}</span>
                    
                    {/* Seating Columns splits */}
                    <div className="flex-1 flex items-center justify-center gap-1">
                      {rowSeats.map((seat, seatIdx) => {
                        const isSelected = selectedSeats.some(s => s.id === seat.id);
                        const isOptimistic = optimisticSelectedSeatId === seat.id;
                        
                        // Class styling classes
                        const classBg = 
                          isSelected ? 'bg-indigo-650 text-white border-indigo-705 shadow-md shadow-indigo-600/20' :
                          isOptimistic ? 'bg-orange-500 text-white border-orange-600 animate-pulse' :
                          !seat.is_available ? 'bg-slate-100 text-slate-300 border-slate-205 cursor-not-allowed group' :
                          seat.class === 'first' ? 'bg-amber-50 hover:bg-amber-100 text-amber-800 border-amber-300 hover:border-amber-400' :
                          seat.class === 'business' ? 'bg-sky-50 hover:bg-sky-100 text-sky-800 border-sky-300 hover:border-sky-400' :
                          'bg-white hover:bg-emerald-50 text-slate-700 border-slate-200 hover:border-emerald-400';

                        // Check if seat index matches the aisle split
                        const isAisleSplice = 
                          (isFirstClass || isBusiness) ? (seatIdx === 1) : (seatIdx === 2);

                        return (
                          <div key={seat.id} className="flex items-center gap-1">
                            {/* Handcrafted Armchair button with HTML IDs for automated target selectors */}
                            <button
                              id={`seat-bt-${seat.seat_number}`}
                              type="button"
                              onClick={() => handleSeatClick(seat)}
                              disabled={!seat.is_available}
                              className={`w-9 h-9 md:w-10 md:h-10 rounded-lg border font-mono text-xs font-bold flex flex-col items-center justify-center relative transition transition-all cursor-pointer ${classBg}`}
                           >
                              <span>{seat.seat_number}</span>
                              
                              {/* Native Tooltip on hover/disabled (Fulfills Task 02.5: Occupied with tooltips) */}
                              {!seat.is_available && (
                                <div className="hidden group-hover:block absolute bottom-11 bg-slate-900 text-white text-[10px] px-2 py-1 rounded shadow-lg pointer-events-none z-50 whitespace-nowrap leading-tight">
                                  <span className="font-bold underline uppercase">{seat.class} Class</span><br />
                                  <span>Unavailable</span><br />
                                  <span>Extra Fee: + ${seat.extra_fee.toFixed(2)}</span>
                                </div>
                              )}
                            </button>

                            {/* Center Runway Aisle spacer */}
                            {isAisleSplice && <div className="w-5 pr-2 pl-2 text-[9px] font-mono text-slate-350 text-center select-none">│</div>}
                          </div>
                        );
                      })}
                    </div>

                    <span className="w-6 font-mono font-bold text-slate-400 text-xs text-center">{rowNum}</span>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="text-center py-4 border-t border-slate-200 mt-6 md:my-4">
            <span className="text-[10px] text-slate-450 uppercase tracking-widest font-mono font-bold">Tail / Galley Section</span>
          </div>
        </div>
      </div>
    </div>
  );
}
