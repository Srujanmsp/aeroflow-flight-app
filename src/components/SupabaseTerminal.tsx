import { useState, useEffect } from 'react';
import { dbSim } from '../supabaseSim';
import { Terminal, Database, ShieldCheck, Flame, Zap, RefreshCw, Clock, ArrowRight } from 'lucide-react';
import { useUserStore } from '../store';

export default function SupabaseTerminal() {
  const [activeTab, setActiveTab] = useState<'console' | 'migrations' | 'tables'>('console');
  const [logs, setLogs] = useState(dbSim.dbQueryLogs);
  const [simTime, setSimTime] = useState(dbSim.simulatedTime);
  const { user } = useUserStore();

  useEffect(() => {
    // Sync logs with Supabase Simulation changes
    const unsub = dbSim.registerLogListener(() => {
      setLogs([...dbSim.dbQueryLogs]);
    });
    return unsub;
  }, []);

  const handleSimulateExternalBooking = () => {
    const seatNum = dbSim.triggerRandomExternalBooking();
    if (seatNum) {
      alert(`Simulated Action: Another user just booked seat ${seatNum} live via Supabase Realtime Real-Time Broadcast! Check the seating map!`);
    } else {
      alert('Simulation: No available future seats left to book on any flight.');
    }
  };

  const handleTimeShift = (hours: number) => {
    const newTime = new Date(simTime.getTime() + hours * 60 * 60 * 1000);
    dbSim.simulatedTime = newTime;
    setSimTime(newTime);
    dbSim.logDB(
      'SQL',
      `UPDATE simulation_clock SET current_time = '${newTime.toISOString()}';`,
      'success',
      `Simulation time fast-forwarded by ${hours} hours`
    );
  };

  const handleResetDB = () => {
    if (confirm('Are you sure you want to rollback all tables and re-run migrations (.sql)?')) {
      dbSim.resetDB();
      localStorage.removeItem('flight-store-storage');
      localStorage.removeItem('user-store-storage');
      window.location.reload();
    }
  };

  return (
    <div className="bg-slate-950 border border-slate-800 rounded-xl overflow-hidden shadow-2xl flex flex-col h-[520px]">
      {/* Terminal Header */}
      <div className="bg-slate-900 px-4 py-3 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Terminal className="w-5 h-5 text-orange-400" />
          <span className="font-mono text-xs font-semibold text-slate-200 uppercase tracking-wider">
            Supabase Developer Inspector
          </span>
          <span className="bg-emerald-950/80 border border-emerald-500/30 text-emerald-400 font-mono text-[10px] px-2 py-0.5 rounded-full flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
            Realtime Active
          </span>
        </div>

        {/* Quick controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleSimulateExternalBooking}
            className="flex items-center gap-1.5 text-xs text-amber-300 hover:text-amber-200 bg-amber-950/50 hover:bg-amber-900/50 border border-amber-500/20 px-2.5 py-1 rounded-md transition"
            title="Fire a database insert/update representing another traveler"
          >
            <Zap className="w-3.5 h-3.5 fill-amber-300" />
            Simulate External Seat Buy
          </button>
          <button
            onClick={handleResetDB}
            className="flex items-center gap-1.5 text-xs text-rose-300 hover:text-rose-200 bg-rose-950/50 hover:bg-rose-900/50 border border-rose-500/20 px-2.5 py-1 rounded-md transition"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Reset SQL DB
          </button>
        </div>
      </div>

      {/* Time & Simulation settings */}
      <div className="bg-slate-900/50 border-b border-slate-800 px-4 py-2.5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-sky-400" />
          <span className="text-slate-400 text-xs">Simulated Time:</span>
          <span className="font-mono text-sky-400 font-bold text-xs bg-sky-950/60 px-2 py-0.5 rounded-md border border-sky-900/30">
            {simTime.toLocaleDateString()} {simTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
        <div className="flex items-center gap-1 text-xs">
          <span className="text-slate-500">Fast-Forward:</span>
          <button
            onClick={() => handleTimeShift(1)}
            className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-2 py-1 rounded text-[11px] font-mono"
            title="Fast forward 1 hour"
          >
            +1h
          </button>
          <button
            onClick={() => handleTimeShift(12)}
            className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-2 py-1 rounded text-[11px] font-mono"
            title="Fast forward 12 hours"
          >
            +12h
          </button>
          <button
            onClick={() => handleTimeShift(24)}
            className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-2 py-1 rounded text-[11px] font-mono"
            title="Fast forward 24 hours"
          >
            +1d
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-slate-900/20 flex border-b border-slate-800 text-xs font-mono">
        <button
          onClick={() => setActiveTab('console')}
          className={`flex-1 py-2.5 text-center transition border-b-2 ${
            activeTab === 'console'
              ? 'border-orange-500 text-orange-400 bg-slate-900/40'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <div className="flex items-center justify-center gap-1.5">
            <Terminal className="w-3.5 h-3.5" />
            Interactive Logs
          </div>
        </button>
        <button
          onClick={() => setActiveTab('migrations')}
          className={`flex-1 py-2.5 text-center transition border-b-2 ${
            activeTab === 'migrations'
              ? 'border-orange-500 text-orange-400 bg-slate-900/40'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <div className="flex items-center justify-center gap-1.5">
            <Database className="w-3.5 h-3.5" />
            Postres SQL Schema
          </div>
        </button>
        <button
          onClick={() => setActiveTab('tables')}
          className={`flex-1 py-2.5 text-center transition border-b-2 ${
            activeTab === 'tables'
              ? 'border-orange-500 text-orange-400 bg-slate-900/40'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <div className="flex items-center justify-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5" />
            Security & RLS status
          </div>
        </button>
      </div>

      {/* Content panes */}
      <div className="flex-1 overflow-y-auto p-4 font-mono text-xs text-slate-350">
        {activeTab === 'console' && (
          <div className="space-y-3">
            <div className="text-slate-500 text-[11px] mb-2 border-b border-slate-900 pb-1 flex justify-between">
              <span>-- SQL QUERY, TRIGGER FIRED AND PUB/SUB TRANSMISSIONS --</span>
              <span>USER ID: {user?.id || 'GUEST'}</span>
            </div>
            {logs.length === 0 ? (
              <p className="text-slate-500 italic p-4 text-center">No transactions registered yet. Perform search, book, or cancel to see logs live here!</p>
            ) : (
              logs.map((log, index) => (
                <div key={index} className="border-l-2 pl-3 pb-1 border-slate-800 hover:border-slate-600 transition">
                  <div className="flex items-center justify-between text-[11px] mb-1">
                    <span className="flex items-center gap-1.5 font-bold">
                      {log.type === 'TRIGGER' && <Flame className="w-3.5 h-3.5 text-rose-400" />}
                      {log.type === 'RPC' && <Zap className="w-3.5 h-3.5 text-amber-400" />}
                      {log.type === 'RLS' && <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />}
                      {log.type === 'SQL' && <Database className="w-3.5 h-3.5 text-sky-400" />}
                      {log.type === 'REALTIME' && <RefreshCw className="w-3.5 h-3.5 text-indigo-400 animate-spin" style={{ animationDuration: '4s' }} />}
                      <span className={`px-1 py-0.2 rounded text-[10px] ${
                        log.type === 'TRIGGER' ? 'bg-rose-950/60 text-rose-300' :
                        log.type === 'RPC' ? 'bg-amber-950/60 text-amber-300' :
                        log.type === 'RLS' ? 'bg-emerald-950/60 text-emerald-300' :
                        log.type === 'REALTIME' ? 'bg-indigo-950/60 text-indigo-300' : 'bg-slate-800 text-sky-300'
                      }`}>
                        {log.type}
                      </span>
                    </span>
                    <span className="text-slate-500">{log.timestamp}</span>
                  </div>
                  <div className="bg-slate-900/60 p-2 rounded-md border border-slate-900 text-slate-300 font-medium overflow-x-auto whitespace-pre-wrap">
                    {log.statement}
                  </div>
                  {log.details && (
                    <div className="text-[11px] text-slate-500 mt-1 pl-1">
                      ↪ {log.details}
                    </div>
                  )}
                  {log.status === 'error' && (
                    <div className="bg-rose-950/30 border border-rose-900/30 text-rose-400 p-2 rounded mt-1 text-[11px]">
                      ERROR: Transaction Rolled Back automatically. Constraint Trigger Violated.
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'migrations' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center text-[10px] text-slate-500 border-b border-slate-900 pb-2">
              <span>MIGRATION DIRECTORY: /supabase/migrations</span>
              <span>POSTGRESQL 15</span>
            </div>
            <div>
              <h4 className="text-orange-400 font-bold mb-1 text-xs">📄 20260520000001_initial_schema.sql</h4>
              <p className="text-slate-400 text-xs mb-2">DeclaresFlights, Seats, Bookings, Passengers tables with foreign key relation models and defaults.</p>
              <pre className="bg-slate-900/80 p-3 rounded-md border border-slate-800 text-slate-350 max-h-40 overflow-y-auto text-[11px]">
{`CREATE TABLE flights (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    flight_no VARCHAR(10) NOT NULL UNIQUE,
    origin VARCHAR(100) NOT NULL,
    destination VARCHAR(100) NOT NULL,
    departs_at TIMESTAMPTZ NOT NULL,
    base_price DECIMAL(10, 2) NOT NULL
);

CREATE TABLE seats (
    id UUID PRIMARY KEY...
    flight_id UUID REFERENCES flights(id) ON DELETE CASCADE,
    seat_number VARCHAR(5) NOT NULL,
    class VARCHAR(20) NOT NULL CHECK (class IN ('economy', 'business', 'first')),
    is_available BOOLEAN NOT NULL DEFAULT TRUE,
    extra_fee DECIMAL(10,2) NOT NULL
);`}
              </pre>
            </div>

            <div>
              <h4 className="text-orange-400 font-bold mb-1 text-xs">📄 20260520000002_triggers_and_rpcs.sql</h4>
              <p className="text-slate-400 text-xs mb-2">Handles crucial DB safety constraints: the atomic transactional `reserve_seat_and_book` RPC and departure check triggers.</p>
              <pre className="bg-slate-900/80 p-3 rounded-md border border-slate-800 text-slate-350 max-h-40 overflow-y-auto text-[11px]">
{`CREATE OR REPLACE FUNCTION check_booking_cancellation_time()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'cancelled' AND OLD.status != 'cancelled' THEN
        SELECT departs_at INTO flight_departure FROM flights WHERE id = NEW.flight_id;
        IF (flight_departure - NOW()) < INTERVAL '2 hours' THEN
            RAISE EXCEPTION 'Booking cancellation rejected: Cannot cancel within 2 hours of departure';
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;`}
              </pre>
            </div>
          </div>
        )}

        {activeTab === 'tables' && (
          <div className="space-y-4">
            <div className="bg-slate-900 p-3 rounded-md border border-slate-800 space-y-2">
              <div className="flex justify-between items-center pb-1 border-b border-slate-800 text-xs font-bold text-slate-300">
                <span>Row Level Security Policies</span>
                <span className="text-emerald-400 font-bold">ENABLED</span>
              </div>
              <ul className="text-xs space-y-1.5 text-slate-400 list-disc list-inside">
                <li><b className="text-slate-300">flights:</b> Anyone can select flight items publically.</li>
                <li><b className="text-slate-300">seats:</b> Public select enabled (live grids); modification limited to system RPC triggers.</li>
                <li><b className="text-slate-300">bookings:</b> Users can select, insert, or update ONLY rows where <code className="text-orange-400">user_id = auth.uid()</code>.</li>
                <li><b className="text-slate-300">passengers:</b> Users can view/create passenger rows ONLY for bookings that belong to them.</li>
              </ul>
            </div>

            <div className="bg-slate-900 p-3 rounded-md border border-slate-800 space-y-2">
              <div className="flex justify-between items-center pb-1 border-b border-slate-800 text-xs font-bold text-slate-300">
                <span>Race Condition Resolution (RPC)</span>
                <span className="text-amber-400 font-bold">TRANSACTION LOCKED</span>
              </div>
              <p className="text-xs leading-relaxed text-slate-400">
                To prevent double booking, the client does not insert directly into Bookings. It instead executes the <code className="text-amber-400">reserve_seat_and_book()</code> RPC.
                This performs a <code className="text-amber-400">SELECT ... FOR UPDATE</code> on the seat row, locking it instantly from other users until the booking is confirmed and seat is marked as unavailable.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
