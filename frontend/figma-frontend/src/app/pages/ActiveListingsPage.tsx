import { useNavigate } from 'react-router';
import { Navbar } from '../components/Navbar';
import { ArrowLeft, MapPin, Star, DollarSign } from 'lucide-react';

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

const hostListings: HostListing[] = [
  {
    id: '1',
    imageUrl: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&q=80',
    title: 'Modern Loft in Bugis',
    propertyType: 'Entire loft',
    location: 'Bugis, Singapore',
    price: 350,
    rating: 4.92,
    totalBookings: 24,
    status: 'active',
  },
  {
    id: '2',
    imageUrl: 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800&q=80',
    title: 'Luxury Villa in East Coast',
    propertyType: 'Entire villa',
    location: 'East Coast, Singapore',
    price: 890,
    rating: 4.98,
    totalBookings: 18,
    status: 'active',
  },
  {
    id: '3',
    imageUrl: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&q=80',
    title: 'Cozy Apartment in Tiong Bahru',
    propertyType: 'Entire apartment',
    location: 'Tiong Bahru, Singapore',
    price: 280,
    rating: 4.85,
    totalBookings: 31,
    status: 'active',
  },
];

export function ActiveListingsPage() {
  const navigate = useNavigate();

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
          {hostListings.map((listing) => (
            <div 
              key={listing.id}
              className="border border-[#EBEBEB] rounded-xl overflow-hidden hover:shadow-lg transition-shadow"
            >
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
          ))}
        </div>
      </div>
    </div>
  );
}