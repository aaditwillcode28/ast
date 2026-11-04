import { Tournament } from '../types';

/**
 * All simulated/demo placeholder events have been completely removed.
 * Real, authentic opportunities and tournaments in Nepal are hosted directly
 * by verified organizers, schools, colleges, and clubs through the "Host Opportunity" portal.
 */
export const INITIAL_TOURNAMENTS: Tournament[] = [
  {
    id: "kt-1761913222378",
    title: "Acu Inter College Futsal Tournament",
    category: "Football",
    posterUrl: "https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&q=80&w=1200",
    posterUrls: ["https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&q=80&w=1200"],
    startDate: "2026-11-22",
    endDate: "2026-11-22",
    calendarType: "AD",
    bsStartDate: "Mangsir 7, 2083 BS",
    bsEndDate: "Mangsir 7, 2083 BS",
    date: "2026-11-22",
    time: "09:00 AM - 05:00 PM NPT",
    registrationDeadline: "2026-11-18",
    location: "Royal Sports Central, Sanagaun",
    city: "Lalitpur",
    province: "Bagmati",
    stateCountry: "Bagmati, Nepal",
    type: "5v5",
    entryFee: 5000,
    ageGroup: "College/University",
    prizePool: "Trophy & Certificates",
    registeredTeamsCount: 0,
    hostOrg: "Australian Catholic University X professional Education Consultancy",
    hostName: "Lead Organizer",
    hostEmail: "sincedyt@gmail.com",
    hostPhone: "01-4795339",
    audienceAdmission: "Free for spectators",
    description: "Call for registration: 01-4795339 / 4795439",
    createdAt: "2026-10-31T12:20:34.884471+00:00",
    postedByAdmin: true,
    hostVerificationType: "admin"
  }
];

/**
 * Known legacy demo / placeholder event IDs to purge from visitors' local storage caches.
 */
export const DEMO_EVENT_IDS = new Set<string>([
  'test-1',
  'test-check-rules',
  'test-sync-1',
  'ev-pm-flood-relief',
  'ev-redcross-flood',
  'ev-foot-relief-cup',
  'kt-tourn-1',
  'ev-foot-pokhara-1',
  'ev-koshi-futsal-1',
  'ev-lumbini-marathon-1',
  'ev-madhesh-debate-1',
  'ev-mun-1',
  'ev-case-1',
  'ev-quiz-1',
  'kt-tourn-2',
  'kt-tourn-3',
  'kt-tourn-4',
  'kt-tourn-5',
  'ev-esports-1',
]);

/**
 * Helper to identify and purge any residual mock or synthetic test event.
 */
export const isDemoTournament = (item: Partial<Tournament>): boolean => {
  if (!item || !item.id) return false;
  if (DEMO_EVENT_IDS.has(item.id)) return true;
  
  // Catch any synthetic test phone numbers or placeholder patterns
  const phone = (item.hostPhone || '').replace(/\s+/g, '');
  if (
    phone.includes('9841234567') ||
    phone.includes('9812345678') ||
    phone.includes('9843221100') ||
    phone.includes('9851022334') ||
    phone.includes('9802887766') ||
    phone.includes('9857011223') ||
    phone.includes('9804022334') ||
    phone.includes('9849112233') ||
    phone.includes('9801998877') ||
    phone.includes('9811889900') ||
    phone.includes('1234567')
  ) {
    return true;
  }
  return false;
};

export const PROVINCES_OF_NEPAL = [
  'All Provinces',
  'Bagmati',
  'Gandaki',
  'Koshi',
  'Lumbini',
  'Madhesh',
  'Karnali',
  'Sudurpashchim'
] as const;

export const DEFAULT_POSTER_FALLBACK = 'https://images.unsplash.com/photo-1546519638-68e109498ffc?auto=format&fit=crop&w=1200&q=80';

export const CATEGORY_FALLBACK_IMAGES: Record<string, string> = {
  'Basketball': 'https://images.unsplash.com/photo-1546519638-68e109498ffc?auto=format&fit=crop&w=1200&q=80',
  'Football': 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=1200&q=80',
  'Charity & Relief': 'https://images.unsplash.com/photo-1547683905-f686c993aae5?auto=format&fit=crop&w=1200&q=80',
  'MUN & Debate': 'https://images.unsplash.com/photo-1541872703-74c5e44368f9?auto=format&fit=crop&w=1200&q=80',
  'Case Competition': 'https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&w=1200&q=80',
  'Quiz': 'https://images.unsplash.com/photo-1606326608606-aa0b62935f2b?auto=format&fit=crop&w=1200&q=80',
  'Esports': 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=1200&q=80',
  'Cultural': 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=1200&q=80',
};

export const getCategoryFallbackImage = (category?: string): string => {
  if (category && CATEGORY_FALLBACK_IMAGES[category]) {
    return CATEGORY_FALLBACK_IMAGES[category];
  }
  return DEFAULT_POSTER_FALLBACK;
};
