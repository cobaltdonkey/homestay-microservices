export interface StoredGuestProfile {
  guestId: string;
  name: string;
  email: string;
  phone: string;
}

export interface StoredTrip {
  bookingId: string;
  listingId: string;
  listingTitle: string;
  listingImage: string;
  location: string;
  checkInDate: string;
  checkOutDate: string;
  guests: number;
  totalPrice: number;
  status: "confirmed" | "pending" | "cancelled" | "completed";
  createdAt: string;
}

const GUEST_PROFILE_KEY = "home-haven.guest-profile";
const TRIPS_KEY = "home-haven.trips";

function isBrowser() {
  return typeof window !== "undefined";
}

export function getStoredGuestProfile(): StoredGuestProfile | null {
  if (!isBrowser()) return null;
  const raw = window.localStorage.getItem(GUEST_PROFILE_KEY);
  if (!raw) return null;

  try {
    return JSON.parse(raw) as StoredGuestProfile;
  } catch {
    return null;
  }
}

export function saveStoredGuestProfile(profile: StoredGuestProfile) {
  if (!isBrowser()) return;
  window.localStorage.setItem(GUEST_PROFILE_KEY, JSON.stringify(profile));
}

export function getStoredTrips(): StoredTrip[] {
  if (!isBrowser()) return [];
  const raw = window.localStorage.getItem(TRIPS_KEY);
  if (!raw) return [];

  try {
    return JSON.parse(raw) as StoredTrip[];
  } catch {
    return [];
  }
}

export function saveStoredTrip(trip: StoredTrip) {
  if (!isBrowser()) return;

  const trips = getStoredTrips();
  const nextTrips = [trip, ...trips.filter((item) => item.bookingId !== trip.bookingId)];
  window.localStorage.setItem(TRIPS_KEY, JSON.stringify(nextTrips));
}

export function replaceStoredTrips(trips: StoredTrip[]) {
  if (!isBrowser()) return;
  window.localStorage.setItem(TRIPS_KEY, JSON.stringify(trips));
}
