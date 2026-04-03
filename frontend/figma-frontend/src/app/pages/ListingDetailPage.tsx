import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router';
import { Navbar } from '../components/Navbar';
import { AuthModal } from '../components/AuthModal';
import { BookingPanelCalendar } from '../components/BookingPanelCalendar';
import { useAuth } from '../contexts/AuthContext';
import { formatDateToYYYYMMDD } from '../../utils/dateUtils';
import { supabase } from '../../utils/supabase';
import {
  Star,
  Wifi,
  UtensilsCrossed,
  Waves,
  CarFront,
  Wind,
  ChevronDown,
  ChevronUp,
  Grid3x3,
  ArrowLeft,
} from 'lucide-react';

export function ListingDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { isLoggedIn, user } = useAuth();
  const [listing, setListing] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [blockedRanges, setBlockedRanges] = useState<{ start: Date; end: Date }[]>([]);
  const [checkIn, setCheckIn] = useState<Date | null>(null);

  useEffect(() => {
    const fetchListing = async () => {
      if (!id) return;
      try {
        const { data, error } = await supabase
          .schema('listings_db')
          .from('property_details')
          .select('*')
          .eq('listing_id', id)
          .single();

        if (error) {
          console.error(error);
          return;
        }

        if (data) {
          setListing({
            id: data.listing_id,
            propertyType: data.title,
            location: data.location,
            price: Number(data.price_per_night),
            rating: 4.9,
            reviewCount: 124,
            bookingType: data.booking_mode === 'INSTANT' ? 'instant' : 'request',
            imageUrl: data.image_url || 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800',
            host: {
              id: data.host_id,
              name: 'Sarah',
              avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150',
              isSuperhost: true,
              memberSince: '2021',
            },
            description: 'Beautiful property located in the heart of ' + data.location + '.',
            amenities: ['wifi', 'kitchen', 'pool', 'parking', 'ac'],
            blockedDates: []
          });
        }
      } catch (err) {
        console.error('Failed to fetch listing detail', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchListing();

    // Fetch booked date ranges from booking-service
    const fetchBookedDates = async () => {
      if (!id) return;
      try {
        const res = await fetch(`/bookings/listings/${id}/booked-dates`);
        if (!res.ok) {
          console.warn(`[booked-dates] Service returned ${res.status}, skipping blocked dates.`);
          return;
        }
        const text = await res.text();
        if (!text) return;
        const json = JSON.parse(text);
        if (json.code === 200 && Array.isArray(json.data)) {
          console.log(`[DEBUG] Fetched ${json.data.length} booked ranges for listing ${id}`);
          const ranges = json.data.map((r: any) => ({
            start: new Date(r.checkInDate + 'T00:00:00'),
            end: new Date(r.checkOutDate + 'T00:00:00'),
          }));
          setBlockedRanges(ranges);
        }
      } catch (err) {
        console.warn('Could not fetch booked dates (non-fatal):', err);
      }
    };
    fetchBookedDates();
  }, [id]);
  const [checkOut, setCheckOut] = useState<Date | null>(null);
  const [guests, setGuests] = useState(1);
  const [expandedSection, setExpandedSection] = useState<string | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authTab, setAuthTab] = useState<'login' | 'signup'>('login');
  const [showHostNotice, setShowHostNotice] = useState(false);
  const [showCheckInCalendar, setShowCheckInCalendar] = useState(false);
  const [showCheckOutCalendar, setShowCheckOutCalendar] = useState(false);
  const [datesLocked, setDatesLocked] = useState(false); // Track if dates are locked from search
  const [pendingBookingAction, setPendingBookingAction] = useState<'instant' | 'request' | null>(null);
  const [pendingHold, setPendingHold] = useState<any>(null);
  const checkInRef = useRef<HTMLDivElement>(null);
  const checkOutRef = useRef<HTMLDivElement>(null);

  const handleOpenAuth = (tab: 'login' | 'signup') => {
    setAuthTab(tab);
    setShowHostNotice(false);
    setShowAuthModal(true);
  };

  const handleOpenAuthForHost = () => {
    setAuthTab('login');
    setShowHostNotice(true);
    setShowAuthModal(true);
  };

  // Redirect effect when user becomes logged in with a pending action
  useEffect(() => {
    if (isLoggedIn && pendingBookingAction && listing) {
      const state = { 
        checkIn, 
        checkOut, 
        guests, 
        holdId: pendingHold?.holdId, 
        expireAt: pendingHold?.expiresAt || pendingHold?.expireAt,
        listingTitle: listing.propertyType,
        imageUrl: listing.imageUrl,
        price: listing.price,
        hostId: listing.host.id
      };

      console.log(`[REDIRECTION] Navigating to request with state:`, state);
      if (pendingBookingAction === 'instant') {
        navigate(`/booking/confirm-and-pay/${id}`, { state });
      } else {
        navigate(`/booking/authorise-and-request/${id}`, { state });
      }
      
      setPendingBookingAction(null);
      setPendingHold(null);
    }
  }, [isLoggedIn, pendingBookingAction, listing, checkIn, checkOut, guests, id, navigate, pendingHold]);

  const handleAuthSuccess = () => {
    // State effect above will handle navigation
    console.log('[AUTH] Login successful, pending action:', pendingBookingAction);
  };

  // Pre-fill from search if available
  useEffect(() => {
    if (location.state) {
      const { checkIn: searchCheckIn, checkOut: searchCheckOut, guests: searchGuests } = location.state;
      if (searchCheckIn && searchCheckOut) {
        setCheckIn(new Date(searchCheckIn));
        setCheckOut(new Date(searchCheckOut));
        setDatesLocked(true); // Lock dates if they come from search
      }
      if (searchGuests) setGuests(searchGuests);
    }
  }, [location.state]);

  // Close calendar when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (checkInRef.current && !checkInRef.current.contains(event.target as Node)) {
        setShowCheckInCalendar(false);
      }
      if (checkOutRef.current && !checkOutRef.current.contains(event.target as Node)) {
        setShowCheckOutCalendar(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  if (!listing) {
    return <div className="min-h-screen flex items-center justify-center text-xl text-[#717171]">Listing not found</div>;
  }


  // Calculate nights and pricing
  const nights =
    checkIn && checkOut
      ? Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24))
      : 0;
  const nightlyRate = nights > 0 ? listing.price * nights : 0;
  const cleaningFee = 30;
  const deposit = 200;
  const total = nightlyRate + cleaningFee + deposit;

  const checkAvailabilityBeforeBooking = async () => {
    if (!checkIn || !checkOut) {
      alert('Please select check-in and check-out dates first');
      return null;
    }

    try {
      const checkInStr = formatDateToYYYYMMDD(checkIn);
      const checkOutStr = formatDateToYYYYMMDD(checkOut);
      
      // Communicate with Availability microservice to create a 120s soft hold
      const res = await fetch('/availability/holds', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          listingId: id,
          guestId: user?.userId || 'anonymous',
          checkInDate: checkInStr,
          checkOutDate: checkOutStr,
          reason: 'SOFT_HOLD',
          ttlSeconds: 120,
        }),
      });

      // Guard against empty/non-JSON error responses
      const rawText = await res.text();
      if (!rawText) {
        console.error('Booking service availability check failed: empty response body');
        alert('Could not verify availability. The service may be starting up — please try again in a moment.');
        return null;
      }

      let json: any;
      try {
        json = JSON.parse(rawText);
      } catch {
        console.error('Booking service availability check failed: invalid JSON response', rawText);
        alert('Could not verify availability. Please try again later.');
        return null;
      }
      
      if (json.code === 201) {
        console.log('Soft hold successfully created via Availability Service:', {
          holdId: json.data.holdId,
          expiresAt: json.data.expiresAt,
          status: json.data.status
        });
        return json.data;
      } else {
        alert('Sorry, this property is no longer available for these dates. Please try another date range.');
        return null;
      }
    } catch (err) {
      console.error('Booking service availability check failed:', err);
      alert('Could not verify availability. Please try again later.');
      return null;
    }
  };

  const handleBookClick = async () => {
    const holdData = await checkAvailabilityBeforeBooking();
    if (!holdData) return;

    const action = listing.bookingType === 'instant' ? 'instant' : 'request';
    const state = { 
      checkIn, 
      checkOut, 
      guests,
      holdId: holdData.holdId,
      expireAt: holdData.expiresAt || holdData.expireAt,
      listingTitle: listing.propertyType,
      imageUrl: listing.imageUrl,
      price: listing.price,
      rating: listing.rating,
      reviewCount: listing.reviewCount,
      nights,
      hostId: listing.host.id
    };

    if (isLoggedIn) {
      if (action === 'instant') {
        navigate(`/booking/confirm-and-pay/${id}`, { state });
      } else {
        navigate(`/booking/authorise-and-request/${id}`, { state });
      }
    } else {
      setPendingHold(holdData);
      setPendingBookingAction(action);
      handleOpenAuth('login');
    }
  };

  const formatDate = (date: Date | null) => {
    if (!date) return '';
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const amenities = [
    { icon: Wifi, label: 'WiFi' },
    { icon: UtensilsCrossed, label: 'Kitchen' },
    { icon: Waves, label: 'Pool' },
    { icon: CarFront, label: 'Parking' },
    { icon: Wind, label: 'Air-con' },
  ];

  return (
    <div className="min-h-screen bg-white">
      <Navbar onOpenAuth={handleOpenAuth} onOpenAuthForHost={handleOpenAuthForHost} />

      {/* Photo Gallery */}
      <div className="max-w-[1440px] mx-auto px-6 lg:px-20 py-6">
        {/* Back Arrow */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-[#222222] hover:text-[#717171] mb-6 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="font-semibold">Back</span>
        </button>

        <div className="h-[500px] rounded-xl overflow-hidden relative">
          {/* Large Hero Image */}
          <img
            src={listing.imageUrl}
            alt="Main property view"
            className="w-full h-full object-cover"
          />
        </div>

        {/* Two Column Layout */}
        <div className="grid grid-cols-3 gap-16 mt-12">
          {/* LEFT COLUMN */}
          <div className="col-span-2 space-y-8">
            {/* Heading */}
            <div>
              <h1 className="text-3xl font-semibold text-[#222222] mb-2">
                {listing.propertyType} in {listing.location}
              </h1>
            </div>

            {/* Host Info */}
            <div className="flex items-center gap-4">
              <img
                src={listing.host.avatar}
                alt={listing.host.name}
                className="w-12 h-12 rounded-full object-cover"
              />
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-[#222222]">
                    Hosted by {listing.host.name}
                  </span>
                  {listing.host.isSuperhost && (
                    <span className="bg-[#FFF5F7] text-[#FF385C] px-2 py-0.5 rounded-md text-xs font-semibold">
                      ★ Superhost
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="border-t border-[#EBEBEB]" />

            {/* Amenities */}
            <div>
              <h3 className="text-xl font-semibold text-[#222222] mb-4">
                What this place offers
              </h3>
              <div className="flex items-center gap-8">
                {amenities.map((amenity, idx) => {
                  const Icon = amenity.icon;
                  return (
                    <div key={idx} className="flex flex-col items-center gap-2">
                      <Icon className="w-6 h-6 text-[#222222]" />
                      <span className="text-sm text-[#717171]">{amenity.label}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="border-t border-[#EBEBEB]" />

            {/* Description */}
            <div>
              <h3 className="text-xl font-semibold text-[#222222] mb-4">About this space</h3>
              <p className="text-[#222222] leading-relaxed">{listing.description}</p>
            </div>
          </div>

          {/* RIGHT COLUMN - Booking Panel */}
          <div className="col-span-1">
            <div className="sticky top-24 border border-[#EBEBEB] rounded-xl p-6 shadow-xl">
              {/* Price */}
              <div className="mb-4">
                <span className="text-2xl font-semibold text-[#222222]">SGD {listing.price}</span>
                <span className="text-[#717171]"> / night</span>
              </div>

              {/* Rating */}
              <div className="flex items-center gap-2 mb-6">
                <Star className="w-4 h-4 fill-[#222222] stroke-[#222222]" />
                <span className="font-semibold text-[#222222]">{listing.rating}</span>
                <span className="text-[#717171]">({listing.reviewCount} reviews)</span>
              </div>

              {/* Date Picker */}
              <div className="border border-[#EBEBEB] rounded-lg mb-4 overflow-visible relative">
                <div className="grid grid-cols-2">
                  <div className="p-3 border-r border-[#EBEBEB]" ref={checkInRef}>
                    <label className="text-xs font-semibold text-[#222222] block mb-1">
                      CHECK-IN
                    </label>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowCheckInCalendar(!showCheckInCalendar);
                        setShowCheckOutCalendar(false);
                      }}
                      className="w-full text-left text-sm text-[#717171] cursor-pointer"
                    >
                      {formatDate(checkIn) || 'Add date'}
                    </button>
                    
                    {/* Check-in Calendar Dropdown */}
                    {showCheckInCalendar && (
                      <BookingPanelCalendar
                        onClose={() => setShowCheckInCalendar(false)}
                        onDateSelect={(date) => {
                          setCheckIn(date);
                          // Clear checkout if it's before new checkin
                          if (checkOut && date >= checkOut) {
                            setCheckOut(null);
                          }
                        }}
                        selectedDate={checkIn}
                        otherDate={checkOut}
                        mode="checkin"
                        blockedRanges={blockedRanges}
                      />
                    )}
                  </div>
                  <div className="p-3" ref={checkOutRef}>
                    <label className="text-xs font-semibold text-[#222222] block mb-1">
                      CHECK-OUT
                    </label>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowCheckOutCalendar(!showCheckOutCalendar);
                        setShowCheckInCalendar(false);
                      }}
                      className="w-full text-left text-sm text-[#717171] cursor-pointer"
                    >
                      {formatDate(checkOut) || 'Add date'}
                    </button>
                    
                    {/* Check-out Calendar Dropdown */}
                    {showCheckOutCalendar && (
                      <BookingPanelCalendar
                        onClose={() => setShowCheckOutCalendar(false)}
                        onDateSelect={(date) => setCheckOut(date)}
                        selectedDate={checkOut}
                        otherDate={checkIn}
                        mode="checkout"
                        blockedRanges={blockedRanges}
                      />
                    )}
                  </div>
                </div>
              </div>

              {/* Guest Counter */}
              <div className="border border-[#EBEBEB] rounded-lg p-3 mb-6">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-xs font-semibold text-[#222222] block">GUESTS</label>
                    <span className="text-sm text-[#717171]">
                      {guests} guest{guests > 1 ? 's' : ''}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setGuests(Math.max(1, guests - 1))}
                      className="w-8 h-8 border border-[#EBEBEB] rounded-full flex items-center justify-center hover:border-[#222222] transition-colors"
                      disabled={guests <= 1}
                    >
                      <ChevronDown className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setGuests(guests + 1)}
                      className="w-8 h-8 border border-[#EBEBEB] rounded-full flex items-center justify-center hover:border-[#222222] transition-colors"
                    >
                      <ChevronUp className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Price Breakdown */}
              {nights > 0 ? (
                <>
                  <div className="space-y-3 mb-4 pb-4 border-b border-[#EBEBEB]">
                    <div className="flex justify-between text-[#222222]">
                      <span>
                        SGD {listing.price} × {nights} night{nights > 1 ? 's' : ''}
                      </span>
                      <span>SGD {nightlyRate}</span>
                    </div>
                    <div className="flex justify-between text-[#222222]">
                      <span>Cleaning fee</span>
                      <span>SGD {cleaningFee}</span>
                    </div>
                    <div className="flex justify-between text-[#222222]">
                      <span>Refundable deposit</span>
                      <span>SGD {deposit}</span>
                    </div>
                  </div>

                  {/* Total */}
                  <div className="flex justify-between font-semibold text-[#222222] mb-4">
                    <span>Total</span>
                    <span>SGD {total.toLocaleString()}</span>
                  </div>
                </>
              ) : (
                <div className="space-y-3 mb-4 pb-4 border-b border-[#EBEBEB]">
                  <div className="flex justify-between text-[#717171]">
                    <span>Select dates to see pricing</span>
                    <span>—</span>
                  </div>
                </div>
              )}

              {/* Deposit Note */}
              <p className="text-xs text-[#717171] mb-6">
                A refundable security deposit will be pre-authorised on your card
              </p>

              <button
                onClick={handleBookClick}
                className="w-full bg-[#FF385C] hover:bg-[#E31C5F] text-white font-semibold py-3 rounded-lg transition-colors"
              >
                {listing.bookingType === 'instant' ? 'Reserve' : 'Request to Book'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Auth Modal */}
      {showAuthModal && (
        <AuthModal
          initialTab={authTab}
          onClose={() => setShowAuthModal(false)}
          onAuthSuccess={handleAuthSuccess}
          showHostNotice={showHostNotice}
        />
      )}
    </div>
  );
}