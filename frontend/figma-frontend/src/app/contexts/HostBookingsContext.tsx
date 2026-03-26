import { createContext, useContext, useState, ReactNode } from 'react';

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
  approveBooking: (booking: any) => void;
  rejectBooking: (booking: any, reason?: string) => void;
}

const HostBookingsContext = createContext<HostBookingsContextType | undefined>(undefined);

export function HostBookingsProvider({ children }: { children: ReactNode }) {
  const [upcomingGuests, setUpcomingGuests] = useState<HostBooking[]>([
    {
      id: 'upcoming-1',
      bookingId: 'BKG-20240003',
      guestName: 'Emily Chen',
      guestAvatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&q=80',
      listingTitle: 'Modern Loft in Bugis',
      listingImage: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=400&q=80',
      dates: '28 Mar – 31 Mar 2026',
      checkIn: '28 Mar 2026',
      checkOut: '31 Mar 2026',
      guests: 2,
      total: 1050,
      status: 'approved',
      approvedDate: '15 Mar 2026',
    },
    {
      id: 'upcoming-2',
      bookingId: 'BKG-20240007',
      guestName: 'David Lim',
      guestAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&q=80',
      listingTitle: 'Luxury Villa in East Coast',
      listingImage: 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=400&q=80',
      dates: '5 Apr – 8 Apr 2026',
      checkIn: '5 Apr 2026',
      checkOut: '8 Apr 2026',
      guests: 4,
      total: 2670,
      status: 'approved',
      approvedDate: '18 Mar 2026',
    },
  ]);

  const [rejectedBookings, setRejectedBookings] = useState<HostBooking[]>([
    {
      id: 'rejected-1',
      bookingId: 'BKG-20240002',
      guestName: 'Alex Kumar',
      guestAvatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&q=80',
      listingTitle: 'Cozy Apartment in Tiong Bahru',
      listingImage: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=400&q=80',
      dates: '15 Mar – 18 Mar 2026',
      checkIn: '15 Mar 2026',
      checkOut: '18 Mar 2026',
      guests: 3,
      total: 840,
      status: 'rejected',
      rejectedDate: '10 Mar 2026',
      rejectionReason: 'Property maintenance scheduled during requested dates',
    },
  ]);

  const approveBooking = (booking: any) => {
    // Generate unique ID for approved booking
    const timestamp = Date.now();
    const approvedBooking: HostBooking = {
      id: `upcoming-${timestamp}-${Math.random().toString(36).substring(2, 9)}`,
      bookingId: booking.bookingId,
      guestName: booking.guestName,
      guestAvatar: booking.guestAvatar,
      listingTitle: booking.listingTitle,
      listingImage: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=400&q=80',
      dates: booking.dates,
      checkIn: booking.dates.split(' – ')[0] + ' 2026',
      checkOut: booking.dates.split(' – ')[1] + ' 2026',
      guests: booking.guests,
      total: booking.total,
      status: 'approved',
      approvedDate: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }),
    };

    setUpcomingGuests(prev => [...prev, approvedBooking]);
  };

  const rejectBooking = (booking: any, reason?: string) => {
    // Generate unique ID for rejected booking
    const timestamp = Date.now();
    const rejectedBooking: HostBooking = {
      id: `rejected-${timestamp}-${Math.random().toString(36).substring(2, 9)}`,
      bookingId: booking.bookingId,
      guestName: booking.guestName,
      guestAvatar: booking.guestAvatar,
      listingTitle: booking.listingTitle,
      listingImage: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=400&q=80',
      dates: booking.dates,
      checkIn: booking.dates.split(' – ')[0] + ' 2026',
      checkOut: booking.dates.split(' – ')[1] + ' 2026',
      guests: booking.guests,
      total: booking.total,
      status: 'rejected',
      rejectedDate: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }),
      rejectionReason: reason || 'No reason provided',
    };

    setRejectedBookings(prev => [...prev, rejectedBooking]);
  };

  return (
    <HostBookingsContext.Provider value={{ upcomingGuests, rejectedBookings, approveBooking, rejectBooking }}>
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