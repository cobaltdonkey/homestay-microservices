import { useState, useEffect } from 'react';
import { supabase } from '../../utils/supabase';
import { useNavigate, useLocation } from 'react-router';
import { Navbar } from '../components/Navbar';
import { ApprovalRequestCard } from '../components/ApprovalRequestCard';
import { HostApprovalModal } from '../components/HostApprovalModal';
import { useHostBookings } from '../contexts/HostBookingsContext';
import { Building2, Clock, Home, DollarSign, Calendar, XCircle, CheckCircle, RefreshCw } from 'lucide-react';

interface PendingApproval {
  id: string;
  bookingId: string;
  guestName: string;
  guestAvatar: string;
  listingTitle: string;
  dates: string;
  checkIn: string;
  checkOut: string;
  guests: number;
  total: number;
  listingId: string;
  guestId: string;
  hostId: string;
  expiresIn: { hours: number; minutes: number; seconds: number };
  paymentDueAt?: string;
}

interface DashboardStats {
  activeListings: number;
  activeStays: number;
  pastStays: number;
  totalEarnings: number;
}

export function HostDashboardPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { upcomingGuests, rejectedBookings, approveBooking, rejectBooking, loading: bookingsLoading } = useHostBookings();
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [selectedApproval, setSelectedApproval] = useState<PendingApproval | null>(null);
  const [modalAction, setModalAction] = useState<'approve' | 'reject'>('approve');
  const [pendingApprovals, setPendingApprovals] = useState<PendingApproval[]>([]);

  const [stats, setStats] = useState<DashboardStats>({
    activeListings: 0,
    activeStays: 0,
    pastStays: 0,
    totalEarnings: 0,
  });
  const [statsLoading, setStatsLoading] = useState(true);

  const calculateTimeRemaining = (targetDate: string) => {
    const total = Date.parse(targetDate) - Date.now();
    if (total <= 0) return { hours: 0, minutes: 0, seconds: 0 };

    const seconds = Math.floor((total / 1000) % 60);
    const minutes = Math.floor((total / 1000 / 60) % 60);
    const hours = Math.floor((total / (1000 * 60 * 60)) % 24);
    const days = Math.floor(total / (1000 * 60 * 60 * 24));

    return { hours: hours + days * 24, minutes, seconds };
  };

  const fetchDashboardStats = async () => {
    const storedUser = localStorage.getItem('secondhome_user');
    const currentUser = storedUser ? JSON.parse(storedUser) : null;
    if (!currentUser?.userId) {
      setStatsLoading(false);
      return;
    }

    setStatsLoading(true);

    try {
      // ── 1. Active Listings ─────────────────────────────────────────────────
      const { count: listingsCount, error: listingsErr } = await supabase
        .schema('listings_db')
        .from('property_details')
        .select('*', { count: 'exact', head: true })
        .eq('host_id', currentUser.userId)
        .eq('status', 'ACTIVE');

      // ── 2. Active Stays ────────────────────────────────────────────────────
      //    check_in_date <= today AND check_out_date >= today (fixed backend)
      const staysActiveRes = await fetch(`/stays?hostId=${currentUser.userId}&status=ACTIVE`);
      const staysActiveJson = staysActiveRes.ok ? await staysActiveRes.json() : null;

      // ── 3. Past Stays ──────────────────────────────────────────────────────
      //    check_out_date < today (new backend filter)
      const staysPastRes = await fetch(`/stays?hostId=${currentUser.userId}&status=PAST`);
      const staysPastJson = staysPastRes.ok ? await staysPastRes.json() : null;

      // ── 4. Total Earnings ──────────────────────────────────────────────────
      //    Step A: get all booking_ids for this host from booking table
      const { data: hostBookings, error: bookingsErr } = await supabase
        .schema('booking')
        .from('booking')
        .select('booking_id')
        .eq('host_id', currentUser.userId);

      let totalEarnings = 0;
      if (!bookingsErr && hostBookings && hostBookings.length > 0) {
        const bookingIds = hostBookings.map((b: any) => b.booking_id);

        //    Step B: sum amount from payment_log for those booking_ids
        const { data: paymentLogs, error: logsErr } = await supabase
          .schema('payment_logs_db')
          .from('payment_log')
          .select('amount')
          .in('booking_id', bookingIds)
          .in('status', ['SUCCESS', 'RELEASED']);

        if (!logsErr && paymentLogs) {
          totalEarnings = paymentLogs.reduce(
            (sum: number, log: any) => sum + (parseFloat(log.amount) || 0),
            0
          );
        }
      }

      setStats({
        activeListings: !listingsErr && listingsCount !== null ? listingsCount : 0,
        activeStays:
          staysActiveJson?.code === 200 && Array.isArray(staysActiveJson.data)
            ? staysActiveJson.data.length
            : 0,
        pastStays:
          staysPastJson?.code === 200 && Array.isArray(staysPastJson.data)
            ? staysPastJson.data.length
            : 0,
        totalEarnings,
      });
    } catch (err) {
      console.warn('[Dashboard] Failed to fetch stats:', err);
    } finally {
      setStatsLoading(false);
    }
  };

  // Fetch real pending approvals from backend
  useEffect(() => {
    const fetchPendingApprovals = async () => {
      const storedUser = localStorage.getItem('secondhome_user');
      const currentUser = storedUser ? JSON.parse(storedUser) : null;
      if (!currentUser?.userId) return;

      try {
        const res = await fetch(`/bookings?hostId=${currentUser.userId}&status=PENDING_HOST`);
        if (!res.ok) throw new Error('Failed to fetch pending approvals');
        const json = await res.json();

        if (json.code === 200 && Array.isArray(json.data)) {
          const mapped: PendingApproval[] = json.data.map((b: any) => ({
            id: b.bookingId,
            bookingId: b.bookingId,
            guestName: b.guestName ?? 'Guest',
            guestAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&q=80',
            listingTitle: b.listingTitle ?? b.listingId,
            dates: `${b.checkInDate} – ${b.checkOutDate}`,
            checkIn: b.checkInDate,
            checkOut: b.checkOutDate,
            guests: b.guests ?? 2,
            total: Number(b.totalAmount ?? 0),
            listingId: b.listingId,
            guestId: b.guestId,
            hostId: b.hostId,
            expiresIn: b.paymentDueAt
              ? calculateTimeRemaining(b.paymentDueAt)
              : { hours: 24, minutes: 0, seconds: 0 },
            paymentDueAt: b.paymentDueAt,
          }));
          setPendingApprovals(mapped);
        }
      } catch (err) {
        console.error('Pending approvals fetch error:', err);
      }
    };

    fetchPendingApprovals();
    fetchDashboardStats();
  }, []);

  // Check if user came from dropdown menu
  const fromDropdown = location.state?.fromDropdown;

  // Derived counts from live context
  const upcomingGuestsCount = upcomingGuests.length;
  const rejectedBookingsCount = rejectedBookings.length;

  // Real-time countdown for all pending approvals
  useEffect(() => {
    const timer = setInterval(() => {
      setPendingApprovals(prev => {
        return prev
          .map(approval => {
            if (approval.paymentDueAt) {
              const newRemaining = calculateTimeRemaining(approval.paymentDueAt);
              if (
                newRemaining.hours === 0 &&
                newRemaining.minutes === 0 &&
                newRemaining.seconds === 0
              ) {
                return null;
              }
              return { ...approval, expiresIn: newRemaining };
            }

            const { hours, minutes, seconds } = approval.expiresIn;
            if (hours === 0 && minutes === 0 && seconds === 0) return null;
            if (seconds > 0) return { ...approval, expiresIn: { ...approval.expiresIn, seconds: seconds - 1 } };
            if (minutes > 0) return { ...approval, expiresIn: { hours, minutes: minutes - 1, seconds: 59 } };
            if (hours > 0) return { ...approval, expiresIn: { hours: hours - 1, minutes: 59, seconds: 59 } };
            return approval;
          })
          .filter(Boolean) as PendingApproval[];
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const handleApproveClick = (approval: PendingApproval) => {
    setSelectedApproval(approval);
    setModalAction('approve');
    setShowApprovalModal(true);
  };

  const handleRejectClick = (approval: PendingApproval) => {
    setSelectedApproval(approval);
    setModalAction('reject');
    setShowApprovalModal(true);
  };

  const handleConfirmAction = async (action: 'approve' | 'reject', reason?: string) => {
    if (selectedApproval) {
      try {
        const endpoint =
          action === 'approve'
            ? `/approve-booking/${selectedApproval.bookingId}`
            : `/reject-booking/${selectedApproval.bookingId}`;

        const res = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            listingId: selectedApproval.listingId,
            guestId: selectedApproval.guestId,
            hostId: selectedApproval.hostId,
            checkInDate: selectedApproval.checkIn,
            checkOutDate: selectedApproval.checkOut,
            status: action === 'approve' ? 'CONFIRMED' : 'REJECTED',
          }),
        });
        const json = await res.json();

        if (json.code === 200 || res.ok) {
          if (action === 'approve') {
            approveBooking(selectedApproval);
            alert(`Booking ${selectedApproval.bookingId} approved! Guest has been notified.`);
          } else {
            rejectBooking(selectedApproval, reason);
            navigate(`/host/declined/${selectedApproval.bookingId}`);
          }
          setPendingApprovals(prev => prev.filter(a => a.id !== selectedApproval.id));
          // Refresh earnings & stays in case a new stay was created
          fetchDashboardStats();
        } else {
          alert(json.message ?? 'Action failed. Please try again.');
        }
      } catch (err) {
        console.error('Approve/reject error:', err);
        if (action === 'approve') approveBooking(selectedApproval);
        else rejectBooking(selectedApproval, reason);
        setPendingApprovals(prev => prev.filter(a => a.id !== selectedApproval.id));
      }
    }
  };

  const StatCard = ({
    icon,
    count,
    label,
    loading,
    onClick,
  }: {
    icon: React.ReactNode;
    count: number | string;
    label: string;
    loading: boolean;
    onClick?: () => void;
  }) => {
    const inner = (
      <>
        <div className="flex items-center justify-between mb-3">{icon}</div>
        <div className="text-3xl font-bold text-[#222222] mb-1">
          {loading ? (
            <span className="inline-block w-10 h-8 bg-[#FFD6DF] rounded animate-pulse" />
          ) : (
            count
          )}
        </div>
        <div className="text-sm text-[#717171]">{label}</div>
      </>
    );

    if (onClick) {
      return (
        <button
          onClick={onClick}
          className="bg-[#FFF5F7] border border-[#FFE5EB] rounded-xl p-6 hover:shadow-lg transition-shadow text-left"
        >
          {inner}
        </button>
      );
    }

    return (
      <div className="bg-[#FFF5F7] border border-[#FFE5EB] rounded-xl p-6">{inner}</div>
    );
  };

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      <div className="max-w-[1440px] mx-auto px-6 lg:px-20 py-8">
        {/* Page Heading */}
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-semibold text-[#222222]">Host Dashboard</h1>
          <button
            onClick={fetchDashboardStats}
            className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-[#FF385C] border border-[#FFE5EB] rounded-lg hover:bg-[#FFF5F7] transition-colors"
            title="Refresh statistics"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-6 gap-6 mb-12">
          <StatCard
            icon={<Building2 className="w-8 h-8 text-[#FF385C]" />}
            count={stats.activeListings}
            label="Active Listings"
            loading={statsLoading}
            onClick={() => navigate('/host/active-listings')}
          />

          <StatCard
            icon={<Calendar className="w-8 h-8 text-[#FF385C]" />}
            count={bookingsLoading ? '…' : upcomingGuestsCount}
            label="Upcoming Guests"
            loading={bookingsLoading}
            onClick={() => navigate('/host/upcoming-guests')}
          />

          <StatCard
            icon={<Home className="w-8 h-8 text-[#FF385C]" />}
            count={stats.activeStays}
            label="Active Stays"
            loading={statsLoading}
            onClick={() => navigate('/host/active-stays')}
          />

          <StatCard
            icon={<CheckCircle className="w-8 h-8 text-[#FF385C]" />}
            count={stats.pastStays}
            label="Past Stays"
            loading={statsLoading}
            onClick={() => navigate('/host/past-stays')}
          />

          <StatCard
            icon={<XCircle className="w-8 h-8 text-[#FF385C]" />}
            count={bookingsLoading ? '…' : rejectedBookingsCount}
            label="Rejected"
            loading={bookingsLoading}
            onClick={() => navigate('/host/rejected-bookings')}
          />

          <StatCard
            icon={<DollarSign className="w-8 h-8 text-[#FF385C]" />}
            count={stats.totalEarnings > 0 ? stats.totalEarnings.toLocaleString('en-SG', { minimumFractionDigits: 0, maximumFractionDigits: 0 }) : '0'}
            label="Total Earnings (SGD)"
            loading={statsLoading}
          />
        </div>

        {/* Pending Approvals Section */}
        <div className="border-l-4 border-[#FF385C] bg-[#FFF5F7] rounded-lg p-6 mb-8">
          <h2 className="text-2xl font-semibold text-[#222222] mb-6">Pending Approvals</h2>
          {pendingApprovals.length > 0 ? (
            <div className="space-y-4">
              {pendingApprovals.map(approval => (
                <ApprovalRequestCard
                  key={approval.id}
                  approval={approval}
                  onApprove={() => handleApproveClick(approval)}
                  onReject={() => handleRejectClick(approval)}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-[#717171]">
              <Clock className="w-12 h-12 mx-auto mb-3 text-[#FF385C] opacity-50" />
              <p className="text-lg">No pending approvals</p>
              <p className="text-sm mt-2">New booking requests will appear here</p>
            </div>
          )}
        </div>
      </div>

      {/* Approval/Rejection Modal */}
      {showApprovalModal && selectedApproval && (
        <HostApprovalModal
          approval={selectedApproval}
          action={modalAction}
          onClose={() => {
            setShowApprovalModal(false);
            setSelectedApproval(null);
          }}
          onConfirm={handleConfirmAction}
        />
      )}
    </div>
  );
}