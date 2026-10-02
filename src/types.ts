export type EventCategory = 
  | 'All'
  | 'Football'
  | 'Basketball'
  | 'MUN & Debate'
  | 'Case Competition'
  | 'Quiz'
  | 'Esports'
  | 'Cultural'
  | 'Charity & Relief'
  | string;

export type TournamentType = string;

export type AgeCategory = 'Open' | 'College/University' | 'High School' | 'U-19' | 'U-16' | 'U-14' | string;

export interface SocialLinks {
  instagram?: string;
  facebook?: string;
  whatsapp?: string;
  website?: string;
}

export interface Tournament {
  id: string;
  title: string;
  category: EventCategory;
  posterUrl: string;
  posterStyle?: string;
  startDate: string;
  endDate: string;
  calendarType?: 'AD' | 'BS';
  bsStartDate?: string;
  bsEndDate?: string;
  date?: string;
  time: string;
  location: string;
  city: string;
  stateCountry: string;
  type: string;
  teamSize?: string;
  entryFee: number;
  ageGroup: string;
  prizePool: string;
  totalTeams: number;
  totalSlots?: number;
  hasNoSlots?: boolean;
  isReliefFund?: boolean;
  registeredTeamsCount: number;
  interestedCount?: number;
  hostName: string;
  hostEmail: string;
  hostPhone: string;
  hostOrg?: string;
  description?: string;
  audienceAdmission?: string;
  isFeatured?: boolean;
  
  // Real Links & Charity / Relief Information
  officialLink?: string;
  isCharity?: boolean;
  donationLink?: string;
  causeTitle?: string;
  reliefBankDetails?: string;
  
  // Host Payment Source & QR code
  hostPaymentQrUrl?: string;
  hostPaymentMethod?: string;
  hostPaymentNumber?: string;
  hostPaymentInstructions?: string;

  // Social media & links
  socialLinks?: SocialLinks;
  whatsappGroupLink?: string; // Official WhatsApp group invite link from host
  isHostVerified?: boolean; // Verified with OTP sent to host email
  hostVerificationType?: 'government' | 'relief_desk' | 'verified_association' | 'verified_organizer';
  transparencyNote?: string; // Clear breakdown of direct fund flows & banking channels
  province?: 'Koshi' | 'Madhesh' | 'Bagmati' | 'Gandaki' | 'Lumbini' | 'Karnali' | 'Sudurpashchim' | string;
  registrationDeadline?: string; // ISO date string (YYYY-MM-DD or YYYY-MM-DDTHH:mm:ss)
  
  createdAt: string;
}

export interface Registration {
  id: string;
  tournamentId: string;
  tournamentTitle: string;
  tournamentPoster: string;
  tournamentStartDate: string;
  tournamentEndDate: string;
  tournamentTime: string;
  tournamentLocation: string;
  tournamentCity: string;
  tournamentType: string;
  teamName: string;
  contactEmail: string;
  contactPhone: string;
  entryFee: number;
  totalAmount: number; // strictly entryFee with no extra fees
  paymentMethod: 'host_qr' | 'esewa' | 'khalti' | 'fonepay' | 'card' | 'free';
  transactionId?: string;
  paymentScreenshotUrl?: string;
  paymentStatus: 'confirmed' | 'pending';
  registeredAt: string;
  confirmationCode: string;
  ticketQrCode: string;
  whatsappGroupLink?: string;
  hostName?: string;
  whatsappSentToHost?: boolean;
}

export interface FilterState {
  searchQuery: string;
  category: string;
  type: string; // city
  province?: string; // Province selector
  nearMe?: boolean; // Near me toggle
  ageGroup: string;
  maxFee: number;
  onlyFree: boolean;
  onlyInterested: boolean;
  onlyCharity?: boolean;
  selectedDateFilter: 'all' | 'this_weekend' | 'next_7_days' | 'this_month' | 'custom';
  customDate?: string;
}

export interface UserInterestProfile {
  name: string;
  email: string;
  selectedCategories: string[];
}

export type ActivityActionType =
  | 'registration'
  | 'event_host'
  | 'report_submit'
  | 'interest_update'
  | 'event_view'
  | 'search'
  | 'pass_download'
  | 'organizer_verify'
  | 'tournament_delete'
  | 'batch_purge';

export interface ActivityLog {
  id: string;
  timestamp: string;
  type: ActivityActionType;
  actor: string; // e.g. "Rohan Thapa (Team Everest Strikers)" or "Visitor (Kathmandu)" or "Host: Sports Club Pokhara"
  actorContact?: string;
  action: string;
  targetTitle?: string;
  targetId?: string;
  details?: string;
  location?: string;
  severity?: 'info' | 'success' | 'warning' | 'alert';
}

export interface EventReport {
  id: string;
  tournamentId: string;
  tournamentTitle: string;
  hostName?: string;
  hostPhone?: string;
  category: string;
  reason: string;
  details?: string;
  reporterContact?: string;
  timestamp: string;
  status: 'pending' | 'investigating' | 'resolved' | 'dismissed';
  adminNote?: string;
}

export interface OrganizerProfile {
  id: string;
  name: string;
  phone: string;
  email: string;
  location: string;
  isVerified: boolean;
  verificationDate?: string;
  verificationMethod?: string;
  tournamentsCount: number;
  documentsSubmitted?: string[];
  notes?: string;
}
