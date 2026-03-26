import { ListingData } from '../data/listings';

export function isListingAvailable(
  listing: ListingData,
  checkIn: Date | null,
  checkOut: Date | null
): boolean {
  if (!checkIn || !checkOut) return true;

  const checkInTime = new Date(checkIn);
  const checkOutTime = new Date(checkOut);
  checkInTime.setHours(0, 0, 0, 0);
  checkOutTime.setHours(0, 0, 0, 0);

  // Check if the date range overlaps with any blocked dates
  for (const blocked of listing.blockedDates) {
    const blockedStart = new Date(blocked.start);
    const blockedEnd = new Date(blocked.end);
    blockedStart.setHours(0, 0, 0, 0);
    blockedEnd.setHours(0, 0, 0, 0);

    // Check if there's any overlap
    // Overlap occurs if: checkIn < blockedEnd AND checkOut > blockedStart
    if (checkInTime <= blockedEnd && checkOutTime >= blockedStart) {
      return false;
    }
  }

  return true;
}
