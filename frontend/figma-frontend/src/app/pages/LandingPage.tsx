import { Navbar } from '../components/Navbar';
import { SearchBar } from '../components/SearchBar';
import { ListingCard, Listing } from '../components/ListingCard';
import { AuthModal } from '../components/AuthModal';
import { ChevronLeft, ChevronRight, ArrowRight } from 'lucide-react';
import { useRef, useState, useEffect } from 'react';
import { listingsData } from '../data/listings';
import { supabase } from '../../utils/supabase';

const popularListings: Listing[] = [
  {
    id: '1',
    imageUrl: listingsData['1'].imageUrl,
    propertyType: listingsData['1'].propertyType,
    location: listingsData['1'].location,
    price: listingsData['1'].price,
    rating: listingsData['1'].rating,
    bookingType: listingsData['1'].bookingType,
  },
  {
    id: '2',
    imageUrl: listingsData['2'].imageUrl,
    propertyType: listingsData['2'].propertyType,
    location: listingsData['2'].location,
    price: listingsData['2'].price,
    rating: listingsData['2'].rating,
    bookingType: listingsData['2'].bookingType,
  },
  {
    id: '3',
    imageUrl: listingsData['3'].imageUrl,
    propertyType: listingsData['3'].propertyType,
    location: listingsData['3'].location,
    price: listingsData['3'].price,
    rating: listingsData['3'].rating,
    bookingType: listingsData['3'].bookingType,
  },
  {
    id: '4',
    imageUrl: listingsData['4'].imageUrl,
    propertyType: listingsData['4'].propertyType,
    location: listingsData['4'].location,
    price: listingsData['4'].price,
    rating: listingsData['4'].rating,
    bookingType: listingsData['4'].bookingType,
  },
  {
    id: '5',
    imageUrl: listingsData['5'].imageUrl,
    propertyType: listingsData['5'].propertyType,
    location: listingsData['5'].location,
    price: listingsData['5'].price,
    rating: listingsData['5'].rating,
    bookingType: listingsData['5'].bookingType,
  },
  {
    id: '6',
    imageUrl: listingsData['6'].imageUrl,
    propertyType: listingsData['6'].propertyType,
    location: listingsData['6'].location,
    price: listingsData['6'].price,
    rating: listingsData['6'].rating,
    bookingType: listingsData['6'].bookingType,
  },
  {
    id: '7',
    imageUrl: listingsData['7'].imageUrl,
    propertyType: listingsData['7'].propertyType,
    location: listingsData['7'].location,
    price: listingsData['7'].price,
    rating: listingsData['7'].rating,
    bookingType: listingsData['7'].bookingType,
  },
];

const weekendListings: Listing[] = [
  {
    id: '3',
    imageUrl: 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800&q=80',
    propertyType: listingsData['3'].propertyType,
    location: listingsData['3'].location,
    price: listingsData['3'].price,
    rating: listingsData['3'].rating,
    bookingType: listingsData['3'].bookingType,
    guestFavorite: true,
  },
  {
    id: '2',
    imageUrl: 'https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=800&q=80',
    propertyType: listingsData['2'].propertyType,
    location: listingsData['2'].location,
    price: listingsData['2'].price,
    rating: listingsData['2'].rating,
    bookingType: listingsData['2'].bookingType,
    guestFavorite: true,
  },
  {
    id: '7',
    imageUrl: 'https://images.unsplash.com/photo-1582268611958-ebfd161ef9cf?w=800&q=80',
    propertyType: listingsData['7'].propertyType,
    location: listingsData['7'].location,
    price: listingsData['7'].price,
    rating: listingsData['7'].rating,
    bookingType: listingsData['7'].bookingType,
  },
  {
    id: '5',
    imageUrl: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&q=80',
    propertyType: listingsData['5'].propertyType,
    location: listingsData['5'].location,
    price: listingsData['5'].price,
    rating: listingsData['5'].rating,
    bookingType: listingsData['5'].bookingType,
    guestFavorite: true,
  },
  {
    id: '6',
    imageUrl: 'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=800&q=80',
    propertyType: listingsData['6'].propertyType,
    location: listingsData['6'].location,
    price: listingsData['6'].price,
    rating: listingsData['6'].rating,
    bookingType: listingsData['6'].bookingType,
  },
  {
    id: '1',
    imageUrl: 'https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?w=800&q=80',
    propertyType: listingsData['1'].propertyType,
    location: listingsData['1'].location,
    price: listingsData['1'].price,
    rating: listingsData['1'].rating,
    bookingType: listingsData['1'].bookingType,
  },
  {
    id: '4',
    imageUrl: 'https://images.unsplash.com/photo-1600607687644-c7171b42498f?w=800&q=80',
    propertyType: listingsData['4'].propertyType,
    location: listingsData['4'].location,
    price: listingsData['4'].price,
    rating: listingsData['4'].rating,
    bookingType: listingsData['4'].bookingType,
    guestFavorite: true,
  },
];

function ListingSection({ 
  title, 
  listings 
}: { 
  title: string; 
  listings: Listing[] 
}) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = 320;
      const newScrollLeft = direction === 'left' 
        ? scrollRef.current.scrollLeft - scrollAmount
        : scrollRef.current.scrollLeft + scrollAmount;
      
      scrollRef.current.scrollTo({
        left: newScrollLeft,
        behavior: 'smooth'
      });
    }
  };

  return (
    <section className="py-12">
      <div className="max-w-[1440px] mx-auto px-6 lg:px-20">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-semibold text-[#222222]">{title}</h2>
          <button className="flex items-center gap-2 text-[#FF385C] hover:text-[#E31C5F] font-semibold transition-colors">
            View all
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        <div className="relative group/section">
          {/* Left Arrow */}
          <button
            onClick={() => scroll('left')}
            className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 z-10 bg-white border border-[#EBEBEB] rounded-full p-2 shadow-lg hover:shadow-xl transition-all opacity-0 group-hover/section:opacity-100"
          >
            <ChevronLeft className="w-5 h-5 text-[#222222]" />
          </button>

          {/* Right Arrow */}
          <button
            onClick={() => scroll('right')}
            className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 z-10 bg-white border border-[#EBEBEB] rounded-full p-2 shadow-lg hover:shadow-xl transition-all opacity-0 group-hover/section:opacity-100"
          >
            <ChevronRight className="w-5 h-5 text-[#222222]" />
          </button>

          {/* Scrollable Container */}
          <div 
            ref={scrollRef}
            className="flex gap-5 overflow-x-auto scrollbar-hide scroll-smooth"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {listings.map((listing) => (
              <ListingCard key={listing.id} listing={listing} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

export function LandingPage() {
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authTab, setAuthTab] = useState<'login' | 'signup'>('login');
  const [showHostNotice, setShowHostNotice] = useState(false);
  const [resetSearch, setResetSearch] = useState(false);
  const [liveListings, setLiveListings] = useState<Listing[]>([]);
  const [liveWeekendListings, setLiveWeekendListings] = useState<Listing[]>([]);

  useEffect(() => {
    const fetchListings = async () => {
      try {
        const { data, error } = await supabase
          .schema('listings_db')
          .from('property_details')
          .select('*')
          .eq('status', 'ACTIVE');

        if (error) {
          console.error('Error fetching from Supabase:', error);
          return;
        }
        
        if (data && data.length > 0) {
          const mapped: Listing[] = data.map((r: any) => ({
            id: r.listing_id,
            propertyType: r.title,
            location: r.location,
            price: Number(r.price_per_night),
            rating: 4.9, // Default fallback
            bookingType: r.booking_mode === 'INSTANT' ? 'instant' : 'request',
            imageUrl: r.image_url || 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&q=80',
          }));
          setLiveListings(mapped);
          setLiveWeekendListings([...mapped].reverse());
        }
      } catch (err) {
        console.error('Failed to fetch listings:', err);
      }
    };
    fetchListings();
  }, []);

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

  const handleLogoClick = () => {
    setResetSearch(true);
    setTimeout(() => setResetSearch(false), 100);
  };

  return (
    <div className="min-h-screen bg-white">
      <Navbar onOpenAuth={handleOpenAuth} onOpenAuthForHost={handleOpenAuthForHost} />
      
      {/* Hero Section with Search */}
      <section className="pt-16 pb-12 px-6 bg-[#FFF5F7]">
        <div className="max-w-[1440px] mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-5xl font-bold text-[#222222] mb-4">
              Find your perfect stay
            </h1>
            <p className="text-xl text-[#717171]">
              Discover amazing homes and experiences around Singapore
            </p>
          </div>
          <SearchBar variant="hero" onReset={resetSearch} />
        </div>
      </section>

      {/* Popular Homes Section */}
      <ListingSection 
        title="Popular homes in Singapore" 
        listings={liveListings}
      />

      {/* Available This Weekend Section */}
      <div className="bg-[#FFF5F7]">
        <ListingSection 
          title="Available this weekend in Singapore" 
          listings={liveWeekendListings}
        />
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