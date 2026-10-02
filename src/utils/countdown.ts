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
  if (!deadlineStr) return null;

  // If date only format YYYY-MM-DD, set deadline to 23:59:59 end-of-day
  if (/^\d{4}-\d{2}-\d{2}$/.test(deadlineStr)) {
    const d = new Date(`${deadlineStr}T23:59:59+05:45`);
    return isNaN(d.getTime()) ? null : d.getTime();
  }

  const d = new Date(deadlineStr);
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
