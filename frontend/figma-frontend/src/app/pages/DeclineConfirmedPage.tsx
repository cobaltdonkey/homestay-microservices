import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { Navbar } from '../components/Navbar';
import { XCircle, ArrowLeft, Home, Calendar, Users } from 'lucide-react';

export function DeclineConfirmedPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [booking, setBooking] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchBooking = async () => {
      if (!id) return;
      try {
        const res = await fetch(`/bookings/${id}`);
        if (!res.ok) throw new Error('Failed to fetch booking');
        const data = await res.json();
        setBooking(data.data || data);
      } catch (err) {
        console.error('Fetch booking error:', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchBooking();
  }, [id]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white">
        <Navbar />
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-4 border-[#FF385C] border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      <div className="max-w-[800px] mx-auto px-6 py-12 text-center">
        {/* Animated Icon Container */}
        <div className="mb-8 flex justify-center">
          <div className="w-24 h-24 bg-[#FEF2F2] rounded-full flex items-center justify-center animate-in zoom-in duration-500">
            <XCircle className="w-16 h-16 text-[#DC2626]" strokeWidth={2} />
          </div>
        </div>

        {/* Heading */}
        <h1 className="text-4xl font-bold text-[#222222] mb-4">Decline Confirmed</h1>
        <p className="text-xl text-[#717171] mb-12 max-w-[600px] mx-auto">
          The booking request for {booking?.guestName || 'the guest'} has been successfully declined.
          The dates are now open and available for other guests to book.
        </p>

        {/* Booking Details Card */}
        <div className="bg-white border border-[#EBEBEB] rounded-2xl p-8 mb-12 text-left shadow-sm">
          <h3 className="text-lg font-semibold text-[#222222] mb-6">Booking Details</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <div className="flex items-center gap-3 text-[#222222]">
                <Home className="w-5 h-5 text-[#717171]" />
                <div>
                  <div className="text-xs text-[#717171] uppercase font-bold tracking-wider">Property</div>
                  <div className="font-medium">{booking?.listingTitle || 'Homestay'}</div>
                </div>
              </div>

              <div className="flex items-center gap-3 text-[#222222]">
                <Calendar className="w-5 h-5 text-[#717171]" />
                <div>
                  <div className="text-xs text-[#717171] uppercase font-bold tracking-wider">Dates</div>
                  <div className="font-medium">{booking?.checkInDate} – {booking?.checkOutDate}</div>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-3 text-[#222222]">
                <Users className="w-5 h-5 text-[#717171]" />
                <div>
                  <div className="text-xs text-[#717171] uppercase font-bold tracking-wider">Guest</div>
                  <div className="font-medium">{booking?.guestName || 'Guest'}</div>
                </div>
              </div>

              <div className="flex items-center gap-3 text-[#222222]">
                <div className="w-5 h-5 flex items-center justify-center text-[#717171] font-bold">#</div>
                <div>
                  <div className="text-xs text-[#717171] uppercase font-bold tracking-wider">Booking ID</div>
                  <div className="font-medium uppercase tracking-tight">{booking?.bookingId?.split('-')[0] || id}</div>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8 pt-8 border-t border-[#EBEBEB]">
            <div className="flex items-center justify-between">
              <span className="text-[#717171]">Original Total</span>
              <span className="text-lg font-semibold text-[#222222]">SGD {Number(booking?.totalAmount || 0).toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-between mt-2">
              <span className="text-[#717171]">Payment Status</span>
              <span className="font-semibold text-[#DC2626]">VOIDED / FAILED</span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={() => navigate('/host/dashboard')}
            className="px-8 py-3 bg-[#222222] text-white font-semibold rounded-lg hover:bg-black transition-colors"
          >
            Go to dashboard
          </button>
          <button
            onClick={() => navigate('/host/rejected-bookings')}
            className="px-8 py-3 border border-[#222222] text-[#222222] font-semibold rounded-lg hover:bg-[#F7F7F7] transition-colors"
          >
            View all rejected requests
          </button>
        </div>
      </div>
    </div>
  );
}
