import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export interface HostBooking {
  id: string;
  bookingId: string;
  guestName: string;
  guestAvatar: string;
  listingTitle: string;
  listingImage: string;
  dates: string;
  checkIn: string;
  checkOut: string;
  guests: number;
  total: number;
  status: 'pending' | 'approved' | 'rejected';
  rejectionReason?: string;
  approvedDate?: string;
  rejectedDate?: string;
}

interface HostBookingsContextType {
  upcomingGuests: HostBooking[];
  rejectedBookings: HostBooking[];
  loading: boolean;
  error: string | null;
  approveBooking: (booking: any) => void;
  rejectBooking: (booking: any, reason?: string) => void;
  refetch: () => void;
}

const HostBookingsContext = createContext<HostBookingsContextType | undefined>(undefined);

const FALLBACK_AVATAR = 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&q=80';
const FALLBACK_IMAGE  = 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=400&q=80';

function mapBookingRow(b: any, statusLabel: 'approved' | 'rejected'): HostBooking {
  return {
    id: b.bookingId,
    bookingId: b.bookingId,
    guestName: b.guestName ?? 'Guest',
    guestAvatar: FALLBACK_AVATAR,
    listingTitle: b.listingTitle ?? b.listingId ?? 'Listing',
    listingImage: b.listingImage ?? FALLBACK_IMAGE,
    dates: `${b.checkInDate ?? ''} – ${b.checkOutDate ?? ''}`,
    checkIn: b.checkInDate ?? '',
    checkOut: b.checkOutDate ?? '',
    guests: b.guests ?? 1,
    total: Number(b.totalAmount ?? b.bookingAmount ?? 0),
    status: statusLabel,
    approvedDate: statusLabel === 'approved' ? (b.updatedAt ?? '') : undefined,
    rejectedDate:  statusLabel === 'rejected'  ? (b.updatedAt ?? '') : undefined,
    rejectionReason: b.rejectionReason ?? undefined,
  };
}

export function HostBookingsProvider({ children }: { children: ReactNode }) {
  const [upcomingGuests, setUpcomingGuests]   = useState<HostBooking[]>([]);
  const [rejectedBookings, setRejectedBookings] = useState<HostBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);

  const fetchBookings = async () => {
    const storedUser  = localStorage.getItem('staylah_user');
    const currentUser = storedUser ? JSON.parse(storedUser) : null;
    if (!currentUser?.userId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // ── Determine the "upcoming" cutoff date ──────────────────────────────
      // Standard check-in time is 15:00 SGT (UTC+8).
      // Before 15:00 SGT: today's check-ins are still "upcoming".
      // At/after 15:00 SGT: today's check-ins have passed the check-in window,
      //   so we advance the cutoff to tomorrow to exclude them.
      const getUpcomingCutoffDate = (): string => {
        const nowUtcMs  = Date.now();
        const sgtOffset = 8 * 60 * 60 * 1000;          // UTC+8 in ms
        const nowSgt    = new Date(nowUtcMs + sgtOffset); // synthetic SGT Date

        const sgtHour   = nowSgt.getUTCHours();   // hour in SGT (0–23)

        // At or after 15:00 SGT → guests should be arriving; move cutoff to tomorrow
        const isAfterCheckinCutoff = sgtHour >= 15;

        if (isAfterCheckinCutoff) {
          // Advance by one day
          const tomorrow = new Date(nowUtcMs + sgtOffset + 24 * 60 * 60 * 1000);
          const y = tomorrow.getUTCFullYear();
          const m = String(tomorrow.getUTCMonth() + 1).padStart(2, '0');
          const d = String(tomorrow.getUTCDate()).padStart(2, '0');
          return `${y}-${m}-${d}`;
        }

        // Use today's SGT date
        const y = nowSgt.getUTCFullYear();
        const m = String(nowSgt.getUTCMonth() + 1).padStart(2, '0');
        const d = String(nowSgt.getUTCDate()).padStart(2, '0');
        return `${y}-${m}-${d}`;
      };

      const cutoffDate = getUpcomingCutoffDate();

      // Fetch CONFIRMED bookings (Upcoming Guests) — check-in on or after cutoff
      const confirmedRes = await fetch(
        `/bookings?hostId=${currentUser.userId}&status=CONFIRMED&checkInAfter=${cutoffDate}`
      );
      if (!confirmedRes.ok) throw new Error('Failed to fetch confirmed bookings');

      const confirmedJson = await confirmedRes.json();

      // Fetch REJECTED bookings
      const rejectedRes = await fetch(
        `/bookings?hostId=${currentUser.userId}&status=REJECTED`
      );
      if (!rejectedRes.ok) throw new Error('Failed to fetch rejected bookings');
      const rejectedJson = await rejectedRes.json();

      if (confirmedJson.code === 200 && Array.isArray(confirmedJson.data)) {
        setUpcomingGuests(confirmedJson.data.map((b: any) => mapBookingRow(b, 'approved')));
      }

      if (rejectedJson.code === 200 && Array.isArray(rejectedJson.data)) {
        setRejectedBookings(rejectedJson.data.map((b: any) => mapBookingRow(b, 'rejected')));
      }
    } catch (err: any) {
      console.error('HostBookingsContext fetch error:', err);
      setError(err.message ?? 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  const approveBooking = (booking: any) => {
    const checkInStr = booking.checkIn ?? booking.dates?.split(' – ')[0] ?? '';
    // Only add to upcomingGuests if check-in date is today or in the future
    const todayStr = new Date().toISOString().slice(0, 10);
    if (checkInStr && checkInStr < todayStr) {
      // Check-in is in the past — don't add to upcoming guests
      return;
    }
    const approvedBooking: HostBooking = {
      id: booking.bookingId,
      bookingId: booking.bookingId,
      guestName: booking.guestName,
      guestAvatar: booking.guestAvatar ?? FALLBACK_AVATAR,
      listingTitle: booking.listingTitle,
      listingImage: FALLBACK_IMAGE,
      dates: booking.dates,
      checkIn: checkInStr,
      checkOut: booking.checkOut ?? booking.dates?.split(' – ')[1] ?? '',
      guests: booking.guests,
      total: booking.total,
      status: 'approved',
      approvedDate: new Date().toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      }),
    };
    setUpcomingGuests(prev => [...prev, approvedBooking]);
  };


  const rejectBooking = (booking: any, reason?: string) => {
    const rejectedBooking: HostBooking = {
      id: booking.bookingId,
      bookingId: booking.bookingId,
      guestName: booking.guestName,
      guestAvatar: booking.guestAvatar ?? FALLBACK_AVATAR,
      listingTitle: booking.listingTitle,
      listingImage: FALLBACK_IMAGE,
      dates: booking.dates,
      checkIn: booking.checkIn ?? booking.dates?.split(' – ')[0] ?? '',
      checkOut: booking.checkOut ?? booking.dates?.split(' – ')[1] ?? '',
      guests: booking.guests,
      total: booking.total,
      status: 'rejected',
      rejectedDate: new Date().toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      }),
      rejectionReason: reason ?? 'No reason provided',
    };
    setRejectedBookings(prev => [...prev, rejectedBooking]);
  };

  return (
    <HostBookingsContext.Provider
      value={{
        upcomingGuests,
        rejectedBookings,
        loading,
        error,
        approveBooking,
        rejectBooking,
        refetch: fetchBookings,
      }}
    >
      {children}
    </HostBookingsContext.Provider>
  );
}

export function useHostBookings() {
  const context = useContext(HostBookingsContext);
  if (!context) {
    throw new Error('useHostBookings must be used within a HostBookingsProvider');
  }
  return context;
}