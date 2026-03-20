import {
  getHostAvatar,
  getListingImages,
  inferAmenities,
  inferCancellationPolicy,
  inferCapacity,
  inferDescription,
  inferHouseRules,
  inferPropertyType,
  inferReviewData,
  inferSleepingArrangements,
  inferSummary,
} from "@/lib/listingContent";
import { getStoredGuestProfile, saveStoredGuestProfile, type StoredGuestProfile, type StoredTrip } from "@/lib/tripStorage";

const API_BASE = (import.meta.env.VITE_API_BASE_URL || (import.meta.env.DEV ? "" : "http://localhost:8000")).replace(/\/$/, "");
const DEFAULT_PAYMENT_METHOD = "pm_card_visa";
const NETWORK_ERROR_MESSAGE = "Unable to reach the backend API. Start the Docker stack and ensure Kong is reachable on port 8000.";

interface ApiEnvelope<T> {
  code: number;
  data: T;
  message: string;
}

interface SearchResult {
  listingId: string;
  hostId: string;
  title: string;
  location: string;
  pricePerNight: number;
  bookingMode: "INSTANT" | "REQUEST";
  availabilityStatus: "AVAILABLE" | "UNAVAILABLE";
}

interface ListingRecord extends SearchResult {
  status?: string;
}

interface UserProfile {
  userId: string;
  name: string;
  email: string;
  phoneNumber: string;
  role: string;
}

export interface BookingRecord {
  bookingId: string;
  guestId: string;
  hostId: string;
  listingId: string;
  checkInDate: string;
  checkOutDate: string;
  bookingMode: "INSTANT" | "REQUEST";
  status: string;
  createdAt: string;
  paymentDueAt?: string | null;
}

export interface StayRecord {
  stayId: string;
  bookingId: string;
  guestId: string;
  hostId: string;
  listingId: string;
  checkInDate: string;
  checkOutDate: string;
  depositTxnId?: string | null;
  depositAmount?: number | null;
  depositStatus?: string | null;
  checkoutTime?: string | null;
}

export interface Listing {
  id: string;
  listingId: string;
  hostId: string;
  title: string;
  location: string;
  city: string;
  country: string;
  price: number;
  rating: number;
  reviewCount: number;
  coverImage: string;
  images: string[];
  summary: string;
  description: string;
  instantBook: boolean;
  propertyType: string;
  maxGuests: number;
  bedrooms: number;
  beds: number;
  bathrooms: number;
  amenities: string[];
  houseRules: string[];
  cancellationPolicy: string;
  hostName: string;
  hostAvatar: string;
  hostSince: string;
  hostResponseRate: number;
  sleepingArrangements: { room: string; beds: string }[];
  reviews: {
    id: string;
    author: string;
    avatar: string;
    date: string;
    rating: number;
    comment: string;
  }[];
  bookingMode: "INSTANT" | "REQUEST";
  availabilityStatus: "AVAILABLE" | "UNAVAILABLE";
}

export interface Booking {
  id: string;
  bookingId: string;
  listingId: string;
  listingTitle: string;
  listingImage: string;
  location: string;
  checkIn: string;
  checkOut: string;
  guests: number;
  totalPrice: number;
  status: "confirmed" | "pending" | "cancelled" | "completed";
  createdAt: string;
}

export interface SearchFilters {
  destination: string;
  checkIn?: string;
  checkOut?: string;
  guests?: number;
  maxPrice?: number;
  bookingMode?: "ANY" | "INSTANT" | "REQUEST";
}

export interface BookingDraft {
  listing: Listing;
  checkIn: string;
  checkOut: string;
  guests: number;
  nights: number;
  subtotal: number;
  serviceFee: number;
  cleaningFee: number;
  total: number;
}

export interface GuestDetails {
  name: string;
  email: string;
  phone: string;
}

function splitLocation(location: string) {
  const parts = location.split(",").map((part) => part.trim()).filter(Boolean);
  return {
    city: parts[0] || location,
    country: parts[parts.length - 1] || "Singapore",
  };
}

function formatHostSince(seed: string) {
  return String(2017 + (Math.abs(seed.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0)) % 8));
}

function mapStatus(status: string): Booking["status"] {
  const normalized = status.toUpperCase();
  if (["CONFIRMED", "AWAITING_CHECKIN", "ACTIVE_STAY"].includes(normalized)) return "confirmed";
  if (["PENDING_HOST", "PAID", "AWAITING_PAYMENT"].includes(normalized)) return "pending";
  if (["REJECTED", "FAILED_PAYMENT", "EXPIRED"].includes(normalized)) return "cancelled";
  if (["COMPLETED"].includes(normalized)) return "completed";
  return "pending";
}

async function request<T>(path: string, init?: RequestInit) {
  const headers = new Headers(init?.headers || {});
  if (init?.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  let response: Response;
  try {
    response = await fetch(`${API_BASE}${path}`, {
      ...init,
      headers,
    });
  } catch (error) {
    if (error instanceof TypeError) {
      throw new Error(NETWORK_ERROR_MESSAGE);
    }
    throw error;
  }

  const raw = await response.text();
  const payload = raw ? (JSON.parse(raw) as ApiEnvelope<T>) : null;
  if (!response.ok || !payload) {
    throw new Error(payload?.message || `Request failed (${response.status})`);
  }

  return payload.data;
}

async function getHostProfile(hostId: string) {
  try {
    return await request<UserProfile>(`/users/${encodeURIComponent(hostId)}/profile`);
  } catch {
    return null;
  }
}

function enrichListing(record: ListingRecord, hostName?: string): Listing {
  const seed = `${record.listingId}:${record.location}:${record.title}`;
  const { city, country } = splitLocation(record.location);
  const { reviewCount, rating } = inferReviewData(seed);
  const { bedrooms, beds, bathrooms, maxGuests } = inferCapacity(seed);
  const images = getListingImages(seed);
  const resolvedHostName = hostName || `Host ${record.hostId.slice(0, 6)}`;

  return {
    id: record.listingId,
    listingId: record.listingId,
    hostId: record.hostId,
    title: record.title,
    location: record.location,
    city,
    country,
    price: Number(record.pricePerNight),
    rating,
    reviewCount,
    coverImage: images[0],
    images,
    summary: inferSummary(record.title, record.location),
    description: inferDescription(record.title, record.location),
    instantBook: record.bookingMode === "INSTANT",
    propertyType: inferPropertyType(record.title),
    maxGuests,
    bedrooms,
    beds,
    bathrooms,
    amenities: inferAmenities(seed),
    houseRules: inferHouseRules(),
    cancellationPolicy: inferCancellationPolicy(seed),
    hostName: resolvedHostName,
    hostAvatar: getHostAvatar(seed),
    hostSince: formatHostSince(seed),
    hostResponseRate: 95 + (seed.length % 5),
    sleepingArrangements: inferSleepingArrangements(bedrooms, beds),
    reviews: [
      {
        id: `${record.listingId}-review-1`,
        author: "Amelia",
        avatar: getHostAvatar(`${seed}-review-1`),
        date: "March 2026",
        rating: Math.min(5, Math.round(rating)),
        comment: `Loved how convenient ${record.title} was for getting around ${city}. Clean, comfortable, and exactly what we needed.`,
      },
      {
        id: `${record.listingId}-review-2`,
        author: "Daniel",
        avatar: getHostAvatar(`${seed}-review-2`),
        date: "February 2026",
        rating: Math.min(5, Math.round(rating)),
        comment: `Great communication and a smooth check-in. We'd happily stay here again for another trip to ${country}.`,
      },
    ],
    bookingMode: record.bookingMode,
    availabilityStatus: record.availabilityStatus,
  };
}

async function createGuest(details: GuestDetails, emailOverride?: string) {
  return request<UserProfile>("/users", {
    method: "POST",
    body: JSON.stringify({
      name: details.name.trim(),
      email: (emailOverride || details.email).trim(),
      phoneNumber: details.phone.trim(),
      role: "guest",
    }),
  });
}

async function ensureGuestProfile(guest: GuestDetails): Promise<StoredGuestProfile> {
  const existing = getStoredGuestProfile();
  if (existing && existing.email.toLowerCase() === guest.email.trim().toLowerCase()) {
    return existing;
  }

  let created: UserProfile;
  try {
    created = await createGuest(guest);
  } catch (error) {
    if (!(error instanceof Error) || !error.message.toLowerCase().includes("email already exists")) {
      throw error;
    }

    const [localPart, domain = "example.com"] = guest.email.split("@");
    created = await createGuest(guest, `${localPart}+guest-${Date.now()}@${domain}`);
  }

  const profile = {
    guestId: created.userId,
    name: created.name,
    email: created.email,
    phone: created.phoneNumber,
  };
  saveStoredGuestProfile(profile);
  return profile;
}

export const api = {
  async searchListings(filters: SearchFilters): Promise<Listing[]> {
    const params = new URLSearchParams({
      location: filters.destination,
      limit: "12",
    });

    if (filters.checkIn) params.set("checkInDate", filters.checkIn);
    if (filters.checkOut) params.set("checkOutDate", filters.checkOut);
    if (filters.maxPrice) params.set("maxPrice", String(filters.maxPrice));

    const data = await request<{ results: SearchResult[] }>(`/search/listings?${params.toString()}`);
    let results = data.results;

    if (filters.bookingMode && filters.bookingMode !== "ANY") {
      results = results.filter((listing) => listing.bookingMode === filters.bookingMode);
    }

    return results.map((listing) => enrichListing(listing));
  },

  async getListingDetails(listingId: string): Promise<Listing> {
    const listing = await request<ListingRecord>(`/listings/${encodeURIComponent(listingId)}`);
    const host = await getHostProfile(listing.hostId);
    return enrichListing({ ...listing, availabilityStatus: "AVAILABLE" }, host?.name);
  },

  async checkAvailability(listingId: string, checkIn: string, checkOut: string) {
    return request<{ available: boolean }>(`/availability?listingId=${encodeURIComponent(listingId)}&checkInDate=${encodeURIComponent(checkIn)}&checkOutDate=${encodeURIComponent(checkOut)}`);
  },

  async createBooking(draft: BookingDraft, guest: GuestDetails) {
    const profile = await ensureGuestProfile(guest);
    const result = await request<{ bookingId: string; status: string }>("/bookings/initiate", {
      method: "POST",
      body: JSON.stringify({
        listingId: draft.listing.listingId,
        guestId: profile.guestId,
        checkInDate: draft.checkIn,
        checkOutDate: draft.checkOut,
        paymentMethodId: DEFAULT_PAYMENT_METHOD,
        bookingMode: draft.listing.bookingMode,
      }),
    });

    return {
      bookingId: result.bookingId,
      status: mapStatus(result.status),
      guestId: profile.guestId,
    };
  },

  async getBooking(bookingId: string) {
    return request<BookingRecord>(`/bookings/${encodeURIComponent(bookingId)}`);
  },

  async approveBooking(bookingId: string) {
    return request<{ bookingId: string; status: string }>(`/bookings/${encodeURIComponent(bookingId)}/approve`, {
      method: "POST",
    });
  },

  async rejectBooking(bookingId: string) {
    return request<{ bookingId: string; status: string }>(`/bookings/${encodeURIComponent(bookingId)}/reject`, {
      method: "POST",
    });
  },

  async getStay(stayId: string) {
    return request<StayRecord>(`/stays/${encodeURIComponent(stayId)}`);
  },

  async resolveDeposit(stayId: string, conditionResult: "GOOD" | "BAD", notes: string) {
    return request<{ stayId: string; action: string; depositStatus: string }>("/deposit-resolutions", {
      method: "POST",
      body: JSON.stringify({
        stayId,
        conditionResult,
        notes,
        photos: [],
      }),
    });
  },

  toTrip(record: StoredTrip | BookingRecord, listing?: Listing): Booking {
    if ("id" in record) {
      return record as Booking;
    }

    return {
      id: record.bookingId,
      bookingId: record.bookingId,
      listingId: record.listingId,
      listingTitle: listing?.title || `Listing ${record.listingId.slice(0, 8)}`,
      listingImage: listing?.coverImage || getListingImages(record.listingId)[0],
      location: listing?.location || "Location unavailable",
      checkIn: record.checkInDate,
      checkOut: record.checkOutDate,
      guests: listing?.maxGuests || 1,
      totalPrice: listing?.price || 0,
      status: mapStatus(record.status),
      createdAt: record.createdAt,
    };
  },
};
