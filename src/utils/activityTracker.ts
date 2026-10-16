import { ActivityLog, EventReport, OrganizerProfile, ActivityActionType } from '../types';

const STORAGE_KEYS = {
  ACTIVITY_LOGS: 'katatira_activity_logs',
  EVENT_REPORTS: 'katatira_event_reports',
  ORGANIZERS: 'katatira_organizers_directory',
  PAGE_STATS: 'katatira_platform_page_stats',
  ADMIN_PIN: 'katatira_admin_pin',
  ADMIN_AUTH: 'katatira_admin_auth',
};

// Real activity logs, reports, and organizers are recorded dynamically as organizers and visitors interact with KataTira
const INITIAL_ACTIVITIES: ActivityLog[] = [];
const INITIAL_REPORTS: EventReport[] = [];
const INITIAL_ORGANIZERS: OrganizerProfile[] = [];

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
        phone: '',
        email: '',
        location: 'Nepal',
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
