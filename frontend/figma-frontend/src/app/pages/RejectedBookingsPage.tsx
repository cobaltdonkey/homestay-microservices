import { useNavigate } from 'react-router';
import { Navbar } from '../components/Navbar';
import { StatusBadge } from '../components/StatusBadge';
import { useHostBookings } from '../contexts/HostBookingsContext';
import { ArrowLeft, Calendar, Users } from 'lucide-react';

export function RejectedBookingsPage() {
  const navigate = useNavigate();
  const { rejectedBookings } = useHostBookings();

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
        <h1 className="text-3xl font-semibold text-[#222222] mb-8">Rejected Bookings</h1>

        {/* Rejected Bookings List */}
        <div className="space-y-6">
          {rejectedBookings.map((booking) => (
            <div 
              key={booking.id}
              className="border border-[#EBEBEB] rounded-xl p-6"
            >
              <div className="flex gap-6">
                {/* Listing Image */}
                <div className="w-48 h-36 flex-shrink-0 rounded-lg overflow-hidden">
                  <img 
                    src={booking.listingImage} 
                    alt={booking.listingTitle}
                    className="w-full h-full object-cover"
                  />
                </div>

                {/* Content */}
                <div className="flex-1">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <img 
                          src={booking.guestAvatar} 
                          alt={booking.guestName}
                          className="w-10 h-10 rounded-full object-cover"
                        />
                        <div>
                          <h3 className="text-lg font-semibold text-[#222222]">
                            {booking.guestName}
                          </h3>
                          <p className="text-sm text-[#717171]">{booking.bookingId}</p>
                        </div>
                      </div>
                      <h4 className="text-base font-medium text-[#717171]">
                        {booking.listingTitle}
                      </h4>
                    </div>
                    <StatusBadge status="REJECTED" />
                  </div>

                  <div className="grid grid-cols-3 gap-4 mb-4">
                    <div className="flex items-center gap-2 text-sm text-[#717171]">
                      <Calendar className="w-4 h-4" />
                      <div>
                        <div className="text-[#222222] font-medium">{booking.dates}</div>
                        <div className="text-xs">Requested dates</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 text-sm text-[#717171]">
                      <Users className="w-4 h-4" />
                      <div>
                        <div className="text-[#222222] font-medium">{booking.guests} guests</div>
                        <div className="text-xs">Party size</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 text-sm text-[#717171]">
                      <div>
                        <div className="text-[#222222] font-medium">{booking.rejectedDate}</div>
                        <div className="text-xs">Rejected on</div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-[#FFF5F7] border border-[#FFE5EB] rounded-lg p-4">
                    <p className="text-sm font-semibold text-[#222222] mb-1">Rejection reason:</p>
                    <p className="text-sm text-[#717171]">{booking.rejectionReason}</p>
                  </div>
                </div>
              </div>
            </div>
          ))}

          {rejectedBookings.length === 0 && (
            <div className="text-center py-12 text-[#717171]">
              <p className="text-lg">No rejected bookings</p>
              <p className="text-sm mt-2">Rejected requests will appear here</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}