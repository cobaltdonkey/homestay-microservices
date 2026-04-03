import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router';
import { Navbar } from '../components/Navbar';
import { ArrowLeft, Star, AlertCircle, Clock, CreditCard, Lock } from 'lucide-react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { formatDateToYYYYMMDD } from '../../utils/dateUtils';

const stripePromise = loadStripe((import.meta as any).env.VITE_STRIPE_PUBLISHABLE_KEY);

function AuthoriseAndRequestPageInner() {
  const navigate = useNavigate();
  const { id } = useParams();
  const location = useLocation();
  const [paymentOption, setPaymentOption] = useState<'full' | 'split'>('full');
  const stripe = useStripe();
  const elements = useElements();
  const routeState = location.state as any || {};
  const hasRedirected = useRef(false);
  const [timeLeft, setTimeLeft] = useState(() => {
    if (routeState.expireAt && routeState.holdId) {
      const expiry = new Date(routeState.expireAt).getTime();
      const now = new Date().getTime();
      const diff = Math.floor((expiry - now) / 1000);
      console.log('[TIMER] expireAt:', routeState.expireAt, 'diff:', diff, 's');
      return diff > 5 ? diff : 120; // fallback to 120s if timezone parsing failed
    }
    return 120;
  });
  const [holdId, setHoldId] = useState<string | null>(routeState.holdId || null);
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

  // Format dates to YYYY-MM-DD for the backend using local time
  const checkIn: string = formatDateToYYYYMMDD(routeState.checkIn ? new Date(routeState.checkIn) : null);
  const checkOut: string = formatDateToYYYYMMDD(routeState.checkOut ? new Date(routeState.checkOut) : null);
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

  // POST /availability/hold on mount (only if not already held)
  useEffect(() => {
    if (!id || !checkIn || !checkOut || holdId) return;
    const createHold = async () => {
      try {
        const res = await fetch('/availability/holds', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            listingId: id,
            guestId,
            checkInDate: checkIn,
            checkOutDate: checkOut,
            ttlSeconds: 120,
          }),
        });
        const json = await res.json();
        if (json.code === 201 || json.code === 200) {
          setHoldId(json.data.holdId);
          if (json.data.expireAt) {
            setTimeLeft(120);
          }
        }
      } catch (err) {
        console.error('Hold failed:', err);
      }
    };
    createHold();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Countdown timer with robust redirect prevention
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1 && !hasRedirected.current) {
          hasRedirected.current = true;
          
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
            navigate('/');
          };
          releaseHold();
          return 0;
        }
        return prev > 0 ? prev - 1 : 0;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [navigate, holdId]);

  const handleRequest = async () => {
    if (isSubmitting || !stripe || !elements) return;
    setIsSubmitting(true);
    try {
      const cardElement = elements.getElement(CardElement);
      if (!cardElement) throw new Error("Card element not found");

      // Step 1: Create Payment Intent with manual capture (Authorization)
      const intentRes = await fetch('/gateway/create-payment-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: total,
          bookingId: `pi-auth-${Date.now()}`,
          currency: 'sgd',
          capture_method: 'manual'
        }),
      });
      const intentJson = await intentRes.json();
      if (intentJson.code !== 200) {
        alert(intentJson.message || 'Failed to initialize authorization.');
        setIsSubmitting(false);
        return;
      }

      const { clientSecret } = intentJson.data;

      // Step 2: Confirm Authorization (Skip if in Demo Mode)
      let finalPaymentIntentId = '';
      let finalPaymentMethodId = 'pm_demo_card';

      if (clientSecret.startsWith('demo_')) {
        console.log('[DEMO] Skipping real Stripe confirmation for demo secret');
        finalPaymentIntentId = clientSecret.replace('secret_', 'pi_'); // simulated ID
      } else {
        const result = await stripe.confirmCardPayment(clientSecret, {
          payment_method: {
            card: cardElement,
            billing_details: {
              name: currentUser?.name || 'Guest User',
              email: currentUser?.email || '',
            },
          },
        });

        if (result.error) {
          alert(result.error.message);
          setIsSubmitting(false);
          return;
        }

        if (result.paymentIntent.status !== 'requires_capture' && result.paymentIntent.status !== 'succeeded') {
          alert('Authorization failed. Status: ' + result.paymentIntent.status);
          setIsSubmitting(false);
          return;
        }

        finalPaymentIntentId = result.paymentIntent.id;
        finalPaymentMethodId = typeof result.paymentIntent.payment_method === 'string'
          ? result.paymentIntent.payment_method
          : result.paymentIntent.payment_method?.id ?? '';
      }

      // Step 3: Create booking with REQUEST mode
      const bookingRes = await fetch('/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          guestId,
          hostId: listing.hostId,
          listingId: id,
          checkInDate: checkIn,
          checkOutDate: checkOut,
          paymentIntentId: finalPaymentIntentId,
          paymentMethodId: finalPaymentMethodId,
          holdId,
          bookingMode: 'REQUEST',
          listingTitle: listing.title,
          listingImage: listing.imageUrl,
          totalAmount: total,
          depositAmount: listing.deposit,
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
      alert('Request failed. Please check your connection and try again.');
    } finally {
      setIsSubmitting(false);
    }
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

            {/* Section 2: Payment — Stripe Element */}
            <div>
              <h2 className="text-xl font-semibold text-[#222222] mb-4">2. Pay with Card</h2>
              <div className="border border-[#EBEBEB] rounded-xl overflow-hidden bg-white p-6 shadow-sm">
                <div className="flex items-center gap-2 mb-4 text-[#717171]">
                  <CreditCard className="w-5 h-5" />
                  <span className="text-sm font-semibold">Credit or Debit Card</span>
                  <div className="ml-auto flex items-center gap-1 text-xs">
                    <Lock className="w-3 h-3" />
                    Secure Sandbox
                  </div>
                </div>
                
                <div className="p-4 border border-[#EBEBEB] rounded-lg bg-[#F7F7F7]">
                  <CardElement options={{
                    style: {
                      base: {
                        fontSize: '16px',
                        color: '#222222',
                        '::placeholder': {
                          color: '#aab7c4',
                        },
                      },
                      invalid: {
                        color: '#FF385C',
                      },
                    },
                  }} />
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
                {Math.floor(timeLeft / 60)}:{String(timeLeft % 60).padStart(2, '0')} left
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function AuthoriseAndRequestPage() {
  return (
    <Elements stripe={stripePromise}>
      <AuthoriseAndRequestPageInner />
    </Elements>
  );
}