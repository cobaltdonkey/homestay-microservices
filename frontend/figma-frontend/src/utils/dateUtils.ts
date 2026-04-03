/**
 * Formats a Date object into a YYYY-MM-DD string using local time components.
 * This avoids the 1-day backdating issue caused by toISOString() in timezones ahead of UTC.
 */
export const formatDateToYYYYMMDD = (date: Date | null): string => {
  if (!date) return '';
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};
