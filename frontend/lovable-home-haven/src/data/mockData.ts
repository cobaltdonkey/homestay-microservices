export interface Listing {
  id: string;
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
  reviews: Review[];
}

export interface Review {
  id: string;
  author: string;
  avatar: string;
  date: string;
  rating: number;
  comment: string;
}

export interface Booking {
  id: string;
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

const LISTING_IMAGES = [
  "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&q=80",
  "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&q=80",
  "https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=800&q=80",
  "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800&q=80",
  "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800&q=80",
  "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&q=80",
  "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&q=80",
  "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800&q=80",
  "https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=800&q=80",
  "https://images.unsplash.com/photo-1582268611958-ebfd161ef9cf?w=800&q=80",
  "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=800&q=80",
  "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=800&q=80",
];

const HOST_AVATARS = [
  "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&q=80",
  "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&q=80",
  "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&q=80",
];

export const mockListings: Listing[] = [
  {
    id: "lst-001",
    title: "Sunlit Loft in the Heart of Shibuya",
    location: "Shibuya, Tokyo",
    city: "Tokyo",
    country: "Japan",
    price: 142,
    rating: 4.92,
    reviewCount: 234,
    coverImage: LISTING_IMAGES[0],
    images: [LISTING_IMAGES[0], LISTING_IMAGES[5], LISTING_IMAGES[6], LISTING_IMAGES[7], LISTING_IMAGES[8]],
    summary: "A beautifully designed loft with floor-to-ceiling windows, walking distance to everything.",
    description: "Welcome to our stunning loft apartment in the vibrant heart of Shibuya. This beautifully renovated space combines modern Japanese minimalism with warm, inviting touches. Floor-to-ceiling windows flood the space with natural light, while the open-plan layout creates a sense of spaciousness. Located just minutes from Shibuya Crossing, you'll have easy access to world-class dining, shopping, and entertainment.",
    instantBook: true,
    propertyType: "Apartment",
    maxGuests: 4,
    bedrooms: 2,
    beds: 2,
    bathrooms: 1,
    amenities: ["WiFi", "Kitchen", "Air conditioning", "Washer", "Workspace", "TV", "Hair dryer", "Iron", "City view", "Elevator"],
    houseRules: ["No smoking", "No parties", "Check-in after 3 PM", "Check-out before 11 AM", "Quiet hours 10 PM–8 AM"],
    cancellationPolicy: "Free cancellation up to 48 hours before check-in. After that, the first night is non-refundable.",
    hostName: "Yuki",
    hostAvatar: HOST_AVATARS[1],
    hostSince: "2019",
    hostResponseRate: 99,
    sleepingArrangements: [
      { room: "Bedroom 1", beds: "1 queen bed" },
      { room: "Bedroom 2", beds: "1 double bed" },
    ],
    reviews: [
      { id: "r1", author: "Sarah", avatar: HOST_AVATARS[1], date: "March 2026", rating: 5, comment: "Absolutely stunning place! The location is unbeatable and Yuki was an incredible host." },
      { id: "r2", author: "James", avatar: HOST_AVATARS[2], date: "February 2026", rating: 5, comment: "Clean, modern, and perfectly located. Would definitely stay again." },
      { id: "r3", author: "Maria", avatar: HOST_AVATARS[0], date: "January 2026", rating: 4, comment: "Great apartment with amazing views. A bit noisy at night due to the central location." },
    ],
  },
  {
    id: "lst-002",
    title: "Cliffside Villa with Infinity Pool",
    location: "Uluwatu, Bali",
    city: "Bali",
    country: "Indonesia",
    price: 289,
    rating: 4.97,
    reviewCount: 178,
    coverImage: LISTING_IMAGES[1],
    images: [LISTING_IMAGES[1], LISTING_IMAGES[2], LISTING_IMAGES[3], LISTING_IMAGES[9], LISTING_IMAGES[10]],
    summary: "Wake up to panoramic ocean views in this luxury cliffside retreat.",
    description: "Perched on the dramatic cliffs of Uluwatu, this stunning villa offers breathtaking panoramic views of the Indian Ocean. The infinity pool seems to merge with the horizon, creating an unforgettable visual experience. Every detail has been carefully curated to provide the ultimate luxury retreat, from the handcrafted Balinese furniture to the premium linens.",
    instantBook: false,
    propertyType: "Villa",
    maxGuests: 6,
    bedrooms: 3,
    beds: 3,
    bathrooms: 3,
    amenities: ["Infinity pool", "Ocean view", "WiFi", "Kitchen", "Air conditioning", "Private chef available", "Yoga deck", "Garden", "BBQ", "Parking"],
    houseRules: ["No smoking indoors", "No events", "Check-in after 2 PM", "Check-out before 12 PM"],
    cancellationPolicy: "Moderate: Full refund if cancelled 5 days before check-in.",
    hostName: "Made",
    hostAvatar: HOST_AVATARS[0],
    hostSince: "2017",
    hostResponseRate: 97,
    sleepingArrangements: [
      { room: "Master Suite", beds: "1 king bed" },
      { room: "Bedroom 2", beds: "1 queen bed" },
      { room: "Bedroom 3", beds: "2 single beds" },
    ],
    reviews: [
      { id: "r4", author: "Emily", avatar: HOST_AVATARS[1], date: "March 2026", rating: 5, comment: "A dream come true. The views are even better in person. Made arranged everything perfectly." },
      { id: "r5", author: "Tom", avatar: HOST_AVATARS[2], date: "February 2026", rating: 5, comment: "Best villa we've ever stayed in. The private chef dinner was a highlight." },
    ],
  },
  {
    id: "lst-003",
    title: "Charming Brownstone in Brooklyn Heights",
    location: "Brooklyn Heights, New York",
    city: "New York",
    country: "United States",
    price: 195,
    rating: 4.85,
    reviewCount: 312,
    coverImage: LISTING_IMAGES[2],
    images: [LISTING_IMAGES[2], LISTING_IMAGES[5], LISTING_IMAGES[6], LISTING_IMAGES[7], LISTING_IMAGES[11]],
    summary: "A classic NYC brownstone with modern amenities and neighborhood charm.",
    description: "Step into quintessential New York living in this beautifully restored brownstone. Original architectural details blend seamlessly with modern comforts. Located on a tree-lined street in Brooklyn Heights, you're steps from the Promenade with its stunning Manhattan skyline views, excellent restaurants, and easy subway access to all of NYC.",
    instantBook: true,
    propertyType: "Townhouse",
    maxGuests: 5,
    bedrooms: 2,
    beds: 3,
    bathrooms: 2,
    amenities: ["WiFi", "Kitchen", "Heating", "Washer/Dryer", "Workspace", "TV", "Coffee maker", "Backyard", "Fireplace", "Street parking"],
    houseRules: ["No smoking", "No parties", "Check-in after 4 PM", "Check-out before 11 AM", "Pets welcome"],
    cancellationPolicy: "Flexible: Full refund if cancelled 24 hours before check-in.",
    hostName: "David",
    hostAvatar: HOST_AVATARS[2],
    hostSince: "2016",
    hostResponseRate: 95,
    sleepingArrangements: [
      { room: "Master Bedroom", beds: "1 king bed" },
      { room: "Guest Room", beds: "1 queen + 1 daybed" },
    ],
    reviews: [
      { id: "r6", author: "Anna", avatar: HOST_AVATARS[1], date: "March 2026", rating: 5, comment: "Such a cozy and beautifully designed space. David was very helpful with local tips." },
      { id: "r7", author: "Michael", avatar: HOST_AVATARS[0], date: "January 2026", rating: 5, comment: "Perfect location and a truly special home. The backyard was a lovely surprise." },
    ],
  },
  {
    id: "lst-004",
    title: "Lakeside Cabin with Mountain Views",
    location: "Interlaken, Switzerland",
    city: "Interlaken",
    country: "Switzerland",
    price: 220,
    rating: 4.93,
    reviewCount: 156,
    coverImage: LISTING_IMAGES[3],
    images: [LISTING_IMAGES[3], LISTING_IMAGES[8], LISTING_IMAGES[9], LISTING_IMAGES[10], LISTING_IMAGES[11]],
    summary: "A serene alpine retreat nestled between lakes with breathtaking Swiss mountain panoramas.",
    description: "Escape to the Swiss Alps in this charming lakeside cabin. Wake up to the sound of cowbells and panoramic views of the Jungfrau, Eiger, and Mönch mountains. The cabin features a cozy wood-burning fireplace, a fully equipped kitchen, and a private dock for swimming in crystal-clear lake waters.",
    instantBook: true,
    propertyType: "Cabin",
    maxGuests: 4,
    bedrooms: 2,
    beds: 2,
    bathrooms: 1,
    amenities: ["Lake access", "Mountain view", "Fireplace", "WiFi", "Kitchen", "Heating", "Parking", "BBQ", "Kayak", "Hiking trails"],
    houseRules: ["No smoking", "No parties", "Check-in after 3 PM", "Check-out before 10 AM"],
    cancellationPolicy: "Moderate: Full refund if cancelled 5 days before check-in.",
    hostName: "Anna",
    hostAvatar: HOST_AVATARS[1],
    hostSince: "2018",
    hostResponseRate: 100,
    sleepingArrangements: [
      { room: "Loft Bedroom", beds: "1 king bed" },
      { room: "Ground Floor", beds: "1 double sofa bed" },
    ],
    reviews: [
      { id: "r8", author: "Chris", avatar: HOST_AVATARS[2], date: "March 2026", rating: 5, comment: "Magical setting. The cabin is even cozier than the photos suggest. Anna was wonderful." },
    ],
  },
  {
    id: "lst-005",
    title: "Minimalist Studio in Le Marais",
    location: "Le Marais, Paris",
    city: "Paris",
    country: "France",
    price: 168,
    rating: 4.88,
    reviewCount: 421,
    coverImage: LISTING_IMAGES[4],
    images: [LISTING_IMAGES[4], LISTING_IMAGES[5], LISTING_IMAGES[6], LISTING_IMAGES[0], LISTING_IMAGES[1]],
    summary: "A chic Parisian studio blending vintage charm with modern comfort.",
    description: "Located in the trendy Le Marais district, this thoughtfully designed studio offers the quintessential Parisian experience. High ceilings, herringbone floors, and large windows overlooking a quiet courtyard. Steps from world-class museums, bakeries, and boutiques.",
    instantBook: true,
    propertyType: "Studio",
    maxGuests: 2,
    bedrooms: 1,
    beds: 1,
    bathrooms: 1,
    amenities: ["WiFi", "Kitchen", "Air conditioning", "Washer", "Workspace", "Coffee maker", "Elevator", "Courtyard view"],
    houseRules: ["No smoking", "No parties", "Check-in after 2 PM", "Check-out before 11 AM"],
    cancellationPolicy: "Flexible: Full refund if cancelled 24 hours before check-in.",
    hostName: "Claire",
    hostAvatar: HOST_AVATARS[1],
    hostSince: "2020",
    hostResponseRate: 98,
    sleepingArrangements: [
      { room: "Studio", beds: "1 queen bed" },
    ],
    reviews: [
      { id: "r9", author: "Lucas", avatar: HOST_AVATARS[0], date: "February 2026", rating: 5, comment: "Perfect Paris pied-à-terre. Claire's recommendations were spot-on." },
      { id: "r10", author: "Sophie", avatar: HOST_AVATARS[2], date: "January 2026", rating: 4, comment: "Lovely studio, great location. A bit small but expected for Paris." },
    ],
  },
  {
    id: "lst-006",
    title: "Oceanfront Penthouse with Rooftop Terrace",
    location: "Copacabana, Rio de Janeiro",
    city: "Rio de Janeiro",
    country: "Brazil",
    price: 310,
    rating: 4.91,
    reviewCount: 89,
    coverImage: LISTING_IMAGES[5],
    images: [LISTING_IMAGES[5], LISTING_IMAGES[9], LISTING_IMAGES[10], LISTING_IMAGES[11], LISTING_IMAGES[0]],
    summary: "Luxury penthouse overlooking Copacabana Beach with a private rooftop terrace.",
    description: "Experience Rio from the top in this spectacular penthouse with unobstructed views of Copacabana Beach and Sugarloaf Mountain. The private rooftop terrace features a plunge pool, outdoor dining area, and sun loungers. Interior design blends Brazilian tropical vibes with contemporary luxury.",
    instantBook: false,
    propertyType: "Penthouse",
    maxGuests: 8,
    bedrooms: 4,
    beds: 5,
    bathrooms: 3,
    amenities: ["Rooftop pool", "Beach access", "Ocean view", "WiFi", "Kitchen", "Air conditioning", "Doorman", "Gym", "Parking", "BBQ"],
    houseRules: ["No smoking", "No events over 8 guests", "Check-in after 3 PM", "Check-out before 12 PM"],
    cancellationPolicy: "Strict: 50% refund if cancelled 7 days before check-in.",
    hostName: "Rafael",
    hostAvatar: HOST_AVATARS[0],
    hostSince: "2021",
    hostResponseRate: 96,
    sleepingArrangements: [
      { room: "Master Suite", beds: "1 king bed" },
      { room: "Bedroom 2", beds: "1 queen bed" },
      { room: "Bedroom 3", beds: "1 queen bed" },
      { room: "Bedroom 4", beds: "2 single beds" },
    ],
    reviews: [
      { id: "r11", author: "Kate", avatar: HOST_AVATARS[1], date: "March 2026", rating: 5, comment: "Absolutely incredible! The rooftop views at sunset are life-changing." },
    ],
  },
];

export const mockBookings: Booking[] = [
  {
    id: "bk-001",
    listingId: "lst-001",
    listingTitle: "Sunlit Loft in the Heart of Shibuya",
    listingImage: LISTING_IMAGES[0],
    location: "Shibuya, Tokyo",
    checkIn: "2026-04-15",
    checkOut: "2026-04-20",
    guests: 2,
    totalPrice: 710,
    status: "confirmed",
    createdAt: "2026-03-10",
  },
  {
    id: "bk-002",
    listingId: "lst-002",
    listingTitle: "Cliffside Villa with Infinity Pool",
    listingImage: LISTING_IMAGES[1],
    location: "Uluwatu, Bali",
    checkIn: "2026-05-01",
    checkOut: "2026-05-08",
    guests: 4,
    totalPrice: 2023,
    status: "pending",
    createdAt: "2026-03-15",
  },
  {
    id: "bk-003",
    listingId: "lst-003",
    listingTitle: "Charming Brownstone in Brooklyn Heights",
    listingImage: LISTING_IMAGES[2],
    location: "Brooklyn Heights, New York",
    checkIn: "2026-01-10",
    checkOut: "2026-01-15",
    guests: 3,
    totalPrice: 975,
    status: "completed",
    createdAt: "2025-12-20",
  },
  {
    id: "bk-004",
    listingId: "lst-005",
    listingTitle: "Minimalist Studio in Le Marais",
    listingImage: LISTING_IMAGES[4],
    location: "Le Marais, Paris",
    checkIn: "2026-02-14",
    checkOut: "2026-02-18",
    guests: 2,
    totalPrice: 672,
    status: "cancelled",
    createdAt: "2026-01-28",
  },
];

// ── API Integration Stubs ──
// These functions simulate API calls. Replace the bodies with real fetch/axios calls
// to your microservices backend.

export const api = {
  /** GET /api/listings?destination=...&checkIn=...&checkOut=...&guests=... */
  searchListings: async (filters: {
    destination?: string;
    checkIn?: string;
    checkOut?: string;
    guests?: number;
    minPrice?: number;
    maxPrice?: number;
    propertyType?: string;
    instantBook?: boolean;
    minRating?: number;
  }): Promise<Listing[]> => {
    await new Promise((r) => setTimeout(r, 800));
    let results = [...mockListings];
    if (filters.destination) {
      const q = filters.destination.toLowerCase();
      results = results.filter(
        (l) => l.city.toLowerCase().includes(q) || l.country.toLowerCase().includes(q) || l.location.toLowerCase().includes(q)
      );
    }
    if (filters.minPrice) results = results.filter((l) => l.price >= filters.minPrice!);
    if (filters.maxPrice) results = results.filter((l) => l.price <= filters.maxPrice!);
    if (filters.propertyType) results = results.filter((l) => l.propertyType === filters.propertyType);
    if (filters.instantBook) results = results.filter((l) => l.instantBook);
    if (filters.minRating) results = results.filter((l) => l.rating >= filters.minRating!);
    return results;
  },

  /** GET /api/listings/:id */
  getListingDetails: async (id: string): Promise<Listing | null> => {
    await new Promise((r) => setTimeout(r, 500));
    return mockListings.find((l) => l.id === id) || null;
  },

  /** POST /api/listings/:id/availability */
  checkAvailability: async (_listingId: string, _checkIn: string, _checkOut: string): Promise<{ available: boolean }> => {
    await new Promise((r) => setTimeout(r, 400));
    return { available: true };
  },

  /** POST /api/bookings */
  createBooking: async (data: {
    listingId: string;
    checkIn: string;
    checkOut: string;
    guests: number;
    guestInfo: { name: string; email: string; phone: string };
  }): Promise<{ bookingId: string; status: string }> => {
    await new Promise((r) => setTimeout(r, 1000));
    const listing = mockListings.find((l) => l.id === data.listingId);
    return {
      bookingId: `bk-${Date.now()}`,
      status: listing?.instantBook ? "confirmed" : "pending",
    };
  },

  /** GET /api/bookings/:id */
  getBookingStatus: async (bookingId: string): Promise<Booking | null> => {
    await new Promise((r) => setTimeout(r, 300));
    return mockBookings.find((b) => b.id === bookingId) || null;
  },

  /** GET /api/bookings?guestId=... */
  getMyTrips: async (): Promise<Booking[]> => {
    await new Promise((r) => setTimeout(r, 600));
    return mockBookings;
  },
};
