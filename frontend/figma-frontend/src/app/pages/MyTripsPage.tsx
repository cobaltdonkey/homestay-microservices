import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { Navbar } from '../components/Navbar';
import { AuthModal } from '../components/AuthModal';
import { BookingDetailModal } from '../components/BookingDetailModal';
import { StatusBadge } from '../components/StatusBadge';
import { ArrowLeft, MapPin, Calendar, Users, Clock } from 'lucide-react';

interface Booking {
  id: string;
  bookingId: string;
  listingTitle: string;
  listingImage: string;
  dates: string;
  status: 'awaiting_payment' | 'confirmed' | 'paid' | 'pending_host' | 'rejected' | 'expired' | 'completed' | 'cancelled';
  guests: number;
  total: number;
  timeRemaining?: { hours: number; minutes: number; seconds: number };
}


type FilterTab = 'upcoming' | 'completed' | 'cancelled';


export function MyTripsPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<FilterTab>('upcoming');
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch real bookings from backend
  useEffect(() => {
    const fetchBookings = async () => {
      const storedUser = localStorage.getItem('secondhome_user');
      const currentUser = storedUser ? JSON.parse(storedUser) : null;
      if (!currentUser?.userId) {
        setIsLoading(false);
        return; // Not logged in — show empty state
      }

      try {
        const res = await fetch(`/bookings?guestId=${currentUser.userId}`);
        if (!res.ok) throw new Error('Failed to fetch bookings');
        const json = await res.json();

        if (json.code === 200 && Array.isArray(json.data)) {
          const mapped: Booking[] = json.data.map((b: any) => ({
            id: b.bookingId,
            bookingId: b.bookingId,
            listingTitle: b.listingTitle ?? b.listingId,
            listingImage: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=300&q=80',
            dates: `${b.checkInDate} – ${b.checkOutDate}`,
            status: (b.status ?? 'confirmed').toLowerCase() as Booking['status'],
            guests: 2,
            total: Number(b.totalAmount ?? 0),
          }));
          setBookings(mapped);
        }
      } catch (err) {
        console.error('Trips fetch error:', err);
        // Leave bookings as empty [] — backend error will show empty state
      } finally {
        setIsLoading(false);
      }
    };
    fetchBookings();
  }, []);

  // Real-time countdown for pending bookings
  useEffect(() => {
    const timer = setInterval(() => {
      setBookings(prev => {
        return prev.map(booking => {
          if (booking.status === 'pending_host' && booking.timeRemaining) {
            const { hours, minutes, seconds } = booking.timeRemaining;
            
            // Check if expired
            if (hours === 0 && minutes === 0 && seconds === 0) {
              alert(`Booking ${booking.bookingId} has expired. The host did not respond within 24 hours.`);
              return {
                ...booking,
                status: 'expired' as const,
                timeRemaining: undefined
              };
            }
            
            // Count down
            if (seconds > 0) {
              return {
                ...booking,
                timeRemaining: { ...booking.timeRemaining, seconds: seconds - 1 }
              };
            } else if (minutes > 0) {
              return {
                ...booking,
                timeRemaining: { hours, minutes: minutes - 1, seconds: 59 }
              };
            } else if (hours > 0) {
              return {
                ...booking,
                timeRemaining: { hours: hours - 1, minutes: 59, seconds: 59 }
              };
            }
          }
          
          return booking;
        });
      });
    }, 1000); // Update every second

    return () => clearInterval(timer);
  }, []);

  const filterBookings = (bookings: Booking[], tab: FilterTab): Booking[] => {
    switch (tab) {
      case 'upcoming':
        return bookings.filter(b => ['awaiting_payment', 'confirmed', 'paid', 'pending_host'].includes(b.status));
      case 'completed':
        return bookings.filter(b => b.status === 'completed');
      case 'cancelled':
        return bookings.filter(b => ['cancelled', 'rejected', 'expired'].includes(b.status));
      default:
        return bookings;
    }
  };

  const filteredBookings = filterBookings(bookings, activeTab);

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      <div className="max-w-[1200px] mx-auto px-6 lg:px-20 py-8">
        {/* Back Arrow */}
        <button 
          onClick={() => navigate('/')}
          className="flex items-center gap-2 text-[#222222] hover:text-[#717171] mb-6 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="font-semibold">Back to home</span>
        </button>

        {/* Page Heading */}
        <h1 className="text-3xl font-semibold text-[#222222] mb-8">My Trips</h1>

        {/* Filter Tabs */}
        <div className="flex gap-6 border-b border-[#EBEBEB] mb-8">
          {(['upcoming', 'completed', 'cancelled'] as FilterTab[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`pb-4 font-semibold capitalize relative ${
                activeTab === tab ? 'text-[#222222]' : 'text-[#717171]'
              }`}
            >
              {tab}
              {activeTab === tab && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#FF385C]" />
              )}
            </button>
          ))}
        </div>

        {/* Booking List */}
        <div className="space-y-4">
          {filteredBookings.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-lg text-[#717171]">No bookings found</p>
            </div>
          ) : (
            filteredBookings.map((booking) => (
              <div
                key={booking.id}
                className="border border-[#EBEBEB] rounded-xl p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-center gap-4 mb-3">
                  {/* Listing Image */}
                  <img
                    src={booking.listingImage}
                    alt={booking.listingTitle}
                    className="w-24 h-24 rounded-lg object-cover"
                  />

                  {/* Booking Info */}
                  <div className="flex-1">
                    <h3 className="font-semibold text-[#222222] mb-1">
                      {booking.listingTitle}
                    </h3>
                    <p className="text-sm text-[#717171] mb-2">
                      {booking.dates} · {booking.guests} guest{booking.guests > 1 ? 's' : ''}
                    </p>
                    <div className="flex items-center gap-3">
                      <StatusBadge status={booking.status} />
                      <span className="text-sm text-[#717171]">
                        SGD {booking.total.toLocaleString()}
                      </span>
                    </div>
                  </div>

                  {/* View Details Button */}
                  <button
                    onClick={() => setSelectedBooking(booking)}
                    className="px-6 py-2 border-2 border-[#FF385C] text-[#FF385C] hover:bg-[#FFF5F7] font-semibold rounded-lg transition-colors"
                  >
                    View Details
                  </button>
                </div>
                
                {/* Countdown Timer for Pending Bookings */}
                {booking.status === 'pending_host' && booking.timeRemaining && (
                  <div className="bg-[#FFF9E6] border border-[#FFE066] rounded-lg p-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-[#FF385C]" />
                      <span className="text-sm text-[#717171]">Host must respond in:</span>
                    </div>
                    <div className="text-sm font-bold text-[#FF385C]">
                      {booking.timeRemaining.hours}h {booking.timeRemaining.minutes}m {booking.timeRemaining.seconds}s
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Booking Detail Modal */}
      {selectedBooking && (
        <BookingDetailModal
          booking={selectedBooking}
          onClose={() => setSelectedBooking(null)}
        />
      )}
    </div>
  );
}