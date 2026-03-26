import { useLocation } from 'react-router';
import { Navbar } from '../components/Navbar';
import { SearchBar } from '../components/SearchBar';
import { ListingCard, Listing } from '../components/ListingCard';
import { useState } from 'react';
import { AuthModal } from '../components/AuthModal';
import { listingsData } from '../data/listings';
import { isListingAvailable } from '../utils/availability';

export function SearchResultsPage() {
  const location = useLocation();
  const { region, nights, guests, checkIn, checkOut } = location.state || {};
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authTab, setAuthTab] = useState<'login' | 'signup'>('login');
  const [showHostNotice, setShowHostNotice] = useState(false);

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

  // Convert ISO string dates back to Date objects
  const checkInDate = checkIn ? new Date(checkIn) : null;
  const checkOutDate = checkOut ? new Date(checkOut) : null;

  // Filter listings based on availability
  const availableListings: Listing[] = Object.values(listingsData)
    .filter((listing) => isListingAvailable(listing, checkInDate, checkOutDate))
    .map((listing) => ({
      id: listing.id,
      imageUrl: listing.imageUrl,
      propertyType: listing.propertyType,
      location: listing.location,
      price: listing.price,
      rating: listing.rating,
      bookingType: listing.bookingType,
    }));

  return (
    <div className="min-h-screen bg-white">
      <Navbar onOpenAuth={handleOpenAuth} onOpenAuthForHost={handleOpenAuthForHost} />

      {/* Search Bar Section */}
      <section className="pt-8 pb-6 px-6 bg-[#FFF5F7]">
        <div className="max-w-[1440px] mx-auto">
          <SearchBar 
            variant="hero" 
            initialRegion={region}
            initialCheckIn={checkInDate}
            initialCheckOut={checkOutDate}
            initialGuests={guests}
          />
        </div>
      </section>

      <div className="max-w-[1440px] mx-auto px-6 lg:px-20 py-8">
        {/* Search Results Heading */}
        <h1 className="text-2xl font-semibold text-[#222222] mb-8">
          {region || 'All regions'} · {nights} night{nights !== 1 ? 's' : ''} · {guests} guest{guests !== 1 ? 's' : ''}
        </h1>

        {/* Listing Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {availableListings.map((listing) => (
            <ListingCard key={listing.id} listing={listing} />
          ))}
        </div>
      </div>

      {/* Auth Modal */}
      {showAuthModal && (
        <AuthModal
          initialTab={authTab}
          onClose={() => setShowAuthModal(false)}
          showHostNotice={showHostNotice}
        />
      )}
    </div>
  );
}