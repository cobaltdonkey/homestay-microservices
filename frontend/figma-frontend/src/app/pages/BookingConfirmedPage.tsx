import { useNavigate, useParams } from 'react-router';
import { Navbar } from '../components/Navbar';
import { StatusBadge } from '../components/StatusBadge';
import { CheckCircle, ArrowLeft } from 'lucide-react';

export function BookingConfirmedPage() {
  const navigate = useNavigate();
  const { id } = useParams();

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      <div className="max-w-[600px] mx-auto px-6 py-8">
        {/* Back Arrow */}
        <button 
          onClick={() => navigate('/')}
          className="flex items-center gap-2 text-[#222222] hover:text-[#717171] mb-6 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="font-semibold">Back to home</span>
        </button>

        <div className="text-center">
          {/* Success Icon */}
          <div className="mb-8 flex justify-center">
            <div className="w-24 h-24 bg-[#FFF5F7] rounded-full flex items-center justify-center">
              <CheckCircle className="w-16 h-16 text-[#FF385C]" strokeWidth={2} />
            </div>
          </div>

          {/* Heading */}
          <h1 className="text-4xl font-bold text-[#222222] mb-6">
            Booking Confirmed!
          </h1>

          {/* Booking Details */}
          <div className="bg-[#F7F7F7] rounded-xl p-6 text-left space-y-4 mb-8">
            <div className="flex justify-between items-center">
              <span className="text-[#717171]">Booking ID</span>
              <span className="font-semibold text-[#222222]">BKG-20240001</span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-[#717171]">Listing</span>
              <span className="font-semibold text-[#222222]">Loft in Bugis</span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-[#717171]">Dates</span>
              <span className="font-semibold text-[#222222]">15 Jun – 18 Jun 2025</span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-[#717171]">Status</span>
              <StatusBadge status="CONFIRMED" />
            </div>
          </div>

          {/* CTA Button */}
          <button
            onClick={() => navigate('/my-trips')}
            className="w-full bg-[#FF385C] hover:bg-[#E31C5F] text-white font-semibold py-3 rounded-lg transition-colors"
          >
            View My Bookings
          </button>
        </div>
      </div>
    </div>
  );
}