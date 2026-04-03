import { useState, useEffect } from 'react';
import { supabase } from '../../utils/supabase';
import { useNavigate, useLocation } from 'react-router';
import { Navbar } from '../components/Navbar';
import { ApprovalRequestCard } from '../components/ApprovalRequestCard';
import { HostApprovalModal } from '../components/HostApprovalModal';
import { useHostBookings } from '../contexts/HostBookingsContext';
import { Building2, Clock, Home, DollarSign, ArrowLeft, Calendar, XCircle, CheckCircle } from 'lucide-react';

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
  paymentDueAt?: string;
}


export function HostDashboardPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { upcomingGuests, rejectedBookings, approveBooking, rejectBooking } = useHostBookings();
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [selectedApproval, setSelectedApproval] = useState<PendingApproval | null>(null);
  const [modalAction, setModalAction] = useState<'approve' | 'reject'>('approve');
  const [pendingApprovals, setPendingApprovals] = useState<PendingApproval[]>([]);
  const [activeListingsCount, setActiveListingsCount] = useState<number>(0);
  const [activeStaysCount, setActiveStaysCount] = useState<number>(0);

  const calculateTimeRemaining = (targetDate: string) => {
    const total = Date.parse(targetDate) - Date.now();
    if (total <= 0) return { hours: 0, minutes: 0, seconds: 0 };
    
    const seconds = Math.floor((total / 1000) % 60);
    const minutes = Math.floor((total / 1000 / 60) % 60);
    const hours = Math.floor((total / (1000 * 60 * 60)) % 24);
    const days = Math.floor(total / (1000 * 60 * 60 * 24));
    
    return { 
      hours: hours + (days * 24), 
      minutes, 
      seconds 
    };
  };

  // Fetch real pending approvals from backend
  useEffect(() => {
    const fetchPendingApprovals = async () => {
      const storedUser = localStorage.getItem('secondhome_user');
      const currentUser = storedUser ? JSON.parse(storedUser) : null;
      if (!currentUser?.userId) return; // Not logged in — show empty state

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
            guests: 2,
            total: Number(b.totalAmount ?? 0),
            expiresIn: b.paymentDueAt ? calculateTimeRemaining(b.paymentDueAt) : { hours: 24, minutes: 0, seconds: 0 },
            paymentDueAt: b.paymentDueAt // Store for recalculation
          }));
          setPendingApprovals(mapped);
        }
      } catch (err) {
        console.error('Pending approvals fetch error:', err);
      }
    };

    const fetchRealCounts = async () => {
      const storedUser = localStorage.getItem('secondhome_user');
      const currentUser = storedUser ? JSON.parse(storedUser) : null;
      if (!currentUser?.userId) return;

      try {
        // 1. Fetch real active listings count from Supabase
        const { count, error } = await supabase
          .schema('listings_db')
          .from('property_details')
          .select('*', { count: 'exact', head: true })
          .eq('host_id', currentUser.userId)
          .eq('status', 'ACTIVE');

        if (!error && count !== null) {
          setActiveListingsCount(count);
        }

        // 2. Fetch active stays count from /stays API/DB if available?
        // For now, focusing on the listings as requested
        const staysRes = await fetch(`/stays?hostId=${currentUser.userId}&status=ACTIVE`);
        if (staysRes.ok) {
          const json = await staysRes.json();
          if (json.code === 200 && Array.isArray(json.data)) {
            setActiveStaysCount(json.data.length);
          }
        }

      } catch (err) {
        console.warn('Failed to fetch real counts', err);
      }
    };

    fetchPendingApprovals();
    fetchRealCounts();
  }, []);

  // Check if user came from dropdown menu
  const fromDropdown = location.state?.fromDropdown;

  // Get dynamic counts
  const upcomingGuestsCount = upcomingGuests.length;
  const rejectedBookingsCount = rejectedBookings.length;

  // Real-time countdown for all pending approvals
  useEffect(() => {
    const timer = setInterval(() => {
      setPendingApprovals(prev => {
        return prev.map(approval => {
          // If we have the real timestamp, use it to recalculate
          if (approval.paymentDueAt) {
            const newRemaining = calculateTimeRemaining(approval.paymentDueAt);
            
            // Check if expired
            if (newRemaining.hours === 0 && newRemaining.minutes === 0 && newRemaining.seconds === 0) {
              // Note: In a real app, you might want to call the backend to auto-reject here,
              // but for now we just notify and remove from local state.
              return null;
            }
            
            return {
              ...approval,
              expiresIn: newRemaining
            };
          }
          
          // Fallback to manual countdown for any legacy data
          const { hours, minutes, seconds } = approval.expiresIn;
          
          if (hours === 0 && minutes === 0 && seconds === 0) return null;
          
          if (seconds > 0) {
            return { ...approval, expiresIn: { ...approval.expiresIn, seconds: seconds - 1 } };
          } else if (minutes > 0) {
            return { ...approval, expiresIn: { hours, minutes: minutes - 1, seconds: 59 } };
          } else if (hours > 0) {
            return { ...approval, expiresIn: { hours: hours - 1, minutes: 59, seconds: 59 } };
          }
          
          return approval;
        }).filter(Boolean) as PendingApproval[];
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
        const endpoint = action === 'approve'
          ? `/bookings/${selectedApproval.bookingId}/approve`
          : `/bookings/${selectedApproval.bookingId}/reject`;
        const body = action === 'reject' && reason ? { reason } : undefined;

        const res = await fetch(endpoint, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: body ? JSON.stringify(body) : undefined,
        });
        const json = await res.json();
        if (json.code === 200 || res.ok) {
          if (action === 'approve') {
            approveBooking(selectedApproval);
            alert(`Booking ${selectedApproval.bookingId} approved! Guest has been notified.`);
          } else {
            rejectBooking(selectedApproval, reason);
            alert(`Booking ${selectedApproval.bookingId} declined. Guest has been notified.`);
          }
          setPendingApprovals(prev => prev.filter(a => a.id !== selectedApproval.id));
        } else {
          alert(json.message ?? 'Action failed. Please try again.');
        }
      } catch (err) {
        console.error('Approve/reject error:', err);
        // Fallback: optimistic update even if API call failed
        if (action === 'approve') approveBooking(selectedApproval);
        else rejectBooking(selectedApproval, reason);
        setPendingApprovals(prev => prev.filter(a => a.id !== selectedApproval.id));
      }
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      <div className="max-w-[1440px] mx-auto px-6 lg:px-20 py-8">
        {/* Page Heading with Toggle */}
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-semibold text-[#222222]">Host Dashboard</h1>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-6 gap-6 mb-12">
          <button 
            onClick={() => navigate('/host/active-listings')}
            className="bg-[#FFF5F7] border border-[#FFE5EB] rounded-xl p-6 hover:shadow-lg transition-shadow text-left"
          >
            <div className="flex items-center justify-between mb-3">
              <Building2 className="w-8 h-8 text-[#FF385C]" />
            </div>
            <div className="text-3xl font-bold text-[#222222] mb-1">{activeListingsCount}</div>
            <div className="text-sm text-[#717171]">Active Listings</div>
          </button>

          <button 
            onClick={() => navigate('/host/upcoming-guests')}
            className="bg-[#FFF5F7] border border-[#FFE5EB] rounded-xl p-6 hover:shadow-lg transition-shadow text-left"
          >
            <div className="flex items-center justify-between mb-3">
              <Calendar className="w-8 h-8 text-[#FF385C]" />
            </div>
            <div className="text-3xl font-bold text-[#222222] mb-1">{upcomingGuestsCount}</div>
            <div className="text-sm text-[#717171]">Upcoming Guests</div>
          </button>

          <button 
            onClick={() => navigate('/host/active-stays')}
            className="bg-[#FFF5F7] border border-[#FFE5EB] rounded-xl p-6 hover:shadow-lg transition-shadow text-left"
          >
            <div className="flex items-center justify-between mb-3">
              <Home className="w-8 h-8 text-[#FF385C]" />
            </div>
            <div className="text-3xl font-bold text-[#222222] mb-1">{activeStaysCount}</div>
            <div className="text-sm text-[#717171]">Active Stays</div>
          </button>

          <button 
            onClick={() => navigate('/host/past-stays')}
            className="bg-[#FFF5F7] border border-[#FFE5EB] rounded-xl p-6 hover:shadow-lg transition-shadow text-left"
          >
            <div className="flex items-center justify-between mb-3">
              <CheckCircle className="w-8 h-8 text-[#FF385C]" />
            </div>
            <div className="text-3xl font-bold text-[#222222] mb-1">12</div>
            <div className="text-sm text-[#717171]">Past Stays</div>
          </button>

          <button 
            onClick={() => navigate('/host/rejected-bookings')}
            className="bg-[#FFF5F7] border border-[#FFE5EB] rounded-xl p-6 hover:shadow-lg transition-shadow text-left"
          >
            <div className="flex items-center justify-between mb-3">
              <XCircle className="w-8 h-8 text-[#FF385C]" />
            </div>
            <div className="text-3xl font-bold text-[#222222] mb-1">{rejectedBookingsCount}</div>
            <div className="text-sm text-[#717171]">Rejected</div>
          </button>

          <div className="bg-[#FFF5F7] border border-[#FFE5EB] rounded-xl p-6">
            <div className="flex items-center justify-between mb-3">
              <DollarSign className="w-8 h-8 text-[#FF385C]" />
            </div>
            <div className="text-3xl font-bold text-[#222222] mb-1">4,820</div>
            <div className="text-sm text-[#717171]">Total Earnings (SGD)</div>
          </div>
        </div>

        {/* Pending Approvals Section */}
        <div className="border-l-4 border-[#FF385C] bg-[#FFF5F7] rounded-lg p-6 mb-8">
          <h2 className="text-2xl font-semibold text-[#222222] mb-6">
            Pending Approvals
          </h2>
          {pendingApprovals.length > 0 ? (
            <div className="space-y-4">
              {pendingApprovals.map((approval) => (
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