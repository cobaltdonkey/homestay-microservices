import { Search, ChevronDown } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { DatePicker } from './DatePicker';
import { useNavigate } from 'react-router';

interface SearchBarProps {
  variant?: 'hero' | 'navbar';
  onReset?: boolean;
  initialRegion?: string;
  initialCheckIn?: Date | null;
  initialCheckOut?: Date | null;
  initialGuests?: number;
}

export function SearchBar({ variant = 'hero', onReset, initialRegion = '', initialCheckIn = null, initialCheckOut = null, initialGuests = 0 }: SearchBarProps) {
  const navigate = useNavigate();
  const [showRegionDropdown, setShowRegionDropdown] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showGuestsDropdown, setShowGuestsDropdown] = useState(false);
  const [selectedRegion, setSelectedRegion] = useState(initialRegion);
  const [checkIn, setCheckIn] = useState<Date | null>(initialCheckIn);
  const [checkOut, setCheckOut] = useState<Date | null>(initialCheckOut);
  const [guests, setGuests] = useState(initialGuests);
  const [errors, setErrors] = useState({ region: false, dates: false, guests: false });
  
  const regionRef = useRef<HTMLDivElement>(null);
  const dateRef = useRef<HTMLDivElement>(null);
  const guestsRef = useRef<HTMLDivElement>(null);

  const regions = [
    'Central Region',
    'East Region',
    'North-East Region',
    'North Region',
    'West Region',
  ];

  useEffect(() => {
    if (onReset) {
      setSelectedRegion('');
      setCheckIn(null);
      setCheckOut(null);
      setGuests(0);
      setErrors({ region: false, dates: false, guests: false });
    }
  }, [onReset]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (regionRef.current && !regionRef.current.contains(event.target as Node)) {
        setShowRegionDropdown(false);
      }
      if (dateRef.current && !dateRef.current.contains(event.target as Node)) {
        setShowDatePicker(false);
      }
      if (guestsRef.current && !guestsRef.current.contains(event.target as Node)) {
        setShowGuestsDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleRegionSelect = (region: string) => {
    setSelectedRegion(region);
    setShowRegionDropdown(false);
    setErrors(prev => ({ ...prev, region: false }));
  };

  const handleDatesSelected = (newCheckIn: Date | null, newCheckOut: Date | null) => {
    setCheckIn(newCheckIn);
    setCheckOut(newCheckOut);
    if (newCheckIn && newCheckOut) {
      setErrors(prev => ({ ...prev, dates: false }));
      setShowDatePicker(false); // Auto-close when both dates are selected
    }
  };

  const formatDateRange = () => {
    if (!checkIn || !checkOut) return 'Add dates';
    const options: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short' };
    return `${checkIn.toLocaleDateString('en-GB', options)} – ${checkOut.toLocaleDateString('en-GB', options)}`;
  };

  const handleGuestChange = (delta: number) => {
    const newGuests = Math.max(0, guests + delta);
    setGuests(newGuests);
    if (newGuests > 0) {
      setErrors(prev => ({ ...prev, guests: false }));
    }
  };

  const calculateNights = () => {
    if (!checkIn || !checkOut) return 0;
    const diffTime = Math.abs(checkOut.getTime() - checkIn.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const handleSearch = () => {
    const newErrors = {
      region: !selectedRegion,
      dates: !checkIn || !checkOut,
      guests: guests === 0,
    };

    setErrors(newErrors);

    if (!newErrors.region && !newErrors.dates && !newErrors.guests) {
      // Navigate to search results
      const nights = calculateNights();
      navigate('/search', { 
        state: { 
          region: selectedRegion, 
          nights, 
          guests,
          checkIn: checkIn?.toISOString(),
          checkOut: checkOut?.toISOString()
        } 
      });
    }
  };

  if (variant === 'hero') {
    return (
      <div 
        className="max-w-4xl mx-auto"
        onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
      >
        <div className="flex items-center border-2 border-[#EBEBEB] rounded-full shadow-lg bg-white">
          {/* Where */}
          <div className="flex-1 relative" ref={regionRef}>
            <button 
              onClick={() => {
                setShowRegionDropdown(!showRegionDropdown);
                setShowDatePicker(false);
                setShowGuestsDropdown(false);
              }}
              className={`w-full px-8 py-5 border-r hover:bg-[#FFF5F7] rounded-l-full transition-colors text-left ${
                errors.region ? 'border-2 border-[#FF385C]' : 'border-[#EBEBEB]'
              }`}
            >
              <div className="text-sm font-semibold text-[#222222] mb-1">Where</div>
              <div className="text-base text-[#717171] flex items-center justify-between">
                <span>{selectedRegion || 'Search by region'}</span>
                <ChevronDown className="w-4 h-4" />
              </div>
            </button>
            
            {errors.region && (
              <div className="absolute top-full left-0 mt-2 px-3 py-1 bg-[#FF385C] text-white text-xs rounded-lg whitespace-nowrap">
                Please fill in this field
              </div>
            )}
            
            {showRegionDropdown && (
              <div className="absolute top-full left-0 mt-2 w-full bg-white border border-[#EBEBEB] rounded-xl shadow-xl z-10">
                <div className="p-2">
                  {regions.map((region) => (
                    <button
                      key={region}
                      onClick={() => handleRegionSelect(region)}
                      className="w-full text-left px-4 py-3 hover:bg-[#FFF5F7] rounded-lg transition-colors text-[#222222]"
                    >
                      {region}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
          
          {/* When */}
          <div className="flex-1 relative" ref={dateRef}>
            <button 
              onClick={() => {
                setShowDatePicker(!showDatePicker);
                setShowRegionDropdown(false);
                setShowGuestsDropdown(false);
              }}
              className={`w-full px-8 py-5 border-r hover:bg-[#FFF5F7] transition-colors text-left ${
                errors.dates ? 'border-2 border-[#FF385C]' : 'border-[#EBEBEB]'
              }`}
            >
              <div className="text-sm font-semibold text-[#222222] mb-1">When</div>
              <div className="text-base text-[#717171]">{formatDateRange()}</div>
            </button>
            
            {errors.dates && (
              <div className="absolute top-full left-0 mt-2 px-3 py-1 bg-[#FF385C] text-white text-xs rounded-lg whitespace-nowrap z-50">
                Please fill in this field
              </div>
            )}
            
            {showDatePicker && (
              <DatePicker
                onClose={() => setShowDatePicker(false)}
                onDatesSelected={handleDatesSelected}
                initialCheckIn={checkIn}
                initialCheckOut={checkOut}
              />
            )}
          </div>

          {/* No. of guests */}
          <div className="flex-1 relative" ref={guestsRef}>
            <button 
              onClick={() => {
                setShowGuestsDropdown(!showGuestsDropdown);
                setShowRegionDropdown(false);
                setShowDatePicker(false);
              }}
              className={`w-full px-8 py-5 hover:bg-[#FFF5F7] transition-colors text-left ${
                errors.guests ? 'border-2 border-[#FF385C]' : ''
              }`}
            >
              <div className="text-sm font-semibold text-[#222222] mb-1">No. of guests</div>
              <div className="text-base text-[#717171]">
                {guests > 0 ? `${guests} guest${guests > 1 ? 's' : ''}` : 'Add guests'}
              </div>
            </button>
            
            {errors.guests && (
              <div className="absolute top-full left-0 mt-2 px-3 py-1 bg-[#FF385C] text-white text-xs rounded-lg whitespace-nowrap z-50">
                Please fill in this field
              </div>
            )}
            
            {showGuestsDropdown && (
              <div className="absolute top-full right-0 mt-2 w-64 bg-white border border-[#EBEBEB] rounded-xl shadow-xl z-10 p-4">
                <div className="flex items-center justify-between">
                  <span className="text-[#222222] font-semibold">Guests</span>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => handleGuestChange(-1)}
                      disabled={guests === 0}
                      className="w-8 h-8 rounded-full border-2 border-[#EBEBEB] flex items-center justify-center hover:border-[#222222] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    >
                      −
                    </button>
                    <span className="w-8 text-center font-semibold text-[#222222]">{guests}</span>
                    <button
                      onClick={() => handleGuestChange(1)}
                      className="w-8 h-8 rounded-full border-2 border-[#EBEBEB] flex items-center justify-center hover:border-[#222222] transition-colors"
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Search Button */}
          <button 
            onClick={handleSearch}
            className="mr-3 bg-[#FF385C] hover:bg-[#E31C5F] text-white p-4 rounded-full transition-colors"
          >
            <Search className="w-5 h-5" />
          </button>
        </div>
      </div>
    );
  }

  return null;
}