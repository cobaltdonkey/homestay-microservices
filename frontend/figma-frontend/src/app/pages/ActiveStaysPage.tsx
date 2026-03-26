import { useNavigate } from 'react-router';
import { Navbar } from '../components/Navbar';
import { StatusBadge } from '../components/StatusBadge';
import { ArrowLeft, Calendar, Users, MessageCircle, DollarSign } from 'lucide-react';

interface ActiveStay {
  id: string;
  bookingId: string;
  guestName: string;
  guestAvatar: string;
  listingTitle: string;
  listingImage: string;
  checkIn: string;
  checkOut: string;
  guests: number;
  depositAmount: number;
  depositStatus: 'held';
  daysRemaining: number;
}

const mockActiveStays: ActiveStay[] = [
  {
    id: '1',
    bookingId: 'BKG-20240004',
    guestName: 'Emma Chen',
    guestAvatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&q=80',
    listingTitle: 'Modern Loft in Bugis',
    listingImage: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=400&q=80',
    checkIn: '20 Mar 2026',
    checkOut: '27 Mar 2026',
    guests: 2,
    depositAmount: 500,
    depositStatus: 'held',
    daysRemaining: 4,
  },
];

export function ActiveStaysPage() {
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
        <h1 className="text-3xl font-semibold text-[#222222] mb-8">Active Stays</h1>

        {/* Active Stays List */}
        <div className="space-y-6">
          {mockActiveStays.map((stay) => (
            <div 
              key={stay.id}
              className="border border-[#EBEBEB] rounded-xl p-6 hover:shadow-lg transition-shadow"
            >
              <div className="flex gap-6">
                {/* Listing Image */}
                <div className="w-48 h-36 flex-shrink-0 rounded-lg overflow-hidden">
                  <img 
                    src={stay.listingImage} 
                    alt={stay.listingTitle}
                    className="w-full h-full object-cover"
                  />
                </div>

                {/* Content */}
                <div className="flex-1">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <img 
                          src={stay.guestAvatar} 
                          alt={stay.guestName}
                          className="w-10 h-10 rounded-full object-cover"
                        />
                        <div>
                          <h3 className="text-lg font-semibold text-[#222222]">
                            {stay.guestName}
                          </h3>
                          <p className="text-sm text-[#717171]">{stay.bookingId}</p>
                        </div>
                      </div>
                      <h4 className="text-base font-medium text-[#717171]">
                        {stay.listingTitle}
                      </h4>
                    </div>
                    <StatusBadge status="CONFIRMED" />
                  </div>

                  <div className="grid grid-cols-4 gap-4 mb-4">
                    <div className="flex items-center gap-2 text-sm text-[#717171]">
                      <Calendar className="w-4 h-4" />
                      <div>
                        <div className="text-[#222222] font-medium">{stay.checkIn}</div>
                        <div className="text-xs">Check-in</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 text-sm text-[#717171]">
                      <Calendar className="w-4 h-4" />
                      <div>
                        <div className="text-[#222222] font-medium">{stay.checkOut}</div>
                        <div className="text-xs">Check-out</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 text-sm text-[#717171]">
                      <Users className="w-4 h-4" />
                      <div>
                        <div className="text-[#222222] font-medium">{stay.guests} guests</div>
                        <div className="text-xs">Party size</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 text-sm text-[#717171]">
                      <DollarSign className="w-4 h-4" />
                      <div>
                        <div className="text-[#222222] font-medium">SGD {stay.depositAmount}</div>
                        <div className="text-xs">Deposit held</div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="text-sm">
                      <span className="inline-flex items-center px-3 py-1 bg-green-100 text-green-700 rounded-full font-semibold">
                        {stay.daysRemaining} days remaining
                      </span>
                    </div>
                    <button className="flex items-center gap-2 px-4 py-2 border border-[#FF385C] text-[#FF385C] rounded-lg hover:bg-[#FFF5F7] transition-colors">
                      <MessageCircle className="w-4 h-4" />
                      <span className="font-semibold">Message guest</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}

          {mockActiveStays.length === 0 && (
            <div className="text-center py-12 text-[#717171]">
              <p className="text-lg">No active stays at the moment</p>
              <p className="text-sm mt-2">Current guests will appear here</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}