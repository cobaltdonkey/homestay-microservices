import { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router';
import { Navbar } from '../components/Navbar';
import { ArrowLeft, Star, AlertCircle, Clock } from 'lucide-react';

export function AuthoriseAndRequestPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const location = useLocation();
  const [paymentOption, setPaymentOption] = useState<'full' | 'split'>('full');
  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvc, setCvc] = useState('');
  const [cardName, setCardName] = useState('');
  const routeState = location.state as any || {};
  const [timeLeft, setTimeLeft] = useState(() => {
    if (routeState.expireAt && routeState.holdId) {
      const expiry = new Date(routeState.expireAt).getTime();
      const now = new Date().getTime();
      const diff = Math.floor((expiry - now) / 1000);
      console.log('[TIMER] expireAt:', routeState.expireAt, 'diff:', diff, 's');
      return diff;
    }
    return 0; // Boot back if missing
  });
  const holdId = routeState.holdId || null;
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Booking context from router state
  const storedUser = localStorage.getItem('secondhome_user');
  const currentUser = storedUser ? JSON.parse(storedUser) : null;
  const guestId = currentUser?.userId ?? '8b0e51e5-a7c3-4870-8684-683c8d5af482';

  const listing = {
    id: id ?? '',
    title: routeState.listingTitle ?? 'Selected Listing',
    imageUrl: routeState.imageUrl ?? 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=300&q=80',
    rating: routeState.rating ?? 4.9,
    hostId: routeState.hostId ?? 'af112c4e-8b77-46ac-9014-7cdb291e0023',
    reviewCount: routeState.reviewCount ?? 0,
    price: routeState.price ?? 0,
    nights: routeState.nights ?? 1,
    cleaningFee: 30,
    deposit: 200,
  };

  // Format dates to YYYY-MM-DD for the backend
  const checkIn: string = routeState.checkIn ? new Date(routeState.checkIn).toISOString().split('T')[0] : '';
  const checkOut: string = routeState.checkOut ? new Date(routeState.checkOut).toISOString().split('T')[0] : '';
  const total = routeState.price * (routeState.nights || 1) + listing.cleaningFee + listing.deposit;
  const splitAmount = total / 2;

  const formatDateShort = (dateStr: string) => {
    if (!dateStr) return 'N/A';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const getCancellationDate = () => {
    const d = new Date();
    d.setDate(d.getDate() + 3);
    return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
  };



  // Countdown timer
  useEffect(() => {
    if (timeLeft <= 0) {
      const releaseHold = async () => {
        if (holdId) {
          try {
            await fetch(`/availability/holds/${holdId}`, { method: 'DELETE' });
            console.log('[HOLD] Session expired, hold released:', holdId);
          } catch (e) {
            console.error('[HOLD] Failed to release hold:', e);
          }
        }
        alert('Payment session expired. Please try again.');
        navigate(-1);
      };
      releaseHold();
      return;
    }
    const timer = setInterval(() => setTimeLeft((prev) => prev - 1), 1000);
    return () => clearInterval(timer);
  }, [timeLeft, navigate, holdId]);

  const handleRequest = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      // Step 1: Pre-authorize card via gateway
      const authRes = await fetch('/gateway/authorize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: total,
          currency: 'SGD',
          paymentMethodId: `card_${cardNumber.replace(/\s/g,'').slice(-4) || 'demo'}`,
        }),
      });
      const authJson = await authRes.json();
      const paymentMethodId = authJson.data?.paymentMethodId ?? 'card_demo';

      // Step 2: Create booking with REQUEST mode
      const bookingRes = await fetch('/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          guestId,
          hostId: listing.hostId,
          listingId: id,
          checkInDate: checkIn,
          checkOutDate: checkOut,
          paymentMethodId,
          holdId,
          bookingMode: 'REQUEST',
          listingTitle: listing.title,
          listingImage: listing.imageUrl,
          totalAmount: total,
          guests: routeState.guests || 1
        }),
      });
      const bookingJson = await bookingRes.json();
      if (bookingJson.code === 201 || bookingJson.code === 200) {
        navigate(`/booking/request-sent/${bookingJson.data?.bookingId ?? id}`);
      } else {
        alert(bookingJson.message ?? 'Request failed. Please try again.');
      }
    } catch (err) {
      console.error('Request booking failed:', err);
      alert('Request failed. Is the backend running?');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleExpiryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, '');
    if (value.length >= 2) value = value.slice(0, 2) + '/' + value.slice(2, 4);
    setExpiry(value);
  };

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      <div className="max-w-[1440px] mx-auto px-6 lg:px-20 py-8">
        {/* Back Arrow */}
        <button 
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-[#222222] hover:text-[#717171] mb-6 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="font-semibold">Back</span>
        </button>

        <h1 className="text-3xl font-semibold text-[#222222] mb-6">Authorise and request</h1>

        {/* Notice Banner */}
        <div className="bg-[#FFF9E6] border border-[#FFE066] rounded-lg p-4 mb-8 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-[#B8860B] flex-shrink-0 mt-0.5" />
          <p className="text-sm text-[#6B5400]">
            Your card will be held but not charged until the host approves
          </p>
        </div>

        {/* Two Column Layout */}
        <div className="grid grid-cols-3 gap-16">
          {/* LEFT COLUMN */}
          <div className="col-span-2 space-y-8">
            {/* Section 1: Choose when to pay */}
            <div>
              <h2 className="text-xl font-semibold text-[#222222] mb-4">
                1. Choose when to pay
              </h2>
              <div className="space-y-3">
                <label className="flex items-start gap-3 p-4 border-2 rounded-lg cursor-pointer hover:border-[#222222] transition-colors"
                  style={{ borderColor: paymentOption === 'full' ? '#222222' : '#EBEBEB' }}
                >
                  <input
                    type="radio"
                    name="payment"
                    value="full"
                    checked={paymentOption === 'full'}
                    onChange={() => setPaymentOption('full')}
                    className="mt-1 accent-[#FF385C]"
                  />
                  <div className="flex-1">
                    <div className="font-semibold text-[#222222]">
                      Pay SGD {total.toLocaleString()} now
                    </div>
                  </div>
                </label>

                <label className="flex items-start gap-3 p-4 border-2 rounded-lg cursor-pointer hover:border-[#222222] transition-colors"
                  style={{ borderColor: paymentOption === 'split' ? '#222222' : '#EBEBEB' }}
                >
                  <input
                    type="radio"
                    name="payment"
                    value="split"
                    checked={paymentOption === 'split'}
                    onChange={() => setPaymentOption('split')}
                    className="mt-1 accent-[#FF385C]"
                  />
                  <div className="flex-1">
                    <div className="font-semibold text-[#222222]">
                      Pay part now, part later
                    </div>
                    <div className="text-sm text-[#717171] mt-1">
                      SGD {splitAmount.toLocaleString()} now, SGD {splitAmount.toLocaleString()} later
                    </div>
                    <button className="text-sm text-[#FF385C] hover:text-[#E31C5F] font-semibold mt-2 underline">
                      More info
                    </button>
                  </div>
                </label>
              </div>
            </div>

            {/* Section 2: Add a payment method */}
            <div>
              <h2 className="text-xl font-semibold text-[#222222] mb-4">
                2. Add a payment method
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-[#222222] mb-2">
                    Card number
                  </label>
                  <input
                    type="text"
                    placeholder="1234 5678 9012 3456"
                    value={cardNumber}
                    onChange={(e) => setCardNumber(e.target.value)}
                    className="w-full px-4 py-3 border border-[#EBEBEB] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF385C]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-[#222222] mb-2">
                      Expiry
                    </label>
                    <input
                      type="text"
                      placeholder="MM / YY"
                      value={expiry}
                      onChange={handleExpiryChange}
                      maxLength={5}
                      className="w-full px-4 py-3 border border-[#EBEBEB] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF385C]"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-[#222222] mb-2">
                      CVC
                    </label>
                    <input
                      type="text"
                      placeholder="123"
                      value={cvc}
                      onChange={(e) => setCvc(e.target.value)}
                      className="w-full px-4 py-3 border border-[#EBEBEB] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF385C]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-[#222222] mb-2">
                    Name on card
                  </label>
                  <input
                    type="text"
                    placeholder="John Doe"
                    value={cardName}
                    onChange={(e) => setCardName(e.target.value)}
                    className="w-full px-4 py-3 border border-[#EBEBEB] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF385C]"
                  />
                </div>
              </div>
            </div>

            {/* Section 3: Review your reservation */}
            <div>
              <h2 className="text-xl font-semibold text-[#222222] mb-4">
                3. Review your reservation
              </h2>
              <div className="space-y-3 border border-[#EBEBEB] rounded-lg p-4">
                <div className="flex justify-between">
                  <span className="text-[#717171]">Check-in</span>
                  <span className="font-semibold text-[#222222]">{formatDateShort(checkIn)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#717171]">Check-out</span>
                  <span className="font-semibold text-[#222222]">{formatDateShort(checkOut)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#717171]">Guests</span>
                  <span className="font-semibold text-[#222222]">{routeState.guests || 1}</span>
                </div>
                <div className="border-t border-[#EBEBEB] pt-3">
                  <span className="text-sm text-[#717171]">Cancellation policy</span>
                  <p className="text-sm text-[#222222] mt-1">
                    Free cancellation before {getCancellationDate()}.{' '}
                    <button className="text-[#FF385C] hover:text-[#E31C5F] font-semibold underline">
                      Full policy
                    </button>
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN - Sticky Summary */}
          <div className="col-span-1">
            <div className="sticky top-24 border border-[#EBEBEB] rounded-xl p-6 shadow-lg">
              {/* Listing Info */}
              <div className="flex gap-4 mb-6 pb-6 border-b border-[#EBEBEB]">
                <img
                  src={listing.imageUrl}
                  alt={listing.title}
                  className="w-24 h-24 rounded-lg object-cover"
                />
                <div className="flex-1">
                  <h3 className="font-semibold text-[#222222] mb-1">{listing.title}</h3>
                  <div className="flex items-center gap-1">
                    <Star className="w-3 h-3 fill-[#222222] stroke-[#222222]" />
                    <span className="text-sm font-semibold text-[#222222]">{listing.rating}</span>
                    <span className="text-sm text-[#717171]">({listing.reviewCount})</span>
                  </div>
                </div>
              </div>

              {/* Price Breakdown */}
              <div className="space-y-3 mb-4 pb-4 border-b border-[#EBEBEB]">
                <div className="flex justify-between text-[#222222]">
                  <span>SGD {listing.price} × {listing.nights} nights</span>
                  <span>SGD {listing.price * listing.nights}</span>
                </div>
                <div className="flex justify-between text-[#222222]">
                  <span>Cleaning fee</span>
                  <span>SGD {listing.cleaningFee}</span>
                </div>
                <div className="flex justify-between text-[#222222]">
                  <span>Refundable deposit</span>
                  <span>SGD {listing.deposit}</span>
                </div>
              </div>

              {/* Total */}
              <div className="flex justify-between font-semibold text-[#222222] text-lg mb-6">
                <span>Total</span>
                <span>SGD {total.toLocaleString()}</span>
              </div>

              {/* Send Request Button */}
              <button
                onClick={handleRequest}
                className="w-full bg-[#FF385C] hover:bg-[#E31C5F] text-white font-semibold py-3 rounded-lg transition-colors mb-3"
              >
                Send Request
              </button>

              {/* Note */}
              <p className="text-xs text-center text-[#717171]">
                Your card will be held but not charged until approved
              </p>

              {/* Countdown Timer */}
              <div className="flex items-center justify-center text-sm text-[#FF385C] font-semibold">
                <Clock className="w-4 h-4 mr-1" />
                {timeLeft} seconds left
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}