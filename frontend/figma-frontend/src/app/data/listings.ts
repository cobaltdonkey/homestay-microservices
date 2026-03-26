export interface ListingData {
  id: string;
  propertyType: string;
  location: string;
  price: number;
  rating: number;
  reviewCount: number;
  bookingType: 'instant' | 'request';
  imageUrl: string;
  images: string[];
  description: string;
  blockedDates: { start: string; end: string }[];
  host: {
    name: string;
    isSuperhost: boolean;
    avatar: string;
  };
}

export const listingsData: Record<string, ListingData> = {
  '1': {
    id: '1',
    propertyType: 'Bungalow',
    location: 'Sentosa',
    price: 580,
    rating: 4.95,
    reviewCount: 142,
    bookingType: 'instant',
    imageUrl: 'https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=800&q=80',
    images: [
      'https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=1200&q=80',
      'https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=600&q=80',
      'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=600&q=80',
      'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=600&q=80',
      'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=600&q=80',
    ],
    description: 'Stunning beachfront bungalow in Sentosa with panoramic ocean views. Perfect for a luxurious island getaway with easy access to beaches, attractions, and fine dining.',
    blockedDates: [
      { start: '2026-03-25', end: '2026-03-28' },
      { start: '2026-04-10', end: '2026-04-14' },
    ],
    host: {
      name: 'Sarah Chen',
      isSuperhost: true,
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&q=80',
    },
  },
  '2': {
    id: '2',
    propertyType: 'Home',
    location: 'Orchard',
    price: 740,
    rating: 4.98,
    reviewCount: 189,
    bookingType: 'request',
    imageUrl: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800&q=80',
    images: [
      'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=1200&q=80',
      'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=600&q=80',
      'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=600&q=80',
      'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=600&q=80',
      'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=600&q=80',
    ],
    description: 'Elegant home in the heart of Orchard Road. Experience luxury shopping, dining, and entertainment at your doorstep in this beautifully designed space.',
    blockedDates: [
      { start: '2026-03-27', end: '2026-03-30' },
      { start: '2026-04-05', end: '2026-04-09' },
    ],
    host: {
      name: 'Michael Tan',
      isSuperhost: true,
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&q=80',
    },
  },
  '3': {
    id: '3',
    propertyType: 'Flat',
    location: 'Tiong Bahru',
    price: 280,
    rating: 5.0,
    reviewCount: 96,
    bookingType: 'instant',
    imageUrl: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&q=80',
    images: [
      'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=1200&q=80',
      'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=600&q=80',
      'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=600&q=80',
      'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=600&q=80',
      'https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=600&q=80',
    ],
    description: 'Charming flat in trendy Tiong Bahru. Enjoy local cafes, bookstores, and the authentic Singapore neighborhood vibe in this cozy, well-appointed space.',
    blockedDates: [
      { start: '2026-03-24', end: '2026-03-26' },
      { start: '2026-04-01', end: '2026-04-05' },
    ],
    host: {
      name: 'Emma Wong',
      isSuperhost: false,
      avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&q=80',
    },
  },
  '4': {
    id: '4',
    propertyType: 'Loft',
    location: 'Bugis',
    price: 320,
    rating: 4.91,
    reviewCount: 127,
    bookingType: 'request',
    imageUrl: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&q=80',
    images: [
      'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=1200&q=80',
      'https://images.unsplash.com/photo-1560448204-603b3fc33ddc?w=600&q=80',
      'https://images.unsplash.com/photo-1560449752-e1f2d9c7e9e6?w=600&q=80',
      'https://images.unsplash.com/photo-1560449752-f9b5f4f9c8e3?w=600&q=80',
      'https://images.unsplash.com/photo-1560185127-6a7e5d4d3a3f?w=600&q=80',
    ],
    description: 'Experience modern luxury in the heart of Bugis. This stunning loft features floor-to-ceiling windows, contemporary design, and premium amenities. Perfect for travelers seeking comfort and style in a prime location with easy access to shopping, dining, and cultural attractions.',
    blockedDates: [
      { start: '2026-03-28', end: '2026-04-02' },
      { start: '2026-04-15', end: '2026-04-19' },
    ],
    host: {
      name: 'James Lim',
      isSuperhost: true,
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&q=80',
    },
  },
  '5': {
    id: '5',
    propertyType: 'Villa',
    location: 'East Coast',
    price: 960,
    rating: 4.78,
    reviewCount: 134,
    bookingType: 'instant',
    imageUrl: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&q=80',
    images: [
      'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1200&q=80',
      'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=600&q=80',
      'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=600&q=80',
      'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=600&q=80',
      'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=600&q=80',
    ],
    description: 'Spacious villa near East Coast Park. Enjoy beachside living with modern amenities, perfect for families or groups seeking a relaxing coastal retreat.',
    blockedDates: [
      { start: '2026-03-26', end: '2026-03-29' },
      { start: '2026-04-08', end: '2026-04-12' },
    ],
    host: {
      name: 'David Ng',
      isSuperhost: true,
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&q=80',
    },
  },
  '6': {
    id: '6',
    propertyType: 'Studio',
    location: 'Jurong',
    price: 180,
    rating: 4.85,
    reviewCount: 78,
    bookingType: 'request',
    imageUrl: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&q=80',
    images: [
      'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=1200&q=80',
      'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=600&q=80',
      'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=600&q=80',
      'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=600&q=80',
      'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=600&q=80',
    ],
    description: 'Affordable studio in Jurong with great connectivity. Ideal for budget-conscious travelers or business professionals looking for a comfortable base.',
    blockedDates: [
      { start: '2026-03-30', end: '2026-04-03' },
      { start: '2026-04-20', end: '2026-04-24' },
    ],
    host: {
      name: 'Linda Koh',
      isSuperhost: false,
      avatar: 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=100&q=80',
    },
  },
  '7': {
    id: '7',
    propertyType: 'Penthouse',
    location: 'Marina Bay',
    price: 1200,
    rating: 4.97,
    reviewCount: 215,
    bookingType: 'instant',
    imageUrl: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800&q=80',
    images: [
      'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=1200&q=80',
      'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=600&q=80',
      'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=600&q=80',
      'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=600&q=80',
      'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=600&q=80',
    ],
    description: 'Luxurious penthouse with breathtaking Marina Bay views. Experience world-class luxury with premium finishes, rooftop terrace, and unparalleled city skyline vistas.',
    blockedDates: [
      { start: '2026-03-23', end: '2026-03-25' },
      { start: '2026-04-06', end: '2026-04-10' },
    ],
    host: {
      name: 'Robert Lee',
      isSuperhost: true,
      avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=100&q=80',
    },
  },
};

export function getListingById(id: string): ListingData | undefined {
  return listingsData[id];
}
