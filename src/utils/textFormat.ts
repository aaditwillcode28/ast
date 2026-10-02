/**
 * Text standardization utilities for KataTira
 * Automatically normalizes formats (3V3 -> 3v3), age categories (u-8 -> U-8), etc.
 */

export function normalizeTournamentType(type: string): string {
  if (!type) return '';
  const trimmed = type.trim();
  
  // Standardize formats like 1v1, 3v3, 5v5, 2v2, 4v4
  const formatMatch = trimmed.match(/^(\d+)\s*[vV]\s*(\d+)$/);
  if (formatMatch) {
    return `${formatMatch[1]}v${formatMatch[2]}`;
  }
  
  // Handle other common names
  if (/^3\s*point/i.test(trimmed)) return '3-Point Contest';
  if (/^dunk/i.test(trimmed)) return 'Dunk Contest';
  if (/^skills/i.test(trimmed)) return 'Skills Challenge';

  return trimmed;
}

export function normalizeAgeDivision(age: string): string {
  if (!age) return '';
  const trimmed = age.trim();
  
  // Standardize u-8, u8, U8, u-14, u16, u-19 to U-8, U-14, U-16, etc.
  const uMatch = trimmed.match(/^[uU][\s-]?(\d+)$/);
  if (uMatch) {
    return `U-${uMatch[1]}`;
  }
  
  if (/^open$/i.test(trimmed)) return 'Open';
  if (/^veteran/i.test(trimmed)) return 'Veterans 35+';
  if (/^corporate/i.test(trimmed)) return 'Corporate';

  return trimmed;
}

export function formatEventDates(
  startDate: string,
  endDate?: string,
  bsStartDate?: string,
  bsEndDate?: string,
  calendarType: 'AD' | 'BS' = 'AD'
): string {
  if (calendarType === 'BS' && bsStartDate) {
    if (bsEndDate && bsEndDate !== bsStartDate) {
      return `${bsStartDate} – ${bsEndDate} (BS)`;
    }
    return `${bsStartDate} (BS)`;
  }

  if (!startDate) return '';
  
  const start = new Date(startDate);
  if (isNaN(start.getTime())) return startDate;

  const startFormatted = start.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  if (!endDate || endDate === startDate) {
    return startFormatted;
  }

  const end = new Date(endDate);
  if (isNaN(end.getTime())) return startFormatted;

  const endFormatted = end.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  return `${startFormatted} – ${endFormatted}`;
}
