import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { Navbar } from '../components/Navbar';
import { StatusBadge } from '../components/StatusBadge';
import { Clock, ArrowLeft } from 'lucide-react';

export function RequestSentPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [timeRemaining, setTimeRemaining] = useState({ hours: 23, minutes: 59, seconds: 50 });

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeRemaining(prev => {
        // Count down seconds
        if (prev.seconds > 0) {
          return { ...prev, seconds: prev.seconds - 1 };
        } else if (prev.minutes > 0) {
          return { ...prev, minutes: prev.minutes - 1, seconds: 59 };
        } else if (prev.hours > 0) {
          return { hours: prev.hours - 1, minutes: 59, seconds: 59 };
        } else {
          // Timer expired
          clearInterval(timer);
          alert('Request expired. The host did not respond within 24 hours.');
          navigate('/my-trips');
          return prev;
        }
      });
    }, 1000); // Update every second

    return () => clearInterval(timer);
  }, [navigate]);

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
          {/* Clock Icon */}
          <div className="mb-8 flex justify-center">
            <div className="w-24 h-24 bg-[#FFF5F7] rounded-full flex items-center justify-center">
              <Clock className="w-16 h-16 text-[#FF385C]" strokeWidth={2} />
            </div>
          </div>

          {/* Heading */}
          <h1 className="text-4xl font-bold text-[#222222] mb-4">
            Request Sent!
          </h1>

          {/* Status Badge */}
          <div className="flex justify-center mb-6">
            <StatusBadge status="PENDING_HOST" />
          </div>

          {/* Message */}
          <p className="text-lg text-[#717171] mb-8">
            Waiting for host to respond within 24 hours
          </p>

          {/* Countdown Timer */}
          <div className="bg-[#FFF9E6] border border-[#FFE066] rounded-xl p-6 mb-8">
            <div className="flex items-center justify-center gap-2 text-3xl font-bold text-[#222222]">
              <span>{timeRemaining.hours}h</span>
              <span className="text-[#717171]">:</span>
              <span>{timeRemaining.minutes}m</span>
              <span className="text-[#717171]">:</span>
              <span>{timeRemaining.seconds}s</span>
              <span className="text-sm font-normal text-[#717171] ml-2">remaining</span>
            </div>
          </div>

          {/* Booking Details */}
          <div className="bg-[#F7F7F7] rounded-xl p-6 text-left space-y-4 mb-8">
            <div className="flex justify-between items-center">
              <span className="text-[#717171]">Booking ID</span>
              <span className="font-semibold text-[#222222]">BKG-20240002</span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-[#717171]">Listing</span>
              <span className="font-semibold text-[#222222]">Loft in Bugis</span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-[#717171]">Dates</span>
              <span className="font-semibold text-[#222222]">15 Jun – 18 Jun 2025</span>
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