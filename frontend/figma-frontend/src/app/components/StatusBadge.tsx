export type BookingStatus = 
  | 'AWAITING_PAYMENT'
  | 'CONFIRMED'
  | 'PAID'
  | 'PENDING_HOST'
  | 'REJECTED'
  | 'EXPIRED'
  | 'FAILED_PAYMENT'
  | 'COMPLETED';

interface StatusBadgeProps {
  status: BookingStatus;
}

const statusConfig = {
  AWAITING_PAYMENT: {
    label: 'Awaiting Payment',
    className: 'bg-[#717171] text-white',
  },
  CONFIRMED: {
    label: 'Confirmed',
    className: 'bg-[#008A05] text-white',
  },
  PAID: {
    label: 'Paid',
    className: 'bg-[#0066CC] text-white',
  },
  PENDING_HOST: {
    label: 'Pending Host',
    className: 'bg-[#F59E0B] text-white',
  },
  REJECTED: {
    label: 'Rejected',
    className: 'bg-[#C13515] text-white',
  },
  EXPIRED: {
    label: 'Expired',
    className: 'bg-[#4B5563] text-white',
  },
  FAILED_PAYMENT: {
    label: 'Failed Payment',
    className: 'bg-white border-2 border-[#C13515] text-[#C13515]',
  },
  COMPLETED: {
    label: 'Completed',
    className: 'bg-[#008A05] text-white',
  },
};

export function StatusBadge({ status }: StatusBadgeProps) {
  const config = statusConfig[status];

  // Fallback if status is not found
  if (!config) {
    return (
      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-[#717171] text-white">
        Unknown
      </span>
    );
  }

  return (
    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${config.className}`}>
      {config.label}
    </span>
  );
}