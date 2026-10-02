import { ActivityLog, EventReport, OrganizerProfile, ActivityActionType } from '../types';

const STORAGE_KEYS = {
  ACTIVITY_LOGS: 'katatira_activity_logs',
  EVENT_REPORTS: 'katatira_event_reports',
  ORGANIZERS: 'katatira_organizers_directory',
  PAGE_STATS: 'katatira_platform_page_stats',
  ADMIN_PIN: 'katatira_admin_pin',
  ADMIN_AUTH: 'katatira_admin_auth',
};

// Seed initial activity logs if none exist
const INITIAL_ACTIVITIES: ActivityLog[] = [
  {
    id: 'act-101',
    timestamp: new Date(Date.now() - 1000 * 60 * 12).toISOString(), // 12 mins ago
    type: 'registration',
    actor: 'Aayush Shrestha (Everest Strikers)',
    actorContact: '+977 9841223344',
    action: 'Registered team for tournament',
    targetTitle: 'Kathmandu Valley Inter-College Futsal 2026',
    targetId: 'kt-tourn-1',
    details: 'Team entry confirmed via host QR payment (Txn ID: ES-882910)',
    location: 'Kathmandu, Bagmati',
    severity: 'success',
  },
  {
    id: 'act-102',
    timestamp: new Date(Date.now() - 1000 * 60 * 35).toISOString(), // 35 mins ago
    type: 'event_host',
    actor: 'Pokhara Tech & Gaming Hub',
    actorContact: '+977 9802887766',
    action: 'Hosted new esports championship',
    targetTitle: 'Nepal National Valorant & PUBG Mobile Open 2026',
    targetId: 'kt-tourn-3',
    details: 'Prize pool Rs. 1,00,000 | 32 slots posted',
    location: 'Pokhara, Gandaki',
    severity: 'info',
  },
  {
    id: 'act-103',
    timestamp: new Date(Date.now() - 1000 * 60 * 68).toISOString(), // ~1 hr ago
    type: 'pass_download',
    actor: 'Pooja Gurung (Team Pokhara Sparks)',
    action: 'Downloaded gate entry tournament pass',
    targetTitle: 'Boudha 3x3 Streetball Open Championship',
    targetId: 'kt-tourn-2',
    details: 'Pass Code: KT-PASS-9902 | QR ticket validated',
    location: 'Lalitpur, Bagmati',
    severity: 'info',
  },
  {
    id: 'act-104',
    timestamp: new Date(Date.now() - 1000 * 60 * 110).toISOString(), // ~1.8 hrs ago
    type: 'report_submit',
    actor: 'Registered Player (Kritipur)',
    action: 'Reported event for incorrect prize description',
    targetTitle: 'Lalitpur Corporate Cricket Cup 2026',
    targetId: 'kt-tourn-5',
    details: 'Reported: Host updated cash prize on social poster differently than website listing.',
    location: 'Kritipur, Kathmandu',
    severity: 'warning',
  },
  {
    id: 'act-105',
    timestamp: new Date(Date.now() - 1000 * 60 * 180).toISOString(), // 3 hrs ago
    type: 'interest_update',
    actor: 'Visitor #KT-4412',
    action: 'Updated event interest notifications',
    details: 'Subscribed to alerts for: Football, Esports & Gaming, Quiz',
    location: 'Biratnagar, Koshi',
    severity: 'info',
  },
  {
    id: 'act-106',
    timestamp: new Date(Date.now() - 1000 * 60 * 240).toISOString(), // 4 hrs ago
    type: 'search',
    actor: 'Visitor #KT-7108',
    action: 'Searched platform',
    details: 'Search query: "Badminton Open Kathmandu"',
    location: 'Bhaktapur, Bagmati',
    severity: 'info',
  },
  {
    id: 'act-107',
    timestamp: new Date(Date.now() - 1000 * 60 * 310).toISOString(), // 5 hrs ago
    type: 'organizer_verify',
    actor: 'KataTira Admin Desk',
    action: 'Verified Organizer Credentials',
    targetTitle: 'Nepal Youth Futsal Association',
    details: 'PAN document & ground booking agreement verified.',
    location: 'Central Admin',
    severity: 'success',
  },
];

// Seed initial reports
const INITIAL_REPORTS: EventReport[] = [
  {
    id: 'rep-001',
    tournamentId: 'kt-tourn-5',
    tournamentTitle: 'Lalitpur Corporate Cricket Cup 2026',
    hostName: 'Valley Sports Network',
    hostPhone: '+977 9851098765',
    category: 'Cricket',
    reason: 'Misleading prize pool details',
    details: 'The flyer distributed by the organizer mentions Rs. 40,000 cash prize while the listing states Rs. 60,000. Please verify with organizer.',
    reporterContact: '+977 9841998877',
    timestamp: new Date(Date.now() - 1000 * 60 * 110).toISOString(),
    status: 'pending',
    adminNote: '',
  },
  {
    id: 'rep-002',
    tournamentId: 'kt-tourn-4',
    tournamentTitle: 'Kathmandu Model United Nations (KMUN 2026)',
    hostName: 'Nepal Youth Diplomacy Forum',
    hostPhone: '+977 9841234567',
    category: 'MUN & Debate',
    reason: 'Duplicate or expired date',
    details: 'Early bird deadline was marked expired, host updated venue to Russian Cultural Centre.',
    reporterContact: 'delegate.np@gmail.com',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 26).toISOString(),
    status: 'resolved',
    adminNote: 'Verified with host representative. Date and venue confirmed updated.',
  },
];

// Seed initial organizers
const INITIAL_ORGANIZERS: OrganizerProfile[] = [
  {
    id: 'org-1',
    name: 'Kathmandu Futsal Hub',
    phone: '+977 9851022334',
    email: 'info@ktmfutsalhub.com',
    location: 'Dhapasi, Kathmandu',
    isVerified: true,
    verificationDate: '2026-02-15',
    verificationMethod: 'PAN Registration & Ground Lease Agreement verified',
    tournamentsCount: 4,
    documentsSubmitted: ['PAN Certificate', 'Venue Agreement', 'eSewa Merchant KYC'],
    notes: 'Established futsal arena with over 8 successful tournaments.',
  },
  {
    id: 'org-2',
    name: 'Nepal Youth Diplomacy Forum',
    phone: '+977 9841234567',
    email: 'contact@nepalmun.org',
    location: 'Kathmandu',
    isVerified: true,
    verificationDate: '2026-01-20',
    verificationMethod: 'Official NGO Registration & UN Youth Partnership letter',
    tournamentsCount: 2,
    documentsSubmitted: ['NGO Registration', 'Auditorium Booking Bill'],
    notes: 'Official organizer of Nepal Model United Nations conferences.',
  },
  {
    id: 'org-3',
    name: 'Pokhara Tech & Gaming Hub',
    phone: '+977 9802887766',
    email: 'esports@pokharagaming.com',
    location: 'Lakeside, Pokhara',
    isVerified: true,
    verificationDate: '2026-02-28',
    verificationMethod: 'Business Registration & Official Discord verification',
    tournamentsCount: 3,
    documentsSubmitted: ['Company Registration', 'Discord Partner Badge'],
    notes: 'Premier gaming lounge and tournament operator in Gandaki province.',
  },
  {
    id: 'org-4',
    name: 'Valley Sports Network',
    phone: '+977 9851098765',
    email: 'valleysportsnepal@gmail.com',
    location: 'Patan, Lalitpur',
    isVerified: false,
    tournamentsCount: 1,
    documentsSubmitted: ['Host Contact Form'],
    notes: 'Pending phone interview and venue booking confirmation receipt.',
  },
  {
    id: 'org-5',
    name: 'Nepal Red Cross Society Relief Committee',
    phone: '+977 01-4270650',
    email: 'relief@nrcs.org',
    location: 'Red Cross Marg, Tahachal, Kathmandu',
    isVerified: true,
    verificationDate: '2026-01-10',
    verificationMethod: 'Statutory Humanitarian Organization Charter',
    tournamentsCount: 1,
    documentsSubmitted: ['Charter & Central Committee Authorization'],
    notes: 'Official National Red Cross Society disaster relief operator.',
  },
];

// Helper to notify listeners across the app
const dispatchUpdate = (eventName: string, detail?: unknown) => {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(eventName, { detail }));
  }
};

// 1. ACTIVITY LOGS
export const getActivityLogs = (): ActivityLog[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.ACTIVITY_LOGS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.ACTIVITY_LOGS, JSON.stringify(INITIAL_ACTIVITIES));
      return INITIAL_ACTIVITIES;
    }
    return JSON.parse(raw);
  } catch {
    return INITIAL_ACTIVITIES;
  }
};

export const logActivity = (
  entry: Omit<ActivityLog, 'id' | 'timestamp'>
): ActivityLog => {
  const newLog: ActivityLog = {
    ...entry,
    id: `act-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    timestamp: new Date().toISOString(),
  };

  try {
    const existing = getActivityLogs();
    const updated = [newLog, ...existing].slice(0, 150); // Keep last 150 events
    localStorage.setItem(STORAGE_KEYS.ACTIVITY_LOGS, JSON.stringify(updated));
    dispatchUpdate('katatira_activity_updated', newLog);
  } catch (err) {
    console.error('Error recording activity:', err);
  }

  return newLog;
};

// 2. EVENT REPORTS (Where reports go to)
export const getEventReports = (): EventReport[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.EVENT_REPORTS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.EVENT_REPORTS, JSON.stringify(INITIAL_REPORTS));
      return INITIAL_REPORTS;
    }
    return JSON.parse(raw);
  } catch {
    return INITIAL_REPORTS;
  }
};

export const submitEventReport = (
  report: Omit<EventReport, 'id' | 'timestamp' | 'status'>
): EventReport => {
  const newReport: EventReport = {
    ...report,
    id: `rep-${Date.now()}`,
    timestamp: new Date().toISOString(),
    status: 'pending',
  };

  try {
    const existing = getEventReports();
    const updated = [newReport, ...existing];
    localStorage.setItem(STORAGE_KEYS.EVENT_REPORTS, JSON.stringify(updated));

    // Also record in activity log!
    logActivity({
      type: 'report_submit',
      actor: report.reporterContact || 'KataTira Visitor',
      action: `Submitted report on ${report.tournamentTitle}`,
      targetTitle: report.tournamentTitle,
      targetId: report.tournamentId,
      details: `Reason: ${report.reason}${report.details ? ` - "${report.details}"` : ''}`,
      location: 'Nepal',
      severity: 'warning',
    });

    dispatchUpdate('katatira_reports_updated', newReport);
  } catch (err) {
    console.error('Error saving report:', err);
  }

  return newReport;
};

export const updateEventReportStatus = (
  reportId: string,
  status: EventReport['status'],
  adminNote?: string
) => {
  try {
    const reports = getEventReports();
    const updated = reports.map((r) =>
      r.id === reportId ? { ...r, status, adminNote: adminNote ?? r.adminNote } : r
    );
    localStorage.setItem(STORAGE_KEYS.EVENT_REPORTS, JSON.stringify(updated));

    logActivity({
      type: 'organizer_verify',
      actor: 'KataTira Admin Desk',
      action: `Updated report status to ${status.toUpperCase()}`,
      details: `Report ID: ${reportId}${adminNote ? ` | Note: ${adminNote}` : ''}`,
      severity: status === 'resolved' ? 'success' : 'info',
    });

    dispatchUpdate('katatira_reports_updated');
  } catch (err) {
    console.error('Error updating report status:', err);
  }
};

// 3. ORGANIZERS DIRECTORY (How to check verified organizers)
export const getOrganizers = (): OrganizerProfile[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.ORGANIZERS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.ORGANIZERS, JSON.stringify(INITIAL_ORGANIZERS));
      return INITIAL_ORGANIZERS;
    }
    return JSON.parse(raw);
  } catch {
    return INITIAL_ORGANIZERS;
  }
};

export const toggleOrganizerVerification = (
  organizerIdOrName: string,
  verifiedStatus?: boolean,
  method = 'Direct Phone Call, Ground Booking Proof & PAN KYC'
): OrganizerProfile | null => {
  try {
    const organizers = getOrganizers();
    let target = organizers.find((o) => o.id === organizerIdOrName || o.name.toLowerCase() === organizerIdOrName.toLowerCase());

    // If organizer isn't in directory yet, create profile
    if (!target) {
      target = {
        id: `org-${Date.now()}`,
        name: organizerIdOrName,
        phone: '+977 9800000000',
        email: 'organizer@katatira.np',
        location: 'Kathmandu, Nepal',
        isVerified: false,
        tournamentsCount: 1,
      };
      organizers.push(target);
    }

    const nextStatus = verifiedStatus !== undefined ? verifiedStatus : !target.isVerified;
    target.isVerified = nextStatus;
    if (nextStatus) {
      target.verificationDate = new Date().toISOString().split('T')[0];
      target.verificationMethod = method;
    }

    localStorage.setItem(STORAGE_KEYS.ORGANIZERS, JSON.stringify(organizers));

    // Log this action
    logActivity({
      type: 'organizer_verify',
      actor: 'Platform Administrator',
      action: nextStatus ? `Verified Organiser "${target.name}"` : `Revoked verification for "${target.name}"`,
      targetTitle: target.name,
      details: nextStatus ? `Verified via: ${method}` : 'Status updated to unverified',
      severity: nextStatus ? 'success' : 'warning',
    });

    dispatchUpdate('katatira_organizers_updated', target);
    return target;
  } catch (err) {
    console.error('Error toggling organizer verification:', err);
    return null;
  }
};

// 4. PLATFORM PAGE STATS (Impressions & Visitors)
export const trackPageImpression = (): { impressions: number; uniqueVisitors: number } => {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.PAGE_STATS);
    const stats = raw ? JSON.parse(raw) : { impressions: 1420, uniqueVisitors: 890, lastSession: Date.now() };

    stats.impressions += 1;
    // Check if new session
    const isNewVisitor = !sessionStorage.getItem('katatira_session_started');
    if (isNewVisitor) {
      sessionStorage.setItem('katatira_session_started', 'true');
      stats.uniqueVisitors += 1;
    }

    localStorage.setItem(STORAGE_KEYS.PAGE_STATS, JSON.stringify(stats));
    return { impressions: stats.impressions, uniqueVisitors: stats.uniqueVisitors };
  } catch {
    return { impressions: 1421, uniqueVisitors: 891 };
  }
};

export const getPageStats = (): { impressions: number; uniqueVisitors: number } => {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.PAGE_STATS);
    if (!raw) return { impressions: 1420, uniqueVisitors: 890 };
    const parsed = JSON.parse(raw);
    return { impressions: parsed.impressions, uniqueVisitors: parsed.uniqueVisitors };
  } catch {
    return { impressions: 1420, uniqueVisitors: 890 };
  }
};

// 5. ADMIN AUTHENTICATION & SECURITY
export const DEFAULT_ADMIN_PIN = 'F7_H$v.jpx89ZV@';

export const getAdminPin = (): string => {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.ADMIN_PIN);
    // Migrate from simple legacy pin '2026' or previous temporary passcodes to new passcode
    if (!stored || stored === '2026' || stored === 'KT@Nepal-8848#Master!2026') {
      localStorage.setItem(STORAGE_KEYS.ADMIN_PIN, DEFAULT_ADMIN_PIN);
      return DEFAULT_ADMIN_PIN;
    }
    return stored;
  } catch {
    return DEFAULT_ADMIN_PIN;
  }
};

export const setAdminPin = (newPin: string): boolean => {
  try {
    if (!newPin || newPin.trim().length < 4) return false;
    localStorage.setItem(STORAGE_KEYS.ADMIN_PIN, newPin.trim());
    return true;
  } catch {
    return false;
  }
};

export const verifyAdminPin = (enteredPin: string): boolean => {
  const currentPin = getAdminPin();
  const isValid = enteredPin.trim() === currentPin;
  if (isValid) {
    setAdminAuthenticated(true);
  }
  return isValid;
};

export const isAdminAuthenticated = (): boolean => {
  try {
    return sessionStorage.getItem(STORAGE_KEYS.ADMIN_AUTH) === 'true';
  } catch {
    return false;
  }
};

export const setAdminAuthenticated = (auth: boolean): void => {
  try {
    if (auth) {
      sessionStorage.setItem(STORAGE_KEYS.ADMIN_AUTH, 'true');
    } else {
      sessionStorage.removeItem(STORAGE_KEYS.ADMIN_AUTH);
    }
    window.dispatchEvent(new CustomEvent('katatira_admin_auth_changed', { detail: { authenticated: auth } }));
  } catch {}
};

export const clearAdminSession = (): void => {
  setAdminAuthenticated(false);
};

export const clearAllActivityLogs = (): void => {
  try {
    localStorage.setItem(STORAGE_KEYS.ACTIVITY_LOGS, JSON.stringify([]));
    window.dispatchEvent(new CustomEvent('katatira_activity_updated'));
  } catch {}
};
