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
        
        let query = supabase
          .schema('listings_db')
          .from('property_details')
          .select('*')
          .eq('status', 'ACTIVE');
          
        if (region) {
          query = query.eq('region', region);
        }

        const { data, error } = await query;
        if (error) throw error;
        
        if (data) {
          const mapped: Listing[] = data.map((r: any) => ({
            id: r.listing_id,
            propertyType: r.title,
            location: r.location,
            price: Number(r.price_per_night),
            rating: 4.9,
            bookingType: r.booking_mode === 'INSTANT' ? 'instant' : 'request',
            imageUrl: r.image_url || 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800',
          }));
          setAvailableListings(mapped);
        }
      } catch (err) {
        console.error('Failed to fetch search results', err);
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