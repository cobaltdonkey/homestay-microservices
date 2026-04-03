import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { Navbar } from '../components/Navbar';
import { ArrowLeft, MapPin, Star, DollarSign, Loader2 } from 'lucide-react';
import { supabase } from '../../utils/supabase';

interface HostListing {
  id: string;
  imageUrl: string;
  title: string;
  propertyType: string;
  location: string;
  price: number;
  rating: number;
  totalBookings: number;
  status: 'active' | 'paused';
}

// Hardcoded sample data removed; replaced with local state and fetch logic below.


export function ActiveListingsPage() {
  const navigate = useNavigate();
  const [listings, setListings] = useState<HostListing[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchHostListings = async () => {
      // 1. Get current logged-in host's ID
      const storedUser = localStorage.getItem('secondhome_user');
      const currentUser = storedUser ? JSON.parse(storedUser) : null;
      const hostId = currentUser?.userId;

      if (!hostId) {
        setIsLoading(false);
        return;
      }

      try {
        // 2. Fetch from Supabase (listings_db schema)
        const { data, error } = await supabase
          .schema('listings_db')
          .from('property_details')
          .select('*')
          .eq('host_id', hostId);

        if (error) {
          console.error('[Supabase Fetch Error]:', error);
          throw error;
        }

        if (data) {
          // 3. Map database objects to UI interface
          const mapped: HostListing[] = data.map(item => ({
            id: item.listing_id,
            imageUrl: item.image_url || 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&q=80',
            title: item.title,
            propertyType: item.booking_mode === 'INSTANT' ? 'Entire property (Instant)' : 'Entire property (Request)',
            location: item.location,
            price: Number(item.price_per_night),
            rating: 4.9, // Default for now — not currently in listings_db
            totalBookings: 0, // Default for now — could be expanded via aggregate query
            status: item.status === 'ACTIVE' ? 'active' : 'paused'
          }));
          setListings(mapped);
        }
      } catch (err) {
        console.error('Failed to load host listings:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchHostListings();
  }, []);

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      <div className="max-w-[1440px] mx-auto px-6 lg:px-20 py-8">
        {/* Back Arrow */}
        <button 
          onClick={() => navigate('/host/dashboard')}
          className="flex items-center gap-2 text-[#222222] hover:text-[#717171] mb-6 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="font-semibold">Back to dashboard</span>
        </button>

        {/* Page Heading */}
        <div className="mb-8">
          <h1 className="text-3xl font-semibold text-[#222222]">Active Listings</h1>
          <p className="text-[#717171] mt-2">Your hosted properties</p>
        </div>

        {/* Listings Grid */}
        <div className="grid grid-cols-1 gap-6">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20 text-[#717171]">
              <Loader2 className="w-10 h-10 animate-spin mb-4 text-[#FF385C]" />
              <p>Loading your listings...</p>
            </div>
          ) : listings.length > 0 ? (
            listings.map((listing) => (
              <div 
                key={listing.id}
                className="border border-[#EBEBEB] rounded-xl overflow-hidden hover:shadow-lg transition-shadow"
              >
                {/* Same listing card structure as before but using the 'listings' state */}
                <div className="flex gap-6">
                  {/* Image */}
                  <div className="w-64 h-48 flex-shrink-0">
                    <img 
                      src={listing.imageUrl} 
                      alt={listing.title}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  {/* Content */}
                  <div className="flex-1 py-4 pr-6">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="text-xl font-semibold text-[#222222] mb-1">
                          {listing.title}
                        </h3>
                        <p className="text-sm text-[#717171]">{listing.propertyType}</p>
                      </div>
                      <div className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        listing.status === 'active' 
                          ? 'bg-green-100 text-green-700' 
                          : 'bg-gray-100 text-gray-700'
                      }`}>
                        {listing.status === 'active' ? 'Active' : 'Paused'}
                      </div>
                    </div>

                    <div className="flex items-center gap-1 text-sm text-[#222222] mb-4">
                      <MapPin className="w-4 h-4" />
                      <span>{listing.location}</span>
                    </div>

                    <div className="grid grid-cols-3 gap-6">
                      <div>
                        <div className="flex items-center gap-1 text-[#222222] mb-1">
                          <Star className="w-4 h-4 fill-[#FF385C] text-[#FF385C]" />
                          <span className="font-semibold">{listing.rating}</span>
                        </div>
                        <p className="text-xs text-[#717171]">Guest rating</p>
                      </div>

                      <div>
                        <div className="text-[#222222] font-semibold mb-1">
                          {listing.totalBookings}
                        </div>
                        <p className="text-xs text-[#717171]">Total bookings</p>
                      </div>

                      <div>
                        <div className="flex items-center gap-1 text-[#222222] mb-1">
                          <DollarSign className="w-4 h-4" />
                          <span className="font-semibold">{listing.price}</span>
                          <span className="text-sm text-[#717171]">/ night</span>
                        </div>
                        <p className="text-xs text-[#717171]">Nightly rate</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-20 border-2 border-dashed border-[#EBEBEB] rounded-xl">
              <p className="text-[#717171] mb-2 font-medium">No listings found</p>
              <p className="text-sm text-[#717171]">You haven't added any properties to SecondHome yet.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}