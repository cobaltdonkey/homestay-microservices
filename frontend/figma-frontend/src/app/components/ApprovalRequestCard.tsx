interface PendingApproval {
  id: string;
  bookingId: string;
  guestName: string;
  guestAvatar: string;
  listingTitle: string;
  dates: string;
  guests: number;
  total: number;
  expiresIn: { hours: number; minutes: number; seconds: number };
}

interface ApprovalRequestCardProps {
  approval: PendingApproval;
  onApprove: () => void;
  onReject: () => void;
}

export function ApprovalRequestCard({ approval, onApprove, onReject }: ApprovalRequestCardProps) {
  return (
    <div className="bg-white border border-[#EBEBEB] rounded-xl p-6 hover:shadow-md transition-shadow">
      <div className="flex items-center gap-4 mb-4">
        {/* Guest Avatar */}
        <img
          src={approval.guestAvatar}
          alt={approval.guestName}
          className="w-16 h-16 rounded-full object-cover"
        />

        {/* Guest and Booking Info */}
        <div className="flex-1">
          <h3 className="font-semibold text-[#222222] text-lg mb-1">
            {approval.guestName}
          </h3>
          <p className="text-sm text-[#717171]">
            {approval.listingTitle} · {approval.dates}
          </p>
          <p className="text-sm text-[#717171]">
            {approval.guests} guest{approval.guests > 1 ? 's' : ''} · SGD {approval.total.toLocaleString()}
          </p>
        </div>

        {/* Countdown Timer */}
        <div className="text-right">
          <div className="text-sm text-[#717171] mb-1">Expires in</div>
          <div className="text-lg font-bold text-[#FF385C]">
            {approval.expiresIn.hours}h {approval.expiresIn.minutes}m {approval.expiresIn.seconds}s
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3">
        <button
          onClick={onApprove}
          className="flex-1 bg-[#FF385C] hover:bg-[#E31C5F] text-white font-semibold py-3 rounded-lg transition-colors"
        >
          Approve
        </button>
        <button
          onClick={onReject}
          className="flex-1 border-2 border-[#222222] text-[#222222] hover:bg-[#F7F7F7] font-semibold py-3 rounded-lg transition-colors"
        >
          Reject
        </button>
      </div>
    </div>
  );
}