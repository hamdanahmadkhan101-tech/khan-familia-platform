import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Converts PascalCase or SCREAMING_SNAKE_CASE enum strings from the DB
 * into human-readable, title-cased display labels.
 *
 * Examples:
 *   'VACATION_RENTALS' => 'Vacation Rentals'
 *   'HOTELS_HOSPITALITY' => 'Hotels & Hospitality'
 *   'B_AND_B'           => 'B&B'
 *   'GUESTHOUSE'        => 'Guesthouse'
 */
export function humanizeEnum(value: string | null | undefined): string {
  if (!value) return '';

  const overrides: Record<string, string> = {
    B_AND_B: 'B&B',
    HOTELS_HOSPITALITY: 'Hotels & Hospitality',
    ALTERNATIVE_STAYS: 'Alternative Stays',
    VACATION_RENTALS: 'Vacation Rentals',
    UNIQUE_STAYS: 'Unique Stays',
    RESORT: 'Resort',
    HOTEL: 'Hotel',
    GUESTHOUSE: 'Guesthouse',
    HOSTEL: 'Hostel',
    APARTMENT: 'Apartment',
    VILLA: 'Villa',
    COTTAGE: 'Cottage',
    CABIN: 'Cabin',
    CAMPING: 'Camping',
    GLAMPING: 'Glamping',
    TREEHOUSE: 'Treehouse',
    BOAT: 'Boat',
    FARM: 'Farm',
    CASTLE: 'Castle',
  };

  if (overrides[value]) return overrides[value]!;

  // Fallback: replace underscores with spaces and title-case each word
  return value
    .toLowerCase()
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}
