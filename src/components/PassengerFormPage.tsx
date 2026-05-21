import { useState, FormEvent } from 'react';
import { useFlightStore, useUserStore } from '../store';
import { dbSim } from '../supabaseSim';
import { PassengerForm } from '../types';
import { ArrowLeft, User, FileText, Globe, Calendar, AlertCircle, Armchair } from 'lucide-react';

export default function PassengerFormPage() {
  const { selectedFlight, selectedSeats, passengerForm, setPassengerForm, setStep } = useFlightStore();
  const { user, addCachedBooking } = useUserStore();

  // Create individual forms state for each selected seat
  const [passengersData, setPassengersData] = useState<PassengerForm[]>(() => {
    return selectedSeats.map((seat, index) => {
      // Prepop first slot with saved form if present
      if (index === 0 && passengerForm.fullName) {
        return {
          fullName: passengerForm.fullName,
          passportNo: passengerForm.passportNo,
          nationality: passengerForm.nationality,
          dob: passengerForm.dob
        };
      }
      return { fullName: '', passportNo: '', nationality: '', dob: '' };
    });
  });
  
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (!selectedFlight || selectedSeats.length === 0) {
    return (
      <div className="text-center p-8 bg-white border border-slate-100 rounded-2xl">
        <p className="text-slate-500">Missing booking selections. Return to flight lookup.</p>
        <button onClick={() => setStep('search')} className="mt-4 bg-orange-600 text-white px-4 py-2 rounded-xl text-xs font-bold cursor-pointer">
          Return to Search
        </button>
      </div>
    );
  }

  const handleBack = () => {
    // Save first slot back to store
    if (passengersData[0]) {
      setPassengerForm(passengersData[0]);
    }
    setStep('seats');
  };

  const handleFieldChange = (index: number, field: keyof PassengerForm, value: string) => {
    setPassengersData(prev => prev.map((form, i) => i === index ? { ...form, [field]: value } : form));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!user) {
      setErrorMsg('You must be logged in to submit a booking.');
      return;
    }

    // Check if any passenger fields are empty
    for (let i = 0; i < passengersData.length; i++) {
      const pax = passengersData[i];
      if (!pax.fullName || !pax.passportNo || !pax.nationality || !pax.dob) {
        setErrorMsg(`Please fill out all passenger details for Passenger #${i + 1}.`);
        return;
      }
    }

    setLoading(true);
    setErrorMsg(null);

    try {
      // 1. Generate a single shared PNR code for all travelers in this booking itinerary!
      const randChr = () => String.fromCharCode(65 + Math.floor(Math.random() * 26));
      const randNum = () => Math.floor(Math.random() * 10).toString(10);
      const generatedPnr = `${randChr()}${randChr()}${randNum()}${randNum()}${randChr()}${randChr()}`;

      // 2. Atomic bookings for each selected seat
      for (let i = 0; i < selectedSeats.length; i++) {
        const seat = selectedSeats[i];
        const pax = passengersData[i];
        const totalPrice = Number(selectedFlight.base_price) + Number(seat.extra_fee);

        if (i === 0) {
          setPassengerForm({ fullName: pax.fullName, passportNo: pax.passportNo, nationality: pax.nationality, dob: pax.dob });
        }

        const booking = dbSim.reserve_seat_and_book(
          user.id,
          selectedFlight.id,
          seat.id,
          totalPrice,
          generatedPnr,
          pax.fullName,
          pax.passportNo,
          pax.nationality,
          pax.dob
        );

        // Find and add passenger details
        const passenger = dbSim.getPassengerForBooking(booking.id, user.id);
        if (passenger) {
          addCachedBooking(booking, passenger);
        }
      }

      // 3. Move forward to Confirmation
      setStep('confirmation');
    } catch (err: any) {
      setErrorMsg(err.message || 'Seat selection exception: One of your selected seats gets booked or is locked.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-6 md:p-8 shadow-sm max-w-2xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-4 mb-6 gap-3">
        <div>
          <button
            onClick={handleBack}
            className="flex items-center gap-1 text-slate-500 hover:text-orange-500 text-xs font-bold cursor-pointer uppercase tracking-wider transition"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to seat map
          </button>
          <h2 className="text-xl font-bold text-slate-900 mt-2">Traveler Documents</h2>
        </div>
        <div className="bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-150 text-[11px] text-slate-600 font-mono font-bold self-start">
          Seats Chosen: <span className="text-orange-600 font-black">{selectedSeats.map(s => s.seat_number).join(', ')}</span>
        </div>
      </div>

      {errorMsg && (
        <div className="bg-rose-50 border border-rose-200 text-rose-700 p-4 rounded-xl text-xs flex items-start gap-2.5 mb-6">
          <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold uppercase tracking-wider block mb-1">Reservation Aborted</span>
            {errorMsg}
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="space-y-6">
          {selectedSeats.map((seat, idx) => (
            <div key={seat.id} className="border border-slate-150 rounded-2xl p-5 bg-slate-50/50 space-y-4 shadow-sm relative overflow-hidden">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                <h3 className="text-xs font-bold text-indigo-900 uppercase tracking-widest flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-indigo-600" /> Traveler #{idx + 1}
                </h3>
                <span className="bg-indigo-600 text-white rounded px-2 py-0.5 text-[10px] font-mono font-extrabold flex items-center gap-1 shadow-sm shrink-0">
                  <Armchair className="w-3 h-3" /> Suite {seat.seat_number}
                </span>
              </div>

              {/* Full Name */}
              <div>
                <label className="block text-[10px] font-bold text-slate-400 mb-1.5 uppercase tracking-wider">Full Legal Name (as in passport)</label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                    <User className="w-4 h-4" />
                  </span>
                  <input
                    type="text"
                    required
                    placeholder={`Traveler ${idx + 1} full name`}
                    value={passengersData[idx]?.fullName || ''}
                    onChange={(e) => handleFieldChange(idx, 'fullName', e.target.value)}
                    className="w-full bg-white border border-slate-200 focus:border-orange-500 text-slate-900 rounded-xl py-2.5 pl-11 pr-4 text-xs font-semibold focus:ring-1 focus:ring-orange-500 focus:outline-none transition leading-tight"
                  />
                </div>
              </div>

              {/* Passport No */}
              <div>
                <label className="block text-[10px] font-bold text-slate-400 mb-1.5 uppercase tracking-wider">Passport Number</label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                    <FileText className="w-4 h-4" />
                  </span>
                  <input
                    type="text"
                    required
                    placeholder="e.g. L9382049"
                    value={passengersData[idx]?.passportNo || ''}
                    onChange={(e) => handleFieldChange(idx, 'passportNo', e.target.value)}
                    className="w-full bg-white border border-slate-200 focus:border-orange-500 text-slate-900 rounded-xl py-2.5 pl-11 pr-4 text-xs font-mono font-medium focus:ring-1 focus:ring-orange-500 focus:outline-none transition leading-tight"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Nationality */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 mb-1.5 uppercase tracking-wider">Nationality</label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                      <Globe className="w-4 h-4" />
                    </span>
                    <input
                      type="text"
                      required
                      placeholder="e.g. India"
                      value={passengersData[idx]?.nationality || ''}
                      onChange={(e) => handleFieldChange(idx, 'nationality', e.target.value)}
                      className="w-full bg-white border border-slate-200 focus:border-orange-500 text-slate-900 rounded-xl py-2.5 pl-11 pr-4 text-xs font-semibold focus:ring-1 focus:ring-orange-500 focus:outline-none transition leading-tight"
                    />
                  </div>
                </div>

                {/* Date of Birth */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 mb-1.5 uppercase tracking-wider">Date of Birth</label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                      <Calendar className="w-4 h-4" />
                    </span>
                    <input
                      type="date"
                      required
                      value={passengersData[idx]?.dob || ''}
                      onChange={(e) => handleFieldChange(idx, 'dob', e.target.value)}
                      className="w-full bg-white border border-slate-200 focus:border-orange-500 text-slate-900 rounded-xl py-2.5 pl-11 pr-4 text-xs font-semibold focus:ring-1 focus:ring-orange-500 focus:outline-none transition cursor-pointer leading-tight"
                    />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-orange-600 hover:bg-orange-700 text-white font-bold py-3.5 px-6 rounded-xl shadow-md transition hover:shadow-lg disabled:opacity-50 active:scale-98 flex items-center justify-center gap-2 cursor-pointer mt-6"
        >
          {loading ? 'Executing Relational Transactions RPC...' : `Book ${selectedSeats.length} Flight Seats & Generate Shared PNR`}
        </button>
      </form>
    </div>
  );
}
