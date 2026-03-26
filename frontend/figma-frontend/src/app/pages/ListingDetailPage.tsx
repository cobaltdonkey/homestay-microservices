import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router';
import { Navbar } from '../components/Navbar';
import { AuthModal } from '../components/AuthModal';
import { BookingPanelCalendar } from '../components/BookingPanelCalendar';
import { getListingById } from '../data/listings';
import { useAuth } from '../contexts/AuthContext';
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
  const { isLoggedIn } = useAuth();
  const [checkIn, setCheckIn] = useState<Date | null>(null);
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

  const handleAuthSuccess = () => {
    // After successful login, proceed with the pending booking action
    if (pendingBookingAction === 'instant') {
      navigate(`/booking/confirm-and-pay/${id}`, {
        state: { checkIn, checkOut, guests },
      });
    } else if (pendingBookingAction === 'request') {
      navigate(`/booking/authorise-and-request/${id}`, {
        state: { checkIn, checkOut, guests },
      });
    }
    setPendingBookingAction(null);
  };

  // Get listing data
  const listing = getListingById(id || '');

  if (!listing) {
    return <div>Listing not found</div>;
  }

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

  // Convert blocked dates to Date objects
  const blockedRanges = listing.blockedDates.map((range) => ({
    start: new Date(range.start),
    end: new Date(range.end),
  }));

  // Calculate nights and pricing
  const nights =
    checkIn && checkOut
      ? Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24))
      : 0;
  const nightlyRate = nights > 0 ? listing.price * nights : 0;
  const cleaningFee = 30;
  const deposit = 200;
  const total = nightlyRate + cleaningFee + deposit;

  const handleInstantBookClick = () => {
    if (isLoggedIn) {
      navigate(`/booking/confirm-and-pay/${id}`, {
        state: { checkIn, checkOut, guests },
      });
    } else {
      setPendingBookingAction('instant');
      handleOpenAuth('login');
    }
  };

  const handleRequestBookClick = () => {
    if (isLoggedIn) {
      navigate(`/booking/authorise-and-request/${id}`, {
        state: { checkIn, checkOut, guests },
      });
    } else {
      setPendingBookingAction('request');
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

        <div className="grid grid-cols-4 gap-2 h-[500px] rounded-xl overflow-hidden relative">
          {/* Large Hero Image */}
          <div className="col-span-2 row-span-2">
            <img
              src={listing.images[0]}
              alt="Main property view"
              className="w-full h-full object-cover"
            />
          </div>

          {/* Thumbnail Grid */}
          {listing.images.slice(1).map((img, idx) => (
            <div key={idx} className="col-span-1 row-span-1">
              <img
                src={img}
                alt={`Property view ${idx + 2}`}
                className="w-full h-full object-cover"
              />
            </div>
          ))}

          {/* Show All Photos Button */}
          <button className="absolute bottom-6 right-6 bg-white border border-[#222222] px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-[#F7F7F7] transition-colors font-semibold text-sm">
            <Grid3x3 className="w-4 h-4" />
            Show all photos
          </button>
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

              {/* Booking Button - Show only one based on bookingType */}
              {listing.bookingType === 'instant' ? (
                <button
                  onClick={handleInstantBookClick}
                  className="w-full bg-[#FF385C] hover:bg-[#E31C5F] text-white font-semibold py-3 rounded-lg transition-colors"
                >
                  Book Instantly
                </button>
              ) : (
                <button
                  onClick={handleRequestBookClick}
                  className="w-full border-2 border-[#FF385C] text-[#FF385C] hover:bg-[#FFF5F7] font-semibold py-3 rounded-lg transition-colors"
                >
                  Request to Book
                </button>
              )}
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