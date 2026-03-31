import { useNavigate, useParams, useLocation } from 'react-router';
import { Navbar } from '../components/Navbar';
import { StatusBadge } from '../components/StatusBadge';
import { CheckCircle, Calendar, Users, Home, ArrowRight, Wallet, TrendingDown } from 'lucide-react';

const WALLET_KEY = 'secondhome_demo_wallet';
const INITIAL_BALANCE = 5000;

function getWalletBalance(): number {
  const stored = sessionStorage.getItem(WALLET_KEY);
  return stored ? parseFloat(stored) : INITIAL_BALANCE;
}

export function BookingConfirmedPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const location = useLocation();
  const state = (location.state as any) || {};

  const bookingId = state.bookingId ?? id ?? 'N/A';
  const listingTitle = state.listingTitle ?? 'Your Listing';
  const listingImage = state.listingImage ?? 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=300&q=80';
  const checkIn = state.checkIn ?? '';
  const checkOut = state.checkOut ?? '';
  const guests = state.guests ?? 1;
  const total = state.total ?? 0;
  const nights = state.nights ?? 1;
  const currentWalletBalance = getWalletBalance();

  const formatDate = (dateStr: string) => {
    if (!dateStr) return 'N/A';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#FFF5F7] to-white">
      <Navbar />

      <div className="max-w-[640px] mx-auto px-6 py-12">
        {/* Success Animation */}
        <div className="text-center mb-10">
          <div className="mb-6 flex justify-center">
            <div className="w-28 h-28 bg-white shadow-lg rounded-full flex items-center justify-center animate-bounce-once">
              <CheckCircle className="w-20 h-20 text-[#FF385C]" strokeWidth={1.5} />
            </div>
          </div>
          <h1 className="text-4xl font-bold text-[#222222] mb-2">Booking Confirmed!</h1>
          <p className="text-[#717171] text-lg">Your trip is all set. We can't wait for you to enjoy your stay.</p>
        </div>

        {/* Listing Image Banner */}
        <div className="relative rounded-2xl overflow-hidden mb-6 shadow-md h-48">
          <img src={listingImage} alt={listingTitle} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-5">
            <div>
              <p className="text-white/80 text-sm mb-1 font-medium">Your upcoming stay</p>
              <h2 className="text-white font-bold text-xl">{listingTitle}</h2>
            </div>
          </div>
        </div>

        {/* Booking Details Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-[#EBEBEB] divide-y divide-[#EBEBEB] mb-6">
          <div className="flex justify-between items-center px-6 py-4">
            <span className="text-[#717171] font-medium flex items-center gap-2">
              <Home className="w-4 h-4" /> Booking ID
            </span>
            <span className="font-semibold text-[#222222] font-mono text-sm">{bookingId}</span>
          </div>

          <div className="flex justify-between items-center px-6 py-4">
            <span className="text-[#717171] font-medium flex items-center gap-2">
              <Calendar className="w-4 h-4" /> Check-in
            </span>
            <span className="font-semibold text-[#222222]">{formatDate(checkIn)}</span>
          </div>

          <div className="flex justify-between items-center px-6 py-4">
            <span className="text-[#717171] font-medium flex items-center gap-2">
              <Calendar className="w-4 h-4" /> Check-out
            </span>
            <span className="font-semibold text-[#222222]">{formatDate(checkOut)}</span>
          </div>

          <div className="flex justify-between items-center px-6 py-4">
            <span className="text-[#717171] font-medium flex items-center gap-2">
              <Users className="w-4 h-4" /> Guests
            </span>
            <span className="font-semibold text-[#222222]">{guests} guest{guests > 1 ? 's' : ''}</span>
          </div>

          <div className="flex justify-between items-center px-6 py-4">
            <span className="text-[#717171] font-medium">Duration</span>
            <span className="font-semibold text-[#222222]">{nights} night{nights > 1 ? 's' : ''}</span>
          </div>

          <div className="flex justify-between items-center px-6 py-4">
            <span className="text-[#717171] font-medium">Total Paid</span>
            <span className="font-bold text-[#222222] text-lg">SGD {total.toLocaleString()}</span>
          </div>

          <div className="flex justify-between items-center px-6 py-4">
            <span className="text-[#717171] font-medium">Status</span>
            <StatusBadge status="CONFIRMED" />
          </div>
        </div>

          {/* Transaction Summary */}
          {total > 0 && (
            <div className="bg-gradient-to-r from-[#635BFF]/5 to-[#8B83FF]/5 border border-[#635BFF]/20 rounded-2xl p-5 mb-6">
              <h3 className="font-semibold text-[#222222] mb-3 flex items-center gap-2">
                <Wallet className="w-4 h-4 text-[#635BFF]" />
                Demo Wallet Transaction
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-[#717171]">Amount charged</span>
                  <span className="font-semibold text-[#FF385C] flex items-center gap-1">
                    <TrendingDown className="w-3 h-3" /> SGD {total.toLocaleString('en-SG', { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#717171]">Remaining balance</span>
                  <span className="font-semibold text-[#222222]">SGD {currentWalletBalance.toLocaleString('en-SG', { minimumFractionDigits: 2 })}</span>
                </div>
              </div>
            </div>
          )}

          {/* CTA Buttons */}
        <div className="space-y-3">
          <button
            onClick={() => navigate('/my-trips')}
            className="w-full bg-[#FF385C] hover:bg-[#E31C5F] text-white font-semibold py-3.5 rounded-xl transition-colors flex items-center justify-center gap-2"
          >
            View My Trips <ArrowRight className="w-4 h-4" />
          </button>
          <button
            onClick={() => navigate('/')}
            className="w-full border-2 border-[#EBEBEB] hover:border-[#222222] text-[#222222] font-semibold py-3.5 rounded-xl transition-colors"
          >
            Back to Home
          </button>
        </div>
      </div>
    </div>
  );
}