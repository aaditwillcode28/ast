/**
 * Nepali Calendar (Bikram Sambat - BS) utilities
 */

export const NEPALI_MONTHS = [
  { id: 1, nameEn: 'Baisakh', nameNp: 'बैशाख' },
  { id: 2, nameEn: 'Jestha', nameNp: 'जेठ' },
  { id: 3, nameEn: 'Ashadh', nameNp: 'असार' },
  { id: 4, nameEn: 'Shrawan', nameNp: 'साउन' },
  { id: 5, nameEn: 'Bhadra', nameNp: 'भदौ' },
  { id: 6, nameEn: 'Ashwin', nameNp: 'असोज' },
  { id: 7, nameEn: 'Kartik', nameNp: 'कात्तिक' },
  { id: 8, nameEn: 'Mangsir', nameNp: 'मंसिर' },
  { id: 9, nameEn: 'Poush', nameNp: 'पुष' },
  { id: 10, nameEn: 'Magh', nameNp: 'माघ' },
  { id: 11, nameEn: 'Falgun', nameNp: 'फागुन' },
  { id: 12, nameEn: 'Chaitra', nameNp: 'चैत' },
];

export interface BsDate {
  year: number;
  month: number;
  day: number;
}

/**
 * Approximate AD to BS conversion (BS is approximately AD + 56 years, 8 months, 17 days)
 */
export function convertAdToBs(adDateStr: string): { bsDateStr: string; year: number; month: number; day: number } {
  const d = new Date(adDateStr);
  if (isNaN(d.getTime())) {
    return { bsDateStr: '2083 Bhadra 27', year: 2083, month: 5, day: 27 };
  }

  const adYear = d.getFullYear();
  const adMonth = d.getMonth() + 1; // 1-12
  const adDay = d.getDate();

  // Approximate BS calculation
  let bsYear = adYear + 57;
  let bsMonth = 1;
  let bsDay = 1;

  if (adMonth < 4 || (adMonth === 4 && adDay < 14)) {
    bsYear = adYear + 56;
  }

  // Calculate approximate month & day
  if (adMonth === 1) { bsMonth = 9; bsDay = (adDay + 16) % 30 || 30; }
  else if (adMonth === 2) { bsMonth = 10; bsDay = (adDay + 17) % 30 || 30; }
  else if (adMonth === 3) { bsMonth = 11; bsDay = (adDay + 16) % 30 || 30; }
  else if (adMonth === 4) { bsMonth = adDay < 14 ? 12 : 1; bsDay = adDay < 14 ? adDay + 17 : adDay - 13; }
  else if (adMonth === 5) { bsMonth = adDay < 15 ? 1 : 2; bsDay = adDay < 15 ? adDay + 17 : adDay - 14; }
  else if (adMonth === 6) { bsMonth = adDay < 15 ? 2 : 3; bsDay = adDay < 15 ? adDay + 17 : adDay - 14; }
  else if (adMonth === 7) { bsMonth = adDay < 16 ? 3 : 4; bsDay = adDay < 16 ? adDay + 16 : adDay - 15; }
  else if (adMonth === 8) { bsMonth = adDay < 17 ? 4 : 5; bsDay = adDay < 17 ? adDay + 16 : adDay - 16; }
  else if (adMonth === 9) { bsMonth = adDay < 17 ? 5 : 6; bsDay = adDay < 17 ? adDay + 15 : adDay - 16; }
  else if (adMonth === 10) { bsMonth = adDay < 17 ? 6 : 7; bsDay = adDay < 17 ? adDay + 14 : adDay - 16; }
  else if (adMonth === 11) { bsMonth = adDay < 16 ? 7 : 8; bsDay = adDay < 16 ? adDay + 15 : adDay - 15; }
  else if (adMonth === 12) { bsMonth = adDay < 16 ? 8 : 9; bsDay = adDay < 16 ? adDay + 15 : adDay - 15; }

  const monthObj = NEPALI_MONTHS[bsMonth - 1] || NEPALI_MONTHS[0];
  const bsDateStr = `${monthObj.nameEn} ${bsDay}, ${bsYear} BS`;

  return { bsDateStr, year: bsYear, month: bsMonth, day: bsDay };
}

export function formatBsDate(year: number, monthId: number, day: number): string {
  const monthObj = NEPALI_MONTHS.find((m) => m.id === monthId) || NEPALI_MONTHS[0];
  return `${monthObj.nameEn} ${day}, ${year} BS`;
}
