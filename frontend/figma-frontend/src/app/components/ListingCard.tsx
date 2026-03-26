import { Heart, Star, Zap } from 'lucide-react';
import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router';

export interface Listing {
  id: string;
  imageUrl: string;
  propertyType: string;
  location: string;
  price: number;
  rating: number;
  bookingType: 'instant' | 'request';
  guestFavorite?: boolean;
}

interface ListingCardProps {
  listing: Listing;
}

export function ListingCard({ listing }: ListingCardProps) {
  const [isFavorited, setIsFavorited] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const handleCardClick = () => {
    // Pass search state if available - this includes checkIn, checkOut, and guests
    const searchState = location.state || {};
    navigate(`/listing/${listing.id}`, {
      state: searchState,
    });
  };

  return (
    <div 
      className="group cursor-pointer flex-shrink-0 w-[300px]"
      onClick={handleCardClick}
    >
      <div className="relative mb-3 overflow-hidden rounded-xl aspect-[4/3]">
        <img 
          src={listing.imageUrl} 
          alt={`${listing.propertyType} in ${listing.location}`}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
        
        {/* Favorite Heart */}
        <button 
          onClick={(e) => {
            e.stopPropagation();
            setIsFavorited(!isFavorited);
          }}
          className="absolute top-3 right-3 p-2 hover:scale-110 transition-transform"
        >
          <Heart 
            className={`w-6 h-6 ${isFavorited ? 'fill-[#FF385C] stroke-[#FF385C]' : 'fill-white/70 stroke-white'}`}
            strokeWidth={2}
          />
        </button>

        {/* Booking Type Badge */}
        <div className="absolute top-3 left-3">
          {listing.bookingType === 'instant' ? (
            <div className="flex items-center gap-1.5 bg-[#FF385C] text-white px-3 py-1.5 rounded-full text-xs font-semibold">
              <Zap className="w-3 h-3 fill-current" />
              Instant Book
            </div>
          ) : (
            <div className="flex items-center gap-1.5 bg-white border border-[#EBEBEB] text-[#717171] px-3 py-1.5 rounded-full text-xs font-semibold">
              Request to Book
            </div>
          )}
        </div>

        {/* Guest Favorite Badge */}
        {listing.guestFavorite && (
          <div className="absolute bottom-3 left-3">
            <div className="flex items-center gap-1.5 bg-white border border-[#EBEBEB] text-[#222222] px-3 py-1.5 rounded-full text-xs font-semibold">
              ⭐ Guest favourite
            </div>
          </div>
        )}
      </div>

      <div className="space-y-1">
        <div className="flex items-start justify-between">
          <h3 className="font-semibold text-[#222222]">
            {listing.propertyType} in {listing.location}
          </h3>
          <div className="flex items-center gap-1">
            <Star className="w-4 h-4 fill-[#222222] stroke-[#222222]" />
            <span className="text-sm text-[#222222]">{listing.rating.toFixed(2)}</span>
          </div>
        </div>
        <div className="text-[#222222]">
          <span className="font-semibold">SGD {listing.price}</span>
          <span className="text-[#717171]"> / night</span>
        </div>
      </div>
    </div>
  );
}