import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { Navbar } from '../components/Navbar';
import { StatusBadge } from '../components/StatusBadge';
import { ListingCard, Listing } from '../components/ListingCard';
import { XCircle, ArrowLeft } from 'lucide-react';

const alternativeListings: Listing[] = [
  { id: '15', imageUrl: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&q=80', propertyType: 'Flat', location: 'Bugis', price: 280, rating: 5.0, bookingType: 'instant' },
  { id: '16', imageUrl: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&q=80', propertyType: 'Studio', location: 'Bugis', price: 290, rating: 4.85, bookingType: 'request' },
  { id: '17', imageUrl: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800&q=80', propertyType: 'Apartment', location: 'Bugis', price: 310, rating: 4.92, bookingType: 'instant' },
];

interface BookingDeclinedPageProps {
  status?: 'rejected' | 'expired' | 'CANCELLED' | 'FAILED_PAYMENT';
}

export function BookingDeclinedPage({ status = 'rejected' }: BookingDeclinedPageProps) {
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

  const currentStatus = booking?.status || status;
  const isRejected = currentStatus === 'rejected' || currentStatus === 'REJECTED';
  const isCancelled = currentStatus === 'CANCELLED';
  
  let heading = 'Request Expired';
  let message = 'The host did not respond in time.';

  if (isRejected) {
    heading = 'Booking Declined';
    message = 'Host is unavailable for those dates.';
  } else if (isCancelled) {
    heading = 'Booking Cancelled';
    message = 'This booking has been cancelled.';
  }

  if (isLoading) return <div className="min-h-screen bg-white"><Navbar /><div className="flex justify-center py-20 animate-spin" /></div>;

  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <div className="max-w-[1200px] mx-auto px-6 py-8">
        <button onClick={() => navigate('/')} className="flex items-center gap-2 text-[#222222] hover:text-[#717171] mb-6 transition-colors">
          <ArrowLeft className="w-5 h-5" />
          <span className="font-semibold">Back to home</span>
        </button>

        <div className="text-center mb-12">
          <div className="mb-8 flex justify-center">
            <div className="w-24 h-24 bg-[#FEF2F2] rounded-full flex items-center justify-center">
              <XCircle className="w-16 h-16 text-[#DC2626]" strokeWidth={2} />
            </div>
          </div>
          <h1 className="text-4xl font-bold text-[#222222] mb-4">{heading}</h1>
          <div className="flex justify-center mb-6"><StatusBadge status={currentStatus} /></div>
          <p className="text-lg text-[#717171] mb-8 max-w-[500px] mx-auto">{message}</p>

          <div className="bg-[#F7F7F7] rounded-xl p-6 text-left space-y-4 max-w-[500px] mx-auto mb-8">
            <div className="flex justify-between items-center">
              <span className="text-[#717171]">Booking ID</span>
              <span className="font-semibold text-[#222222] uppercase">{booking?.bookingId?.split('-')[0] || id}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-[#717171]">Listing</span>
              <span className="font-semibold text-[#222222]">{booking?.listingTitle || 'Homestay'}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-[#717171]">Dates</span>
              <span className="font-semibold text-[#222222]">{booking?.checkInDate} – {booking?.checkOutDate}</span>
            </div>
          </div>
        </div>

        <div>
          <h2 className="text-2xl font-semibold text-[#222222] mb-6">Explore similar homes</h2>
          <div className="flex gap-5 justify-center flex-wrap">
            {alternativeListings.map((listing) => <ListingCard key={listing.id} listing={listing} />)}
          </div>
        </div>
      </div>
    </div>
  );
}