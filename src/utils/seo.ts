/**
 * SEO & Dynamic Meta Management for KataTira Opportunities & Tournaments
 * Maps category routes and queries to targeted Google Search titles, descriptions, and keywords.
 */

export interface CategorySeoConfig {
  slug: string;
  categoryKey: string;
  pageTitle: string;
  metaDescription: string;
  canonicalPath: string;
  heading: string;
  subtitle: string;
  keywords: string[];
}

export const CATEGORY_SEO_MAP: Record<string, CategorySeoConfig> = {
  all: {
    slug: 'all',
    categoryKey: 'all',
    pageTitle: 'KataTira | Tournaments, Competitions & Relief Hub of Nepal',
    metaDescription: 'Discover, register, and host sports tournaments, debate MUNs, case competitions, and verified disaster relief initiatives across Nepal.',
    canonicalPath: '/',
    heading: 'All Competitions & Opportunities',
    subtitle: 'Browse all active tournaments, open challenges, and community drives across Nepal',
    keywords: ['tournaments nepal', 'competitions kathmandu', 'sports nepal', 'katatira', 'events nepal 2026'],
  },
  football: {
    slug: 'football',
    categoryKey: 'Football',
    pageTitle: 'Football & Futsal Tournaments in Nepal | KataTira',
    metaDescription: 'Find and register for top open futsal cups, 7v7 knockout matches, inter-college football tournaments, and prize pool championships across Nepal.',
    canonicalPath: '/?category=football',
    heading: 'Football & Futsal Tournaments in Nepal',
    subtitle: '7v7 knockout, 5v5 futsal cups, and district college football tournaments with active registrations',
    keywords: ['futsal tournament kathmandu', 'football competition nepal', 'futsal cup nepal', 'football championship nepal'],
  },
  basketball: {
    slug: 'basketball',
    categoryKey: 'Basketball',
    pageTitle: 'Basketball Tournaments & 3x3 Streetball Nepal | KataTira',
    metaDescription: 'Discover 3x3 streetball opens, college basketball leagues, and inter-city hoops championships in Kathmandu, Lalitpur, and Pokhara.',
    canonicalPath: '/?category=basketball',
    heading: 'Basketball & 3x3 Tournaments in Nepal',
    subtitle: 'FIBA 3x3 streetball, full-court college leagues, and open hoops tournaments',
    keywords: ['basketball tournament nepal', '3x3 streetball kathmandu', 'hoops nepal', 'basketball lalitpur'],
  },
  mun: {
    slug: 'mun',
    categoryKey: 'MUN & Debate',
    pageTitle: 'MUNs & Debate Competitions in Nepal | KataTira',
    metaDescription: 'Join Model United Nations, parliamentary debate championships, youth parliaments, and public speaking forums across Nepal.',
    canonicalPath: '/?category=mun',
    heading: 'Model United Nations & Debate Forums',
    subtitle: 'Diplomatic councils, national parliamentary debates, and youth forums with delegate registrations',
    keywords: ['mun nepal', 'model united nations kathmandu', 'debate competition nepal', 'youth parliament nepal'],
  },
  'case-competition': {
    slug: 'case-competition',
    categoryKey: 'Case Competition',
    pageTitle: 'Case Competitions & Business Hackathons Nepal | KataTira',
    metaDescription: 'Explore business case competitions, startup pitching challenges, consulting hackathons, and innovation grants for Nepali students and professionals.',
    canonicalPath: '/?category=case-competition',
    heading: 'Business Case & Innovation Challenges',
    subtitle: 'Consulting case challenges, business pitch cups, and university innovation leagues in Nepal',
    keywords: ['case competition nepal', 'business pitch kathmandu', 'startup hackathon nepal', 'consulting challenge nepal'],
  },
  quiz: {
    slug: 'quiz',
    categoryKey: 'Quiz',
    pageTitle: 'Quiz Competitions & Trivia Championships Nepal | KataTira',
    metaDescription: 'Test your knowledge in general knowledge trivia, inter-school science quizzes, and corporate quiz bowls across Nepal.',
    canonicalPath: '/?category=quiz',
    heading: 'Quiz Bowls & Trivia Championships',
    subtitle: 'Inter-college GK quizzes, corporate trivia cups, and national science challenges',
    keywords: ['quiz competition nepal', 'gk quiz kathmandu', 'inter-school quiz nepal', 'trivia nepal'],
  },
  esports: {
    slug: 'esports',
    categoryKey: 'Esports',
    pageTitle: 'Esports & Gaming Tournaments Nepal | KataTira',
    metaDescription: 'Register your squad for Nepal national Valorant, PUBG Mobile, MLBB, EA FC, and Dota 2 esports championships and scrim leagues.',
    canonicalPath: '/?category=esports',
    heading: 'Nepal Esports Championships & Gaming Cups',
    subtitle: 'Valorant, PUBG Mobile, MLBB, and PC gaming tournaments with verified cash prize pools',
    keywords: ['esports nepal', 'pubg tournament nepal', 'valorant cup kathmandu', 'gaming tournaments nepal'],
  },
  cultural: {
    slug: 'cultural',
    categoryKey: 'Cultural',
    pageTitle: 'Arts, Cultural & Dance Competitions Nepal | KataTira',
    metaDescription: 'Participate in traditional dance showcases, live acoustic battle of the bands, photography contests, and fine arts exhibits in Nepal.',
    canonicalPath: '/?category=cultural',
    heading: 'Arts, Music & Cultural Exhibitions',
    subtitle: 'Dance competitions, battle of the bands, photography challenges, and heritage exhibitions',
    keywords: ['cultural competition nepal', 'battle of the bands kathmandu', 'art competition nepal', 'dance contest nepal'],
  },
  relief: {
    slug: 'relief',
    categoryKey: 'Charity & Relief',
    pageTitle: 'Disaster Relief & Verified Humanitarian Drives Nepal | KataTira',
    metaDescription: 'Verified flood, landslide, and emergency humanitarian relief campaigns with 100% direct contributions to official aid and rescue operators.',
    canonicalPath: '/?category=relief',
    heading: 'Verified Emergency Relief & Humanitarian Drives',
    subtitle: 'Prime Minister Relief Fund, Nepal Red Cross, and verified citizen relief drives with zero fee transfer',
    keywords: ['flood relief nepal', 'disaster relief fund kathmandu', 'nepal red cross relief', 'humanitarian aid nepal'],
  },
};

/**
 * Normalizes any category string or URL parameter to a canonical SEO config.
 */
export function getSeoConfigForCategory(category?: string): CategorySeoConfig {
  if (!category || category === 'all') {
    return CATEGORY_SEO_MAP.all;
  }

  const normalized = category.toLowerCase().trim();
  
  if (normalized.includes('foot') || normalized.includes('futsal')) {
    return CATEGORY_SEO_MAP.football;
  }
  if (normalized.includes('basket')) {
    return CATEGORY_SEO_MAP.basketball;
  }
  if (normalized.includes('mun') || normalized.includes('debate')) {
    return CATEGORY_SEO_MAP.mun;
  }
  if (normalized.includes('case')) {
    return CATEGORY_SEO_MAP['case-competition'];
  }
  if (normalized.includes('quiz')) {
    return CATEGORY_SEO_MAP.quiz;
  }
  if (normalized.includes('esport') || normalized.includes('game') || normalized.includes('gaming')) {
    return CATEGORY_SEO_MAP.esports;
  }
  if (normalized.includes('cultur') || normalized.includes('art')) {
    return CATEGORY_SEO_MAP.cultural;
  }
  if (normalized.includes('relief') || normalized.includes('charity') || normalized.includes('flood')) {
    return CATEGORY_SEO_MAP.relief;
  }

  return CATEGORY_SEO_MAP.all;
}

/**
 * Updates document <title>, meta description, OpenGraph tags, and canonical URL in real-time.
 */
export function applyCategorySeo(category?: string) {
  if (typeof document === 'undefined') return;

  const config = getSeoConfigForCategory(category);

  // 1. Title
  document.title = config.pageTitle;

  // 2. Meta description
  let descMeta = document.querySelector('meta[name="description"]');
  if (!descMeta) {
    descMeta = document.createElement('meta');
    descMeta.setAttribute('name', 'description');
    document.head.appendChild(descMeta);
  }
  descMeta.setAttribute('content', config.metaDescription);

  // 3. OpenGraph Tags
  const ogTitle = document.querySelector('meta[property="og:title"]');
  if (ogTitle) ogTitle.setAttribute('content', config.pageTitle);

  const ogDesc = document.querySelector('meta[property="og:description"]');
  if (ogDesc) ogDesc.setAttribute('content', config.metaDescription);

  const twTitle = document.querySelector('meta[name="twitter:title"]');
  if (twTitle) twTitle.setAttribute('content', config.pageTitle);

  const twDesc = document.querySelector('meta[name="twitter:description"]');
  if (twDesc) twDesc.setAttribute('content', config.metaDescription);

  // 4. Send virtual pageview to Google Analytics if gtag exists
  if (typeof (window as any).gtag === 'function') {
    (window as any).gtag('event', 'page_view', {
      page_title: config.pageTitle,
      page_location: window.location.href,
      page_path: config.canonicalPath,
    });
  }
}

/**
 * Creates clean SEO URL slugs for any event (e.g., "boudha-3x3-streetball-open-championship")
 */
export function slugifyEventTitle(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .slice(0, 60);
}

/**
 * Builds the canonical distinct webpage URL for any event in Nepal.
 * Format: /?event=ID (or /?event=ID&slug=slugified-title for maximum Google indexing)
 */
export function getEventPageUrl(id: string, title?: string): string {
  if (typeof window === 'undefined') return `/?event=${id}`;
  const origin = window.location.origin;
  const slugPart = title ? `&slug=${slugifyEventTitle(title)}` : '';
  return `${origin}/?event=${encodeURIComponent(id)}${slugPart}`;
}

/**
 * Updates document meta tags specifically for an individual event webpage.
 * Ensures Google, WhatsApp, Facebook, Twitter, and LinkedIn show the tournament poster and details.
 */
export function applyEventSeo(event: {
  id: string;
  title: string;
  category: string;
  city: string;
  location: string;
  entryFee: number;
  startDate?: string;
  description?: string;
  posterUrl?: string;
  hostName?: string;
}) {
  if (typeof document === 'undefined') return;

  const eventTitle = `${event.title} - ${event.city}, Nepal | KataTira`;
  const eventDesc = event.description
    ? `${event.description.slice(0, 150)}... Category: ${event.category}. Venue: ${event.location}, ${event.city}. Entry: ${event.entryFee === 0 ? 'FREE' : `Rs. ${event.entryFee}`}.`
    : `Register for ${event.title} in ${event.city}, Nepal. Category: ${event.category}. Admission/Fee: ${event.entryFee === 0 ? 'FREE' : `Rs. ${event.entryFee}`}. Hosted on KataTira Nepal.`;

  // 1. Page title
  document.title = eventTitle;

  // 2. Meta description
  let descMeta = document.querySelector('meta[name="description"]');
  if (!descMeta) {
    descMeta = document.createElement('meta');
    descMeta.setAttribute('name', 'description');
    document.head.appendChild(descMeta);
  }
  descMeta.setAttribute('content', eventDesc);

  // 3. OpenGraph tags
  const ogTitle = document.querySelector('meta[property="og:title"]');
  if (ogTitle) ogTitle.setAttribute('content', eventTitle);

  const ogDesc = document.querySelector('meta[property="og:description"]');
  if (ogDesc) ogDesc.setAttribute('content', eventDesc);

  const ogImage = document.querySelector('meta[property="og:image"]');
  if (ogImage && event.posterUrl) {
    ogImage.setAttribute('content', event.posterUrl);
  }

  const twTitle = document.querySelector('meta[name="twitter:title"]');
  if (twTitle) twTitle.setAttribute('content', eventTitle);

  const twDesc = document.querySelector('meta[name="twitter:description"]');
  if (twDesc) twDesc.setAttribute('content', eventDesc);

  // 4. Inject Google Schema.org JSON-LD Event structured data
  try {
    let scriptTag = document.getElementById('event-jsonld-schema') as HTMLScriptElement | null;
    if (!scriptTag) {
      scriptTag = document.createElement('script');
      scriptTag.id = 'event-jsonld-schema';
      scriptTag.type = 'application/ld+json';
      document.head.appendChild(scriptTag);
    }

    const eventJsonLd = {
      '@context': 'https://schema.org',
      '@type': 'Event',
      name: event.title,
      description: eventDesc,
      startDate: event.startDate || new Date().toISOString(),
      eventStatus: 'https://schema.org/EventScheduled',
      eventAttendanceMode: event.city.toLowerCase().includes('online')
        ? 'https://schema.org/OnlineEventAttendanceMode'
        : 'https://schema.org/OfflineEventAttendanceMode',
      location: {
        '@type': 'Place',
        name: event.location,
        address: {
          '@type': 'PostalAddress',
          addressLocality: event.city,
          addressCountry: 'NP',
        },
      },
      image: event.posterUrl ? [event.posterUrl] : undefined,
      offers: {
        '@type': 'Offer',
        price: event.entryFee,
        priceCurrency: 'NPR',
        availability: 'https://schema.org/InStock',
        url: typeof window !== 'undefined' ? window.location.href : '',
      },
      organizer: {
        '@type': 'Organization',
        name: event.hostName || 'Event Host',
      },
    };

    scriptTag.text = JSON.stringify(eventJsonLd);
  } catch (err) {
    console.warn('Failed to inject JSON-LD structured data', err);
  }

  // 5. Send virtual pageview to Google Analytics
  if (typeof (window as any).gtag === 'function') {
    (window as any).gtag('event', 'page_view', {
      page_title: eventTitle,
      page_location: window.location.href,
      page_path: `/?event=${event.id}`,
    });
  }
}

