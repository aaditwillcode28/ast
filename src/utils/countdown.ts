/**
 * Countdown and deadline utilities for KataTira tournaments
 */

export interface CountdownTime {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  isExpired: boolean;
  totalMs: number;
}

/**
 * Parses deadline string to a timestamp (defaults to 23:59:59 NPT if only date is provided)
 */
export function getDeadlineTimestamp(deadlineStr?: string): number | null {
  if (!deadlineStr || typeof deadlineStr !== 'string') return null;

  const trimmed = deadlineStr.trim();
  if (!trimmed) return null;

  // If date only format YYYY-MM-DD, set deadline to 23:59:59 end-of-day in Nepal (UTC+5:45)
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    const d = new Date(`${trimmed}T23:59:59+05:45`);
    return isNaN(d.getTime()) ? null : d.getTime();
  }

  const d = new Date(trimmed);
  return isNaN(d.getTime()) ? null : d.getTime();
}

/**
 * Computes remaining time until a deadline from now
 */
export function calculateTimeRemaining(deadlineStr?: string, targetMs?: number): CountdownTime | null {
  const deadlineMs = targetMs ?? (deadlineStr ? getDeadlineTimestamp(deadlineStr) : null);
  if (!deadlineMs) return null;

  const now = Date.now();
  const diff = deadlineMs - now;

  if (diff <= 0) {
    return {
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 0,
      isExpired: true,
      totalMs: 0,
    };
  }

  const seconds = Math.floor((diff / 1000) % 60);
  const minutes = Math.floor((diff / 1000 / 60) % 60);
  const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  return {
    days,
    hours,
    minutes,
    seconds,
    isExpired: false,
    totalMs: diff,
  };
}

/**
 * Returns a human-friendly urgent label or formatted countdown text
 */
export function formatCountdownBadge(time: CountdownTime): { text: string; urgent: boolean; label: string } {
  if (time.isExpired) {
    return { text: 'Registration Closed', urgent: true, label: 'Closed' };
  }

  if (time.days > 2) {
    return { text: `${time.days}d ${time.hours}h left`, urgent: false, label: `${time.days} Days Left` };
  }

  if (time.days >= 1) {
    return { text: `${time.days}d ${time.hours}h left`, urgent: true, label: 'Closes Tomorrow' };
  }

  if (time.hours >= 1) {
    return { text: `${time.hours}h ${time.minutes}m left`, urgent: true, label: `${time.hours}h Left Today` };
  }

  return { text: `${time.minutes}m ${time.seconds}s left`, urgent: true, label: 'Closing Soon!' };
}

/**
 * Checks whether an event's registration has ended.
 * Returns true if registration deadline has passed or the event date has passed.
 */
export function isEventRegistrationEnded(tournament?: {
  registrationDeadline?: string;
  registration_deadline?: string;
  startDate?: string;
  start_date?: string;
  endDate?: string;
  end_date?: string;
  date?: string;
  isReliefFund?: boolean;
  is_relief?: boolean;
  isCharity?: boolean;
  category?: string;
}): boolean {
  if (!tournament) return false;

  // Relief funds stay active indefinitely unless specifically concluded
  if (tournament.isReliefFund || tournament.is_relief || tournament.category === 'Charity & Relief') {
    return false;
  }

  const now = Date.now();

  // 1. If explicit registration deadline exists
  const deadlineStr = tournament.registrationDeadline || tournament.registration_deadline;
  if (deadlineStr) {
    const deadlineTs = getDeadlineTimestamp(deadlineStr);
    if (deadlineTs && now > deadlineTs) {
      return true;
    }
  }

  // 2. If event end date, start date, or date has passed
  const eventDateStr = tournament.endDate || tournament.end_date || tournament.startDate || tournament.start_date || tournament.date;
  if (eventDateStr) {
    const eventTs = getDeadlineTimestamp(eventDateStr);
    if (eventTs && now > eventTs) {
      return true;
    }
  }

  return false;
}
