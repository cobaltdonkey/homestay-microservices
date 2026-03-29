import { useLocation } from 'react-router';
import { Navbar } from '../components/Navbar';
import { SearchBar } from '../components/SearchBar';
import { ListingCard, Listing } from '../components/ListingCard';
import { useState, useEffect } from 'react';
import { AuthModal } from '../components/AuthModal';
import { supabase } from '../../utils/supabase';

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

  const [availableListings, setAvailableListings] = useState<Listing[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Convert ISO string dates back to Date objects
  const checkInDate = checkIn ? new Date(checkIn) : null;
  const checkOutDate = checkOut ? new Date(checkOut) : null;

  useEffect(() => {
    const fetchSearchResults = async () => {
      try {
        setIsLoading(true);
        
        // Build query string for the search microservice
        const params = new URLSearchParams();
        if (region) params.append('location', region);
        if (checkIn) params.append('checkInDate', checkIn.split('T')[0]);
        if (checkOut) params.append('checkOutDate', checkOut.split('T')[0]);
        params.append('limit', '20');

        const response = await fetch(`/search/listings?${params.toString()}`);
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error(`Search API error (${response.status}):`, errorText.slice(0, 200));
          setAvailableListings([]);
          setIsLoading(false);
          return;
        }

        const contentType = response.headers.get("content-type");
        if (!contentType || !contentType.includes("application/json")) {
           const text = await response.text();
           console.error("Search API returned non-JSON response:", text.slice(0, 200));
           setAvailableListings([]);
           setIsLoading(false);
           return;
        }

        const json = await response.json();
        
        if (json.code === 200 && json.data.results) {
          const mapped: Listing[] = json.data.results.map((r: any) => ({
            id: r.listingId,
            propertyType: r.title,
            location: r.location,
            price: Number(r.pricePerNight),
            rating: 4.9,
            bookingType: r.bookingMode === 'INSTANT' ? 'instant' : 'request',
            imageUrl: r.imageUrl || 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800',
          }));
          setAvailableListings(mapped);
        } else {
          setAvailableListings([]);
        }
      } catch (err) {
        console.error('Failed to fetch search results from microservice', err);
        setAvailableListings([]);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchSearchResults();
  }, [region, checkIn, checkOut]);

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
        {isLoading ? (
          <div className="py-12 text-[#717171] font-semibold text-center">Searching...</div>
        ) : availableListings.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {availableListings.map((listing) => (
              <ListingCard key={listing.id} listing={listing} />
            ))}
          </div>
        ) : (
          <div className="py-12 text-[#717171] font-semibold text-center mt-12">No properties found matching your search. Try another region!</div>
        )}
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