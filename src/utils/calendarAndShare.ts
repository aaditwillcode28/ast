import { Tournament } from '../types';
import { formatEventDates } from './textFormat';
import { getEventPageUrl } from './seo';

/**
 * Generates a direct Google Calendar event creation URL.
 */
export const getGoogleCalendarUrl = (tournament: Tournament): string => {
  const title = encodeURIComponent(tournament.title);
  const location = encodeURIComponent(`${tournament.location}, ${tournament.city}, Nepal`);
  
  const desc = encodeURIComponent(
    `${tournament.description || tournament.title}\n\n` +
    `Category: ${tournament.category}\n` +
    `Format: ${tournament.type}\n` +
    `Host: ${tournament.hostOrg || tournament.hostName} (${tournament.hostPhone || ''})\n` +
    `Admission/Entry: ${tournament.entryFee === 0 ? 'FREE' : `Rs. ${tournament.entryFee}`}\n\n` +
    `Listed on KataTira Nepal: ${window.location.origin}`
  );

  // Format dates to YYYYMMDD
  const startRaw = (tournament.startDate || tournament.date || '2026-10-01').replace(/-/g, '');
  // For end date, default to start or next day
  const endRaw = (tournament.endDate || tournament.startDate || tournament.date || '2026-10-01').replace(/-/g, '');

  // Full day event or standard 8-hour span format: YYYYMMDD/YYYYMMDD (or with T000000Z)
  const dates = `${startRaw}T030000Z/${endRaw}T120000Z`;

  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${dates}&details=${desc}&location=${location}`;
};

/**
 * Generates an iCalendar (.ics) file string and triggers browser download.
 */
export const downloadIcsFile = (tournament: Tournament): void => {
  const startRaw = (tournament.startDate || tournament.date || '2026-10-01').replace(/-/g, '');
  const endRaw = (tournament.endDate || tournament.startDate || tournament.date || '2026-10-01').replace(/-/g, '');

  const nowIso = new Date().toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  const uid = `${tournament.id}-${Date.now()}@katatira.np`;

  const cleanTitle = tournament.title.replace(/[,;]/g, ' ');
  const cleanLoc = `${tournament.location}, ${tournament.city}, Nepal`.replace(/[,;]/g, ' ');
  const cleanDesc = (tournament.description || tournament.title).replace(/\n/g, '\\n').replace(/[,;]/g, ' ');

  const icsContent = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//KataTira Nepal//Event Calendar//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTAMP:${nowIso}`,
    `DTSTART;VALUE=DATE:${startRaw}`,
    `DTEND;VALUE=DATE:${endRaw}`,
    `SUMMARY:${cleanTitle}`,
    `DESCRIPTION:${cleanDesc}\\n\\nOrganizer: ${tournament.hostOrg || tournament.hostName}`,
    `LOCATION:${cleanLoc}`,
    'STATUS:CONFIRMED',
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n');

  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
  const link = document.createElement('a');
  link.href = window.URL.createObjectURL(blob);
  link.setAttribute('download', `${tournament.id}-event.ics`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

/**
 * Generates a high-converting WhatsApp message URL for sharing.
 */
export const getWhatsAppShareUrl = (tournament: Tournament): string => {
  const dates = formatEventDates(
    tournament.startDate || tournament.date || '',
    tournament.endDate || tournament.date || '',
    tournament.bsStartDate,
    tournament.bsEndDate,
    tournament.calendarType
  );

  const priceText = tournament.isCharity
    ? 'Direct Disaster Relief Contribution'
    : tournament.entryFee === 0
    ? 'FREE Entry'
    : `Rs. ${tournament.entryFee.toLocaleString()}`;

  const message = [
    `🇳🇵 *${tournament.title}*`,
    `📂 *Category:* ${tournament.category} (${tournament.type})`,
    `📅 *Dates:* ${dates}`,
    `📍 *Venue:* ${tournament.location}, ${tournament.city}`,
    `💰 *Entry:* ${priceText}`,
    `🏆 *Prize / Cause:* ${tournament.prizePool || 'Championship'}`,
    `👤 *Host:* ${tournament.hostOrg || tournament.hostName}`,
    ``,
    `Check details & register on KataTira Nepal:`,
    `${getEventPageUrl(tournament.id, tournament.title)}`
  ].join('\n');

  return `https://api.whatsapp.com/send?text=${encodeURIComponent(message)}`;
};

/**
 * Universal Share helper: triggers native Web Share if supported, else copies link and returns true.
 */
export const shareTournament = async (
  tournament: Tournament,
  onCopyFallback?: () => void
): Promise<boolean> => {
  const eventUrl = getEventPageUrl(tournament.id, tournament.title);
  const shareData = {
    title: `${tournament.title} | KataTira Nepal`,
    text: `Check out ${tournament.title} happening in ${tournament.city}, Nepal!`,
    url: eventUrl,
  };

  if (navigator.share) {
    try {
      await navigator.share(shareData);
      return true;
    } catch (err: any) {
      if (err.name === 'AbortError') return false;
    }
  }

  // Fallback to clipboard
  try {
    await navigator.clipboard.writeText(window.location.href);
    if (onCopyFallback) onCopyFallback();
    return true;
  } catch {
    return false;
  }
};
