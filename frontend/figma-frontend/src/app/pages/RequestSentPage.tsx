import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { Navbar } from '../components/Navbar';
import { StatusBadge } from '../components/StatusBadge';
import { Clock, ArrowLeft } from 'lucide-react';

export function RequestSentPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [booking, setBooking] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [timeRemaining, setTimeRemaining] = useState({ hours: 23, minutes: 59, seconds: 59 });

  const calculateTimeRemaining = (targetDate: string) => {
    const total = Date.parse(targetDate) - Date.now();
    if (total <= 0) return { hours: 0, minutes: 0, seconds: 0 };
    
    const seconds = Math.floor((total / 1000) % 60);
    const minutes = Math.floor((total / 1000 / 60) % 60);
    const hours = Math.floor((total / (1000 * 60 * 60)) % 24);
    const days = Math.floor(total / (1000 * 60 * 60 * 24));
    
    return { 
      hours: hours + (days * 24), 
      minutes, 
      seconds 
    };
  };

  // Fetch real booking from backend
  useEffect(() => {
    const fetchBooking = async () => {
      if (!id) return;
      try {
        const res = await fetch(`/bookings/${id}`);
        if (!res.ok) throw new Error('Failed to fetch booking');
        const data = await res.json();
        const bookingData = data.data || data; // Handle both wrapped and unwrapped for safety
        setBooking(bookingData);
        
        if (bookingData.paymentDueAt) {
          setTimeRemaining(calculateTimeRemaining(bookingData.paymentDueAt));
        }
      } catch (err) {
        console.error('Fetch booking error:', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchBooking();
  }, [id]);

  useEffect(() => {
    const timer = setInterval(() => {
      if (booking?.paymentDueAt) {
        const remaining = calculateTimeRemaining(booking.paymentDueAt);
        setTimeRemaining(remaining);
        
        if (remaining.hours === 0 && remaining.minutes === 0 && remaining.seconds === 0) {
          clearInterval(timer);
          alert('Request expired. The host did not respond within 24 hours.');
          navigate('/my-trips');
        }
      }
    }, 1000); // Update every second

    return () => clearInterval(timer);
  }, [navigate, booking]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white">
        <Navbar />
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FF385C]"></div>
        </div>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="min-h-screen bg-white">
        <Navbar />
        <div className="text-center py-20">
          <h2 className="text-2xl font-bold mb-4">Booking not found</h2>
          <button onClick={() => navigate('/')} className="text-[#FF385C] font-semibold underline">
            Return home
          </button>
        </div>
      </div>
    );
  }

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
              <span className="font-semibold text-[#222222] uppercase">{booking.bookingId?.split('-')[0] || 'N/A'}</span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-[#717171]">Listing</span>
              <span className="font-semibold text-[#222222] truncate ml-4 text-right">
                {booking.listingTitle || 'Homestay'}
              </span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-[#717171]">Dates</span>
              <span className="font-semibold text-[#222222]">
                {booking.checkInDate} – {booking.checkOutDate}
              </span>
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