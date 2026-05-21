import { useState, useEffect, FormEvent } from 'react';
import { useFlightStore, useUserStore, rehydrateUserSession } from './store';
import { dbSim } from './supabaseSim';
import SearchPage from './components/SearchPage';
import ResultsPage from './components/ResultsPage';
import SeatMap from './components/SeatMap';
import PassengerFormPage from './components/PassengerFormPage';
import ConfirmationPage from './components/ConfirmationPage';
import MyBookingsPage from './components/MyBookingsPage';
import SupabaseTerminal from './components/SupabaseTerminal';
import { Plane, User, Calendar, ShieldCheck, CreditCard, RefreshCw, LogIn, ExternalLink, Moon, Sun } from 'lucide-react';
import { supabase, isSupabaseConfigured } from './supabaseClient';

export default function App() {
  const { currentStep, setStep } = useFlightStore();
  const { user, login, logout } = useUserStore();
  const [activeTab, setActiveTab] = useState<'booking' | 'bookings'>('booking');
  const [sessionEmailInput, setSessionEmailInput] = useState('user@aeroflow.com');
  const [isThemeDark, setIsThemeDark] = useState(false);

  // Rehydrate or login default guest on mount
  useEffect(() => {
    rehydrateUserSession();
    
    // Bind global tab toggle helper for confirmation redirects
    (window as any).setActiveAppTab = (tab: 'booking' | 'bookings') => {
      setActiveTab(tab);
    };

    return () => {
      delete (window as any).setActiveAppTab;
    };
  }, []);

  const handleUserSwap = (email: string) => {
    setSessionEmailInput(email);
    login(email);
  };

  const handleCustomLoginSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!sessionEmailInput.trim()) return;

    // Try Supabase auth if configured, otherwise use simulation
    if (isSupabaseConfigured()) {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: sessionEmailInput.trim(),
        password: 'test1234'
      });
      if (data?.user?.email) {
        login(data.user.email);
        return;
      }
      // If Supabase login fails, fall back to simulation mode
      if (error) console.warn('Supabase auth failed, using simulation:', error.message);
    }
    login(sessionEmailInput.trim());
  };

  return (
    <div className={`min-h-screen font-sans antialiased transition duration-200 ${
      isThemeDark ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'
    }`}>
      {/* Top Banner Notice regarding PWA compliance */}
      <div className="bg-indigo-600 text-white py-2 px-4 text-center text-xs font-semibold flex items-center justify-center gap-2">
        <span className="bg-white/20 px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider">Installable PWA</span>
        <span>Configured offline manifest caches and PWA standalone parameters!</span>
      </div>

      {/* Main App Bar Wrapper */}
      <header className={`border-b sticky top-0 z-40 backdrop-blur-md ${
        isThemeDark ? 'bg-slate-900/80 border-slate-800' : 'bg-white/80 border-slate-100'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="bg-orange-600 text-white p-2.5 rounded-xl shadow-md">
              <Plane className="w-5 h-5 rotate-45" />
            </div>
            <div>
              <h1 className="text-base font-black tracking-tight leading-none text-orange-600">AeroFlow</h1>
              <span className="text-[10px] text-slate-400 font-mono font-medium block mt-1 tracking-wider uppercase">Flight Center</span>
            </div>
          </div>

          {/* Navigation Tab Buttons */}
          <nav className="hidden md:flex items-center gap-1 bg-slate-100 dark:bg-slate-900/50 p-1 rounded-xl">
            <button
              onClick={() => { setActiveTab('booking'); }}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'booking'
                  ? 'bg-slate-900 text-white dark:bg-slate-800 shadow-sm'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <Calendar className="w-4 h-4" />
              Book Flight
            </button>
            <button
              onClick={() => { setActiveTab('bookings'); }}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'bookings'
                  ? 'bg-slate-900 text-white dark:bg-slate-800 shadow-sm'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <CreditCard className="w-4 h-4" />
              My Bookings
              {user && dbSim.getBookingsForUser(user.id).length > 0 && (
                <span className="bg-orange-500 text-white text-[9px] px-1.5 py-0.5 rounded-full font-black leading-none shrink-0">
                  {dbSim.getBookingsForUser(user.id).length}
                </span>
              )}
            </button>
          </nav>

          {/* User Session Switcher (Demonstrating RLS Row level security live!) */}
          <div className="flex items-center gap-3">
            {user ? (
              <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-900 p-1.5 rounded-xl border border-slate-201 dark:border-slate-800">
                <div className="w-7 h-7 rounded-lg bg-orange-100 dark:bg-orange-950 text-orange-600 flex items-center justify-center font-bold text-xs">
                  {user.email.substring(0, 1).toUpperCase()}
                </div>
                <div className="hidden lg:block text-left text-[10px] leading-tight pr-2">
                  <span className="text-slate-400 block font-mono font-bold uppercase">Active Identity</span>
                  <select
                    value={user.email}
                    onChange={(e) => handleUserSwap(e.target.value)}
                    className="text-slate-850 dark:text-slate-200 font-bold bg-transparent border-none p-0 focus:outline-none focus:ring-0 text-[11px] cursor-pointer"
                  >
                    <option value="user@aeroflow.com">user@aeroflow.com</option>
                    <option value="user@example.com">user@example.com</option>
                  </select>
                </div>
                <button
                  onClick={logout}
                  className="text-slate-400 hover:text-rose-500 dark:hover:text-rose-400 text-xs font-bold px-2 py-1 select-none cursor-pointer"
                  title="Logout flight session"
                >
                  Clear
                </button>
              </div>
            ) : (
              <form onSubmit={handleCustomLoginSubmit} className="flex items-center gap-1.5">
                <input
                  type="email"
                  required
                  placeholder="Reviewer Email"
                  value={sessionEmailInput}
                  onChange={(e) => setSessionEmailInput(e.target.value)}
                  className="bg-slate-50 border border-slate-200 focus:bg-white text-slate-900 rounded-lg px-2 py-1 text-xs focus:ring-1 focus:ring-orange-500 focus:outline-none"
                />
                <button
                  type="submit"
                  className="bg-slate-900 hover:bg-orange-600 text-white rounded-lg px-2.5 py-1 text-xs font-bold transition flex items-center gap-1"
                >
                  <LogIn className="w-3.5 h-3.5" /> Login
                </button>
              </form>
            )}

            {/* Dark Mode toggle */}
            <button
              onClick={() => setIsThemeDark(!isThemeDark)}
              className="p-2 rounded-full border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-900 transition text-slate-500 dark:text-slate-400 cursor-pointer"
              title="Toggle application look"
            >
              {isThemeDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Sticky Tab bar */}
      <div className={`md:hidden border-b py-2 px-4 shadow-sm flex gap-2 ${
        isThemeDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'
      }`}>
        <button
          onClick={() => setActiveTab('booking')}
          className={`flex-1 py-2 text-center text-xs font-bold rounded-xl flex items-center justify-center gap-1 transition ${
            activeTab === 'booking' ? 'bg-slate-900 text-white dark:bg-slate-800' : 'text-slate-500'
          }`}
        >
          <Calendar className="w-3.5 h-3.5" />
          Book Flight
        </button>
        <button
          onClick={() => setActiveTab('bookings')}
          className={`flex-1 py-2 text-center text-xs font-bold rounded-xl flex items-center justify-center gap-1 transition ${
            activeTab === 'bookings' ? 'bg-slate-900 text-white dark:bg-slate-805' : 'text-slate-500'
          }`}
        >
          <CreditCard className="w-3.5 h-3.5" />
          My Bookings
          {user && dbSim.getBookingsForUser(user.id).length > 0 && (
            <span className="bg-orange-500 text-white text-[9px] px-1.5 py-0.5 rounded-full font-black ml-1">
              {dbSim.getBookingsForUser(user.id).length}
            </span>
          )}
        </button>
      </div>

      {/* Main Content Layout Grid */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Main Booking/Ticket Container Area */}
          <section className="lg:col-span-8 space-y-6">
            {activeTab === 'booking' ? (
              <div>
                {/* Premium Booking Flow Progress Indicator */}
                <div className="mb-6 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-4 rounded-2xl shadow-sm">
                  <div className="flex items-center justify-between text-[10px] md:text-[11px] font-bold uppercase tracking-wider text-slate-400 select-none">
                    <span className={`transition-all duration-200 ${currentStep === 'search' ? 'text-orange-600 font-extrabold scale-105' : 'dark:text-slate-500'}`}>1. Search</span>
                    <span className="text-slate-300 dark:text-slate-700 font-normal">&rarr;</span>
                    <span className={`transition-all duration-200 ${currentStep === 'results' ? 'text-orange-600 font-extrabold scale-105' : 'dark:text-slate-500'}`}>2. Flights</span>
                    <span className="text-slate-300 dark:text-slate-700 font-normal">&rarr;</span>
                    <span className={`transition-all duration-200 ${currentStep === 'seats' ? 'text-orange-600 font-extrabold scale-105' : 'dark:text-slate-500'}`}>3. Seat Map</span>
                    <span className="text-slate-300 dark:text-slate-700 font-normal">&rarr;</span>
                    <span className={`transition-all duration-200 ${currentStep === 'form' ? 'text-orange-600 font-extrabold scale-105' : 'dark:text-slate-500'}`}>4. Passengers</span>
                    <span className="text-slate-300 dark:text-slate-700 font-normal">&rarr;</span>
                    <span className={`transition-all duration-200 ${currentStep === 'confirmation' ? 'text-orange-600 font-extrabold scale-105' : 'dark:text-slate-500'}`}>5. Confirmation</span>
                  </div>
                  <div className="w-full h-1 bg-slate-150 dark:bg-slate-800 rounded-full mt-3.5 overflow-hidden">
                    <div className="h-full bg-orange-500 transition-all duration-500 ease-out rounded-full" style={{
                      width: 
                        currentStep === 'search' ? '20%' :
                        currentStep === 'results' ? '40%' :
                        currentStep === 'seats' ? '60%' :
                        currentStep === 'form' ? '80%' : '100%'
                    }}></div>
                  </div>
                </div>

                {/* Steps Routing Router */}
                {currentStep === 'search' && <SearchPage />}
                {currentStep === 'results' && <ResultsPage />}
                {currentStep === 'seats' && <SeatMap />}
                {currentStep === 'form' && <PassengerFormPage />}
                {currentStep === 'confirmation' && <ConfirmationPage />}
              </div>
            ) : (
              <MyBookingsPage />
            )}
          </section>

          {/* Right Column: Embedded Supabase Console Developer Inspector */}
          <aside className="lg:col-span-4 space-y-6 lg:sticky lg:top-24">
            <div className="space-y-4">
              <div>
                <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-500" />
                  RLS & DB Playground
                </h3>
                <p className="text-[11px] text-slate-450 mt-1 leading-relaxed">
                  Toggle different user profiles in the upper-right corner. Our built-in simulator executes Postgres policies and trigger validations in real time!
                </p>
              </div>

              {/* Developer Terminal Console View */}
              <SupabaseTerminal />
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}
