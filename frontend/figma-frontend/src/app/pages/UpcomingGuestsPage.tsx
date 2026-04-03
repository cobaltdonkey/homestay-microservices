import { useNavigate } from 'react-router';
import { Navbar } from '../components/Navbar';
import { StatusBadge } from '../components/StatusBadge';
import { useHostBookings } from '../contexts/HostBookingsContext';
import { ArrowLeft, MapPin, Calendar, Users, MessageCircle } from 'lucide-react';

export function UpcomingGuestsPage() {
  const navigate = useNavigate();
  const { upcomingGuests } = useHostBookings();

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
        <h1 className="text-3xl font-semibold text-[#222222] mb-8">Upcoming Guests</h1>

        {/* Guests List */}
        <div className="space-y-6">
          {upcomingGuests.map((guest) => (
            <div
              key={guest.id}
              className="border border-[#EBEBEB] rounded-xl p-6 hover:shadow-lg transition-shadow"
            >
              <div className="flex gap-6">
                {/* Listing Image */}
                <div className="w-48 h-36 flex-shrink-0 rounded-lg overflow-hidden">
                  <img
                    src={guest.listingImage}
                    alt={guest.listingTitle}
                    className="w-full h-full object-cover"
                  />
                </div>

                {/* Content */}
                <div className="flex-1">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <img
                          src={guest.guestAvatar}
                          alt={guest.guestName}
                          className="w-10 h-10 rounded-full object-cover"
                        />
                        <div>
                          <h3 className="text-lg font-semibold text-[#222222]">
                            {guest.guestName}
                          </h3>
                          <p className="text-sm text-[#717171]">{guest.bookingId}</p>
                        </div>
                      </div>
                      <h4 className="text-base font-medium text-[#717171]">
                        {guest.listingTitle}
                      </h4>
                    </div>
                    <StatusBadge status="CONFIRMED" />
                  </div>

                  <div className="grid grid-cols-3 gap-4 mb-4">
                    <div className="flex items-center gap-2 text-sm text-[#717171]">
                      <Calendar className="w-4 h-4" />
                      <div>
                        <div className="text-[#222222] font-medium">{guest.checkIn}</div>
                        <div className="text-xs">Check-in</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 text-sm text-[#717171]">
                      <Calendar className="w-4 h-4" />
                      <div>
                        <div className="text-[#222222] font-medium">{guest.checkOut}</div>
                        <div className="text-xs">Check-out</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 text-sm text-[#717171]">
                      <Users className="w-4 h-4" />
                      <div>
                        <div className="text-[#222222] font-medium">{guest.guests} guests</div>
                        <div className="text-xs">Party size</div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="text-lg font-semibold text-[#222222]">
                      Total: SGD {guest.total.toLocaleString()}
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

          {upcomingGuests.length === 0 && (
            <div className="text-center py-12 text-[#717171]">
              <p className="text-lg">No upcoming guests at the moment</p>
              <p className="text-sm mt-2">Approved bookings will appear here</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}