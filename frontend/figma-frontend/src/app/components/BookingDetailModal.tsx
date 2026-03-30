import { X, Star, Clock } from 'lucide-react';
import { StatusBadge, BookingStatus } from './StatusBadge';

interface Booking {
  id: string;
  bookingId: string;
  listingTitle: string;
  listingImage: string;
  dates: string;
  status: BookingStatus;
  guests: number;
  total: number;
  timeRemaining?: { hours: number; minutes: number; seconds: number };
}

interface BookingDetailModalProps {
  booking: Booking;
  onClose: () => void;
}

export function BookingDetailModal({ booking, onClose }: BookingDetailModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl w-full max-w-[600px] max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 hover:bg-[#F7F7F7] rounded-full transition-colors z-10"
        >
          <X className="w-5 h-5 text-[#222222]" />
        </button>

        {/* Content */}
        <div className="p-6">
          <h2 className="text-2xl font-semibold text-[#222222] mb-6">
            Booking Details
          </h2>

          {/* Listing Info */}
          <div className="flex gap-4 mb-6 pb-6 border-b border-[#EBEBEB]">
            <img
              src={booking.listingImage}
              alt={booking.listingTitle}
              className="w-32 h-32 rounded-lg object-cover"
            />
            <div className="flex-1">
              <h3 className="font-semibold text-[#222222] mb-2 text-lg">
                {booking.listingTitle}
              </h3>
              <div className="flex items-center gap-1 mb-2">
                <Star className="w-3 h-3 fill-[#222222] stroke-[#222222]" />
                <span className="text-sm font-semibold text-[#222222]">4.91</span>
                <span className="text-sm text-[#717171]">(127 reviews)</span>
              </div>
              <div className="mt-2">
                <StatusBadge status={booking.status} />
              </div>
            </div>
          </div>

          {/* Booking Information */}
          <div className="space-y-4 mb-6 pb-6 border-b border-[#EBEBEB]">
            <h3 className="font-semibold text-[#222222] mb-3">Reservation Details</h3>
            
            <div className="flex justify-between">
              <span className="text-[#717171]">Booking ID</span>
              <span className="font-semibold text-[#222222]">{booking.bookingId}</span>
            </div>
            
            <div className="flex justify-between">
              <span className="text-[#717171]">Dates</span>
              <span className="font-semibold text-[#222222]">{booking.dates}</span>
            </div>
            
            <div className="flex justify-between">
              <span className="text-[#717171]">Guests</span>
              <span className="font-semibold text-[#222222]">
                {booking.guests} guest{booking.guests > 1 ? 's' : ''}
              </span>
            </div>
          </div>

          {/* Countdown Timer for Pending Host */}
          {booking.status === 'PENDING_HOST' && booking.timeRemaining && (
            <div className="bg-[#FFF9E6] border border-[#FFE066] rounded-xl p-4 mb-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-[#FF385C]" />
                  <span className="font-semibold text-[#222222]">Waiting for host approval</span>
                </div>
                <div className="text-lg font-bold text-[#FF385C]">
                  {booking.timeRemaining.hours}h {booking.timeRemaining.minutes}m {booking.timeRemaining.seconds}s
                </div>
              </div>
              <p className="text-sm text-[#717171] mt-2">
                The host has 24 hours to respond to your request
              </p>
            </div>
          )}

          {/* Payment Summary */}
          <div className="space-y-4 mb-6 pb-6 border-b border-[#EBEBEB]">
            <h3 className="font-semibold text-[#222222] mb-3">Payment Summary</h3>
            
            <div className="flex justify-between text-[#222222]">
              <span>SGD 320 × 3 nights</span>
              <span>SGD 960</span>
            </div>
            
            <div className="flex justify-between text-[#222222]">
              <span>Cleaning fee</span>
              <span>SGD 30</span>
            </div>
            
            <div className="flex justify-between text-[#222222]">
              <span>Refundable deposit</span>
              <span>SGD 200</span>
            </div>
          </div>

          {/* Total */}
          <div className="flex justify-between font-semibold text-[#222222] text-lg mb-6">
            <span>Total</span>
            <span>SGD {booking.total.toLocaleString()}</span>
          </div>

          {/* Deposit Status */}
          <div className="bg-[#F7F7F7] rounded-lg p-4">
            <div className="flex justify-between items-center">
              <span className="font-semibold text-[#222222]">Deposit Status</span>
              <StatusBadge status="PAID" />
            </div>
            <p className="text-sm text-[#717171] mt-2">
              Security deposit will be released 48 hours after check-out if no damage is reported
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}