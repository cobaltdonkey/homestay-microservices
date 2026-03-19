const IMAGE_SETS = [
  [
    "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1484154218962-a197022b5858?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1494526585095-c41746248156?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1200&q=80"
  ],
  [
    "https://images.unsplash.com/photo-1494526585095-c41746248156?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1600585154526-990dced4db0d?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1600573472550-8090b5e0745e?auto=format&fit=crop&w=1200&q=80"
  ],
  [
    "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1480074568708-e7b720bb3f09?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1560185127-6ed189bf02f4?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1505691938895-1758d7feb511?auto=format&fit=crop&w=1200&q=80"
  ],
  [
    "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1613490493576-7fde63acd811?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1600566752355-35792bedcfea?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1600607687644-c7171b42498f?auto=format&fit=crop&w=1200&q=80"
  ],
];

const AMENITY_LIBRARY = [
  ["WiFi", "Kitchen", "Air conditioning", "Washer", "Workspace", "Self check-in", "Coffee maker", "Fresh linens"],
  ["WiFi", "Pool access", "Mountain view", "Kitchen", "Parking", "Balcony", "Smart TV", "Breakfast essentials"],
  ["WiFi", "City view", "Elevator", "Air conditioning", "Workspace", "Security access", "Hair dryer", "Iron"],
  ["WiFi", "Garden", "Washer", "Family friendly", "Dining area", "Heating", "Outdoor seating", "Dedicated parking"],
];

const HOUSE_RULES = [
  "Check-in after 3 PM",
  "Check-out before 11 AM",
  "No smoking indoors",
  "No parties or events",
  "Please respect quiet hours after 10 PM",
];

const CANCELLATION_POLICIES = [
  "Free cancellation up to 48 hours before check-in.",
  "Moderate policy: full refund if cancelled 5 days before check-in.",
  "Flexible policy: full refund if cancelled 24 hours before check-in.",
  "Strict policy: 50% refund if cancelled 7 days before check-in.",
];

const HOST_AVATARS = [
  "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=200&q=80",
  "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&q=80",
  "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=200&q=80",
  "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=200&q=80",
];

function hashString(value: string) {
  return value.split("").reduce((acc, char) => ((acc << 5) - acc + char.charCodeAt(0)) | 0, 0);
}

function pickByHash<T>(items: T[], seed: string) {
  return items[Math.abs(hashString(seed)) % items.length];
}

export function getListingImages(seed: string) {
  return pickByHash(IMAGE_SETS, seed);
}

export function getHostAvatar(seed: string) {
  return pickByHash(HOST_AVATARS, seed);
}

export function inferPropertyType(title: string) {
  const normalized = title.toLowerCase();
  if (normalized.includes("villa")) return "Villa";
  if (normalized.includes("studio")) return "Studio";
  if (normalized.includes("room")) return "Private room";
  if (normalized.includes("condo")) return "Condo";
  if (normalized.includes("loft")) return "Loft";
  if (normalized.includes("cabin")) return "Cabin";
  return "Apartment";
}

export function inferSummary(title: string, location: string) {
  return `${title} offers a polished stay experience in ${location}, with fast access to local attractions and business hubs.`;
}

export function inferDescription(title: string, location: string) {
  return `${title} is curated for travelers who want a seamless blend of comfort, location, and reliability in ${location}. Expect a clean, well-appointed home base with thoughtful essentials for work trips, weekend getaways, and longer stays.`;
}

export function inferAmenities(seed: string) {
  return pickByHash(AMENITY_LIBRARY, seed);
}

export function inferHouseRules() {
  return HOUSE_RULES;
}

export function inferCancellationPolicy(seed: string) {
  return pickByHash(CANCELLATION_POLICIES, seed);
}

export function inferCapacity(seed: string) {
  const hash = Math.abs(hashString(seed));
  const bedrooms = (hash % 3) + 1;
  const beds = Math.max(bedrooms, Math.min(4, bedrooms + (hash % 2)));
  const bathrooms = Math.min(3, Math.max(1, Math.round(bedrooms / 1.5)));
  const maxGuests = Math.min(8, Math.max(2, bedrooms * 2));
  return { bedrooms, beds, bathrooms, maxGuests };
}

export function inferSleepingArrangements(bedrooms: number, beds: number) {
  const arrangements = [] as { room: string; beds: string }[];
  for (let i = 0; i < bedrooms; i += 1) {
    arrangements.push({
      room: bedrooms === 1 ? "Main space" : `Bedroom ${i + 1}`,
      beds: i === 0 ? "1 queen bed" : i < beds ? "1 double bed" : "1 single bed",
    });
  }
  return arrangements;
}

export function inferReviewData(seed: string) {
  const hash = Math.abs(hashString(seed));
  const reviewCount = 24 + (hash % 180);
  const rating = Number((4.6 + ((hash % 35) / 100)).toFixed(2));
  return { reviewCount, rating };
}
