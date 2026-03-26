import { useState } from 'react';
import { X } from 'lucide-react';

interface PendingApproval {
  id: string;
  bookingId: string;
  guestName: string;
  guestAvatar: string;
  listingTitle: string;
  dates: string;
  guests: number;
  total: number;
  expiresIn: { hours: number; minutes: number };
}

interface HostApprovalModalProps {
  approval: PendingApproval;
  action: 'approve' | 'reject';
  onClose: () => void;
  onConfirm?: (action: 'approve' | 'reject', reason?: string) => void;
}

export function HostApprovalModal({ approval, action, onClose, onConfirm }: HostApprovalModalProps) {
  const [rejectReason, setRejectReason] = useState('');

  const handleConfirm = () => {
    // Call the onConfirm callback if provided
    if (onConfirm) {
      onConfirm(action, action === 'reject' ? rejectReason : undefined);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl w-full max-w-[500px] shadow-2xl">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 hover:bg-[#F7F7F7] rounded-full transition-colors"
        >
          <X className="w-5 h-5 text-[#222222]" />
        </button>

        {/* Content */}
        <div className="p-6">
          <h2 className="text-2xl font-semibold text-[#222222] mb-6">
            {action === 'approve' ? 'Confirm Approval' : 'Decline Booking'}
          </h2>

          {/* Booking Summary */}
          <div className="bg-[#F7F7F7] rounded-lg p-4 mb-6 space-y-3">
            <div className="flex items-center gap-3 mb-3">
              <img
                src={approval.guestAvatar}
                alt={approval.guestName}
                className="w-12 h-12 rounded-full object-cover"
              />
              <div>
                <div className="font-semibold text-[#222222]">{approval.guestName}</div>
                <div className="text-sm text-[#717171]">{approval.bookingId}</div>
              </div>
            </div>

            <div className="border-t border-[#EBEBEB] pt-3 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-[#717171]">Listing</span>
                <span className="font-semibold text-[#222222]">{approval.listingTitle}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-[#717171]">Dates</span>
                <span className="font-semibold text-[#222222]">{approval.dates}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-[#717171]">Guests</span>
                <span className="font-semibold text-[#222222]">{approval.guests}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-[#717171]">Total</span>
                <span className="font-semibold text-[#222222]">SGD {approval.total.toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Rejection Reason (only for reject action) */}
          {action === 'reject' && (
            <div className="mb-6">
              <label className="block text-sm font-semibold text-[#222222] mb-2">
                Reason for declining (optional)
              </label>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Let the guest know why you're declining their request..."
                rows={4}
                className="w-full px-4 py-3 border border-[#EBEBEB] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF385C] resize-none"
              />
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 border-2 border-[#EBEBEB] text-[#222222] hover:bg-[#F7F7F7] font-semibold py-3 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              className={`flex-1 font-semibold py-3 rounded-lg transition-colors ${
                action === 'approve'
                  ? 'bg-[#FF385C] hover:bg-[#E31C5F] text-white'
                  : 'bg-[#DC2626] hover:bg-[#B91C1C] text-white'
              }`}
            >
              {action === 'approve' ? 'Approve' : 'Decline'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}