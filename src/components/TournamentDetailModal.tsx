import React, { useState } from 'react';
import {
  X,
  Calendar,
  MapPin,
  Sparkles,
  Mail,
  Phone,
  Share2,
  ExternalLink,
  QrCode,
  Globe,
  MessageCircle,
  Users,
  Heart,
  HeartHandshake,
  CircleDot,
  MessageSquare,
  Briefcase,
  HelpCircle,
  Gamepad2,
  Palette,
  Award,
  ShieldCheck,
  ShieldAlert,
  Flag,
  CheckCircle2,
  CalendarPlus,
  Download,
  Landmark,
  Building,
  Check
} from 'lucide-react';
import { Tournament } from '../types';
import { formatEventDates } from '../utils/textFormat';
import { submitEventReport } from '../utils/activityTracker';
import { getGoogleCalendarUrl, downloadIcsFile, getWhatsAppShareUrl, shareTournament } from '../utils/calendarAndShare';
import { getHostVerificationBadge } from './TournamentCard';
import { RegistrationCountdown } from './RegistrationCountdown';
import { calculateTimeRemaining } from '../utils/countdown';

interface TournamentDetailModalProps {
  tournament: Tournament | null;
  isInterested?: boolean;
  onClose: () => void;
  onRegister: (tournament: Tournament) => void;
  onToggleInterest?: (tournamentId: string) => void;
}

const getCategoryIcon = (category: string) => {
  switch (category) {
    case 'Charity & Relief':
      return HeartHandshake;
    case 'Football':
      return Award;
    case 'Basketball':
      return CircleDot;
    case 'MUN & Debate':
      return MessageSquare;
    case 'Case Competition':
      return Briefcase;
    case 'Quiz':
      return HelpCircle;
    case 'Esports':
      return Gamepad2;
    case 'Cultural':
      return Palette;
    default:
      return Award;
  }
};

export const TournamentDetailModal: React.FC<TournamentDetailModalProps> = ({
  tournament,
  isInterested = false,
  onClose,
  onRegister,
  onToggleInterest,
}) => {
  const [copiedLink, setCopiedLink] = useState(false);
  const [activeTab, setActiveTab] = useState<'poster' | 'details'>('poster');
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [reportReason, setReportReason] = useState('Cancelled or fake tournament');
  const [reportDetails, setReportDetails] = useState('');
  const [reporterContact, setReporterContact] = useState('');
  const [reportSubmitted, setReportSubmitted] = useState(false);
  const [reportedIds, setReportedIds] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem('katatira_reported_tournaments');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  if (!tournament) return null;

  const isAlreadyReported = reportedIds.includes(tournament.id);

  const handleSubmitReport = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const updated = [...reportedIds, tournament.id];
      setReportedIds(updated);
      localStorage.setItem('katatira_reported_tournaments', JSON.stringify(updated));

      // Send to platform moderation desk
      submitEventReport({
        tournamentId: tournament.id,
        tournamentTitle: tournament.title,
        hostName: tournament.hostName || tournament.hostOrg,
        hostPhone: tournament.hostPhone,
        category: tournament.category,
        reason: reportReason,
        details: reportDetails,
        reporterContact: reporterContact.trim() || 'KataTira Web Visitor (Anonymous)',
      });
    } catch (err) {
      console.error(err);
    }
    setReportSubmitted(true);
    setTimeout(() => {
      setIsReportOpen(false);
      setReportSubmitted(false);
      setReportDetails('');
      setReporterContact('');
    }, 2500);
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const datesFormatted = formatEventDates(
    tournament.startDate || tournament.date || '',
    tournament.endDate || tournament.date || '',
    tournament.bsStartDate,
    tournament.bsEndDate,
    tournament.calendarType
  );

  const isNoSlotsEvent = Boolean(
    tournament.hasNoSlots ||
    tournament.isReliefFund ||
    tournament.id === 'ev-pm-flood-relief' ||
    tournament.id === 'ev-redcross-flood' ||
    tournament.donationLink ||
    tournament.reliefBankDetails ||
    tournament.title?.toLowerCase().includes('prime minister') ||
    tournament.title?.toLowerCase().includes('disaster relief') ||
    tournament.title?.toLowerCase().includes('emergency appeal') ||
    tournament.title?.toLowerCase().includes('red cross') ||
    (tournament.category === 'Charity & Relief' && !tournament.type?.toLowerCase().includes('7v7') && !tournament.type?.toLowerCase().includes('futsal')) ||
    tournament.totalTeams === 0
  );

  const totalTeamsCount = tournament.totalTeams || tournament.totalSlots || 16;
  const CategoryIcon = getCategoryIcon(tournament.category);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 overflow-y-auto bg-black/60 backdrop-blur-sm">
      <div 
        className="relative w-full max-w-4xl rounded-2xl sm:rounded-3xl border border-slate-200 bg-white text-slate-900 shadow-2xl overflow-hidden my-auto max-h-[92vh] flex flex-col font-sans"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Bar */}
        <div className="flex items-center justify-between border-b border-slate-200 bg-white px-4 sm:px-6 py-3.5 z-10">
          <div className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-orange-50 text-orange-600 font-bold text-base border border-orange-200">
              <CategoryIcon className="h-4 w-4" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-extrabold text-slate-700">
                  {tournament.category}
                </span>
                <span className="text-[11px] text-slate-400">• {tournament.city}, Nepal</span>
              </div>
              <h2 className="font-display text-base sm:text-lg font-bold text-slate-900 leading-tight line-clamp-1">
                {tournament.title}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {onToggleInterest && (
              <button
                onClick={() => onToggleInterest(tournament.id)}
                className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-bold transition-all ${
                  isInterested
                    ? 'border-orange-500 bg-orange-500 text-white shadow-xs'
                    : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
                }`}
                title="Save to your interests"
              >
                <Heart className={`h-3.5 w-3.5 ${isInterested ? 'fill-white' : ''}`} />
                <span>{isInterested ? 'Saved' : 'Save'}</span>
              </button>
            )}

            <button
              onClick={handleShare}
              className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-all"
              title="Copy share link"
            >
              <Share2 className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">{copiedLink ? 'Copied!' : 'Share'}</span>
            </button>

            <button
              onClick={() => setIsReportOpen(true)}
              className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-semibold transition-all ${
                isAlreadyReported
                  ? 'border-rose-200 bg-rose-50 text-rose-600 font-bold'
                  : 'border-slate-200 bg-slate-50 text-slate-500 hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600'
              }`}
              title={isAlreadyReported ? 'Listing reported for moderation review' : 'Report this event'}
            >
              <Flag className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">{isAlreadyReported ? 'Reported' : 'Report'}</span>
            </button>

            <button
              onClick={onClose}
              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* View switcher tabs */}
        <div className="flex border-b border-slate-200 bg-slate-50/70 px-4 sm:px-6">
          <button
            onClick={() => setActiveTab('poster')}
            className={`py-2.5 px-4 text-xs font-bold transition-all border-b-2 ${
              activeTab === 'poster'
                ? 'border-orange-500 text-orange-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Tournament Poster / Flyer
          </button>
          <button
            onClick={() => setActiveTab('details')}
            className={`py-2.5 px-4 text-xs font-bold transition-all border-b-2 ${
              activeTab === 'details'
                ? 'border-orange-500 text-orange-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Tournament Details & Venue
          </button>
        </div>

        {/* Scrollable Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {/* TAB 1: POSTER & QUICK OVERVIEW */}
          {activeTab === 'poster' && (
            <div className="space-y-6">
              {/* Main Poster Showcase */}
              <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-slate-900 shadow-md group">
                <div className="relative aspect-[16/10] sm:aspect-[21/9] w-full bg-slate-950">
                  <img
                    src={tournament.posterUrl}
                    alt={`${tournament.title} Full Poster`}
                    referrerPolicy="no-referrer"
                    className="h-full w-full object-cover object-center"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />
                  
                  {/* Overlay text */}
                  <div className="absolute bottom-4 left-4 right-4 sm:bottom-6 sm:left-6 sm:right-6">
                    <div className="inline-flex items-center gap-1.5 rounded-full bg-orange-500 px-3 py-1 text-xs font-bold text-white uppercase tracking-wider mb-2">
                      Official Tournament Poster
                    </div>
                    <h1 className="font-display text-2xl sm:text-4xl font-extrabold text-white">
                      {tournament.title}
                    </h1>
                  </div>
                </div>
              </div>

              {/* REGISTRATION DEADLINE LIVE COUNTDOWN BANNER */}
              {tournament.registrationDeadline && (
                <RegistrationCountdown deadline={tournament.registrationDeadline} variant="modal-banner" />
              )}

              {/* FLOOD RELIEF & CHARITY BANNER IF APPLICABLE */}
              {tournament.isCharity && (
                <div className="rounded-2xl border-2 border-rose-300 bg-rose-50/90 p-4 sm:p-5 space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="inline-flex items-center gap-1.5 rounded-lg bg-rose-600 px-2.5 py-1 text-xs font-extrabold text-white">
                      <HeartHandshake className="h-4 w-4" />
                      <span>Official Flood Relief Initiative</span>
                    </span>
                    {tournament.officialLink && (
                      <a
                        href={tournament.officialLink}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-xs font-bold text-rose-700 hover:text-rose-900 hover:underline"
                      >
                        <span>Official Portal</span>
                        <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                    )}
                  </div>

                  <h3 className="font-display text-base font-bold text-slate-900 leading-snug">
                    {tournament.causeTitle || "Prime Minister's Disaster Relief Fund (प्रधानमन्त्री दैवी प्रकोप उद्धार कोष)"}
                  </h3>

                  {tournament.reliefBankDetails && (
                    <div className="rounded-xl bg-white p-3 border border-rose-200 text-xs text-slate-800 space-y-1">
                      <span className="font-bold text-rose-900 block text-[11px] uppercase tracking-wider">
                        Verified Banking & Donation Channels:
                      </span>
                      <p className="font-mono text-[11px] leading-relaxed text-slate-700">
                        {tournament.reliefBankDetails}
                      </p>
                    </div>
                  )}

                  {tournament.donationLink && (
                    <a
                      href={tournament.donationLink}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center justify-center gap-2 w-full rounded-xl bg-rose-600 hover:bg-rose-700 py-2.5 px-4 text-xs font-bold text-white shadow-sm transition-all"
                    >
                      <span>Donate Directly via Official Relief Portal</span>
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  )}
                </div>
              )}

              {/* Key Specs Matrix - Adapted for Relief & Open Events */}
              {isNoSlotsEvent ? (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="rounded-xl border border-rose-200 bg-rose-50/60 p-3 text-center">
                    <span className="text-[10px] font-bold text-rose-800 uppercase">Initiative Type</span>
                    <p className="mt-1 font-display text-sm sm:text-base font-bold text-rose-900 truncate">{tournament.type}</p>
                  </div>

                  <div className="rounded-xl border border-rose-200 bg-rose-50/60 p-3 text-center">
                    <span className="text-[10px] font-bold text-rose-800 uppercase">Eligibility</span>
                    <p className="mt-1 font-display text-sm sm:text-base font-bold text-slate-900 truncate">Open to All Citizens</p>
                  </div>

                  <div className="rounded-xl border border-rose-200 bg-rose-50/60 p-3 text-center">
                    <span className="text-[10px] font-bold text-rose-800 uppercase">Beneficiaries</span>
                    <p className="mt-1 font-display text-sm sm:text-base font-bold text-slate-900 truncate">Emergency Relief</p>
                  </div>

                  <div className="rounded-xl border border-rose-200 bg-rose-50/60 p-3 text-center">
                    <span className="text-[10px] font-bold text-rose-800 uppercase">Contribution</span>
                    <p className="mt-1 font-display text-sm sm:text-base font-extrabold text-rose-700 truncate">
                      Voluntary Public Aid
                    </p>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-center">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Format</span>
                    <p className="mt-1 font-display text-lg font-bold text-orange-600 truncate">{tournament.type}</p>
                  </div>

                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-center">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Age Division</span>
                    <p className="mt-1 font-display text-lg font-bold text-slate-900 truncate">{tournament.ageGroup}</p>
                  </div>

                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-center">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Total Teams</span>
                    <p className="mt-1 font-display text-lg font-bold text-slate-900 truncate">{totalTeamsCount} Teams</p>
                  </div>

                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-center">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Entry Fee</span>
                    <p className="mt-1 font-display text-lg font-extrabold text-slate-900">
                      {tournament.entryFee === 0 ? 'FREE' : `Rs. ${tournament.entryFee.toLocaleString()}`}
                    </p>
                  </div>
                </div>
              )}

              {/* Description (if provided) */}
              {tournament.description && (
                <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 sm:p-5">
                  <h3 className="font-display text-sm font-bold uppercase tracking-wider text-slate-800 mb-2">
                    {isNoSlotsEvent ? 'Relief Campaign Details' : 'Tournament Overview'}
                  </h3>
                  <p className="text-sm text-slate-600 leading-relaxed">
                    {tournament.description}
                  </p>
                </div>
              )}

              {/* Prize Pool or Relief Objective Highlight */}
              {tournament.prizePool && (
                <div className={`flex items-center gap-4 rounded-xl border p-4 ${
                  isNoSlotsEvent
                    ? 'border-rose-200 bg-rose-50/80 text-rose-900'
                    : 'border-orange-200 bg-orange-50/80 text-slate-900'
                }`}>
                  <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl font-bold text-white ${
                    isNoSlotsEvent ? 'bg-rose-600' : 'bg-orange-500'
                  }`}>
                    {isNoSlotsEvent ? <HeartHandshake className="h-6 w-6" /> : <Sparkles className="h-6 w-6" />}
                  </div>
                  <div>
                    <span className={`text-xs font-bold uppercase tracking-wider ${
                      isNoSlotsEvent ? 'text-rose-700' : 'text-orange-600'
                    }`}>
                      {isNoSlotsEvent ? 'Relief Focus & Purpose' : 'Prize Pool & Championship Awards'}
                    </span>
                    <p className="text-sm sm:text-base font-bold text-slate-900">
                      {tournament.prizePool}
                    </p>
                  </div>
                </div>
              )}

              {/* ACTION ROW: ADD TO CALENDAR & SOCIAL SHARE */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
                {/* 1. Add to Calendar (Google / iCal) */}
                <div className="space-y-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                    <CalendarPlus className="h-4 w-4 text-orange-500" />
                    <span>Save to Calendar</span>
                  </span>
                  <div className="flex flex-wrap gap-2">
                    <a
                      href={getGoogleCalendarUrl(tournament)}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-800 hover:text-orange-600 hover:border-orange-300 shadow-2xs transition-all active:scale-95"
                    >
                      <Calendar className="h-3.5 w-3.5 text-blue-600" />
                      <span>Google Calendar</span>
                    </a>
                    <button
                      type="button"
                      onClick={() => downloadIcsFile(tournament)}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-800 hover:text-orange-600 hover:border-orange-300 shadow-2xs transition-all active:scale-95"
                    >
                      <Download className="h-3.5 w-3.5 text-slate-600" />
                      <span>Apple / Outlook (.ics)</span>
                    </button>
                  </div>
                </div>

                {/* 2. WhatsApp Share & Direct Link */}
                <div className="space-y-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                    <Share2 className="h-4 w-4 text-emerald-600" />
                    <span>Share with Friends & Squad</span>
                  </span>
                  <div className="flex flex-wrap gap-2">
                    <a
                      href={getWhatsAppShareUrl(tournament)}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 px-3 py-2 text-xs font-bold text-white shadow-xs transition-all active:scale-95"
                    >
                      <MessageCircle className="h-3.5 w-3.5" />
                      <span>Share on WhatsApp</span>
                    </a>
                    <button
                      type="button"
                      onClick={handleShare}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100 transition-all active:scale-95"
                    >
                      {copiedLink ? (
                        <>
                          <Check className="h-3.5 w-3.5 text-emerald-600" />
                          <span className="text-emerald-700">Link Copied!</span>
                        </>
                      ) : (
                        <>
                          <Share2 className="h-3.5 w-3.5 text-slate-500" />
                          <span>Copy Event Link</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {/* Social Media Channels if available */}
              {tournament.socialLinks && (
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-600 block mb-2.5">
                    Connect with Organizer & Event Socials
                  </span>
                  <div className="flex flex-wrap gap-2.5">
                    {tournament.socialLinks.instagram && (
                      <a
                        href={tournament.socialLinks.instagram}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 hover:text-orange-600 hover:border-orange-300 shadow-xs"
                      >
                        <Globe className="h-3.5 w-3.5 text-pink-600" />
                        <span>Instagram Page</span>
                      </a>
                    )}
                    {tournament.socialLinks.facebook && (
                      <a
                        href={tournament.socialLinks.facebook}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 hover:text-blue-600 hover:border-blue-300 shadow-xs"
                      >
                        <Globe className="h-3.5 w-3.5 text-blue-600" />
                        <span>Facebook Page</span>
                      </a>
                    )}
                    {tournament.socialLinks.whatsapp && (
                      <a
                        href={tournament.socialLinks.whatsapp.startsWith('http') ? tournament.socialLinks.whatsapp : `https://wa.me/${tournament.socialLinks.whatsapp.replace(/\D/g, '')}`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-emerald-700 hover:border-emerald-300 shadow-xs"
                      >
                        <MessageCircle className="h-3.5 w-3.5" />
                        <span>WhatsApp</span>
                      </a>
                    )}
                    {tournament.socialLinks.website && (
                      <a
                        href={tournament.socialLinks.website}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 hover:text-orange-600 shadow-xs"
                      >
                        <Globe className="h-3.5 w-3.5" />
                        <span>Official Website</span>
                      </a>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: FULL SPECS & VENUE */}
          {activeTab === 'details' && (
            <div className="space-y-6">
              {/* Date, Time & Venue */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <div className="flex items-center gap-2 text-orange-600 mb-2">
                    <Calendar className="h-5 w-5" />
                    <h4 className="font-bold text-sm text-slate-900">Dates & Schedule</h4>
                  </div>
                  <p className="text-sm font-bold text-slate-800">{datesFormatted}</p>
                  <p className="text-xs text-slate-600 mt-1">
                    {isNoSlotsEvent ? `Dispatches / Active Desks: ${tournament.time}` : `Daily Match Schedule: ${tournament.time}`}
                  </p>
                  {!isNoSlotsEvent && (
                    <p className="text-xs text-slate-400 mt-1">Check-in begins 30 mins prior to match time</p>
                  )}
                </div>

                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <div className="flex items-center gap-2 text-orange-600 mb-2">
                    <MapPin className="h-5 w-5" />
                    <h4 className="font-bold text-sm text-slate-900">Venue Location</h4>
                  </div>
                  <p className="text-sm font-bold text-slate-800">{tournament.location}</p>
                  <p className="text-xs text-slate-600 mt-1">{tournament.city}, {tournament.stateCountry}</p>
                  <div className="mt-3 flex items-center gap-2">
                    <a
                      href={`https://maps.google.com/?q=${encodeURIComponent(`${tournament.location}, ${tournament.city}, Nepal`)}`}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-xs font-semibold text-orange-600 hover:text-orange-700"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                      <span>Open in Google Maps</span>
                    </a>
                  </div>
                </div>
              </div>

              {/* Host Payment Method / QR if specified */}
              {tournament.hostPaymentMethod && (
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <div className="flex items-center gap-2 text-orange-600 mb-2">
                    <QrCode className="h-4 w-4" />
                    <h4 className="font-bold text-xs uppercase tracking-wider text-slate-800">
                      Host Payment Channel
                    </h4>
                  </div>
                  <div className="text-xs text-slate-700 space-y-1">
                    <p>Method: <strong>{tournament.hostPaymentMethod}</strong></p>
                    {tournament.hostPaymentNumber && <p>Account / ID: <strong className="font-mono">{tournament.hostPaymentNumber}</strong></p>}
                    {tournament.hostPaymentInstructions && <p className="text-slate-500">{tournament.hostPaymentInstructions}</p>}
                  </div>
                </div>
              )}

              {/* Trust & Direct Payment Notice */}
              <div className="rounded-xl border border-amber-200 bg-amber-50/80 p-4 space-y-1.5 shadow-2xs">
                <div className="flex items-center gap-2 text-amber-950 font-bold text-xs">
                  <ShieldAlert className="h-4 w-4 text-amber-600 shrink-0" />
                  <span>Trust & Direct Organizer Payment Disclaimer</span>
                </div>
                <p className="text-[11px] text-amber-800 leading-relaxed">
                  KataTira is a community tournament discovery hub in Nepal. We do not hold registration fees in escrow; all payments are transacted directly to the verified organizer. Always verify tournament schedule and match venue directly with the host before travelling.
                </p>
              </div>

              {/* Host Contact Card */}
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 sm:p-5">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
                  Organizer & Host Contact Information
                </h4>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h5 className="text-base font-bold text-slate-900">{tournament.hostName}</h5>
                      {(() => {
                        const badge = getHostVerificationBadge(tournament);
                        if (!badge) return null;
                        const BadgeIcon = badge.icon;
                        return (
                          <span 
                            className={`inline-flex items-center gap-1 rounded-md ${badge.bg} ${badge.text} text-[10px] font-extrabold px-2 py-0.5 shadow-xs border ${badge.border}`}
                            title={badge.tooltip}
                          >
                            <BadgeIcon className="h-3 w-3 text-white" />
                            <span>{badge.label}</span>
                          </span>
                        );
                      })()}
                    </div>
                    {tournament.hostOrg && (
                      <p className="text-xs font-semibold text-orange-600">{tournament.hostOrg}</p>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-3 text-xs text-slate-700">
                    <div className="flex items-center gap-1.5 rounded-lg bg-white border border-slate-200 px-3 py-1.5 shadow-sm">
                      <Mail className="h-3.5 w-3.5 text-slate-400" />
                      <span>{tournament.hostEmail}</span>
                    </div>
                    <div className="flex items-center gap-1.5 rounded-lg bg-white border border-slate-200 px-3 py-1.5 shadow-sm">
                      <Phone className="h-3.5 w-3.5 text-emerald-600" />
                      <span className="font-semibold">{tournament.hostPhone}</span>
                    </div>
                    {tournament.whatsappGroupLink && (
                      <a
                        href={tournament.whatsappGroupLink}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-3 py-1.5 shadow-xs transition-colors"
                      >
                        <MessageCircle className="h-3.5 w-3.5" />
                        <span>Join Host WhatsApp Group</span>
                      </a>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Bar with Direct Registration or Relief Donation CTA */}
        <div className="border-t border-slate-200 bg-slate-50 px-4 sm:px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div>
              <span className="text-[11px] font-bold text-slate-400 uppercase block">
                {isNoSlotsEvent ? 'Contribution Type' : 'Registration Fee'}
              </span>
              <span className="text-xl sm:text-2xl font-black text-slate-900">
                {isNoSlotsEvent
                  ? 'VOLUNTARY AID'
                  : tournament.entryFee === 0
                    ? 'FREE ENTRY'
                    : `Rs. ${tournament.entryFee.toLocaleString()}`}
              </span>
            </div>
            <div className="h-8 w-px bg-slate-200 hidden sm:block" />
            <div className="hidden sm:block text-xs text-slate-500">
              <span className="font-semibold text-slate-700">
                {isNoSlotsEvent ? 'Official Relief Campaign' : `${tournament.type} Tournament`}
              </span>
              <span className="block text-[11px] text-emerald-600 font-medium">
                {isNoSlotsEvent ? '100% Direct to Beneficiaries' : 'Zero Platform Extra Fees'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            {tournament.officialLink && (
              <a
                href={tournament.officialLink}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-800 hover:text-orange-600 hover:border-orange-300 transition-colors shadow-2xs"
              >
                <span>{isNoSlotsEvent ? 'Official Relief Portal' : 'Official Link'}</span>
                <ExternalLink className="h-3.5 w-3.5 text-slate-400" />
              </a>
            )}

            <button
              onClick={onClose}
              className="flex-1 sm:flex-initial rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
            >
              Close
            </button>

            {isNoSlotsEvent || (tournament.isCharity && tournament.donationLink) ? (
              <a
                href={tournament.donationLink || tournament.officialLink}
                target="_blank"
                rel="noreferrer"
                className="flex-1 sm:flex-initial flex items-center justify-center gap-2 rounded-xl px-6 py-2.5 text-sm font-bold transition-all shadow-sm active:scale-95 bg-rose-600 hover:bg-rose-700 text-white"
              >
                <span>Donate to Relief Fund</span>
                <ExternalLink className="h-4 w-4" />
              </a>
            ) : tournament.registrationDeadline && calculateTimeRemaining(tournament.registrationDeadline)?.isExpired ? (
              <button
                disabled
                className="flex-1 sm:flex-initial flex items-center justify-center gap-2 rounded-xl px-6 py-2.5 text-sm font-bold bg-slate-200 text-slate-500 cursor-not-allowed border border-slate-300"
              >
                <span>Registration Closed</span>
              </button>
            ) : (
              <button
                onClick={() => {
                  onClose();
                  onRegister(tournament);
                }}
                className="flex-1 sm:flex-initial flex items-center justify-center gap-2 rounded-xl px-6 py-2.5 text-sm font-bold transition-all shadow-sm active:scale-95 bg-slate-900 hover:bg-orange-500 text-white"
              >
                <span>{tournament.isCharity ? 'Register & Support' : 'Register Team'}</span>
              </button>
            )}
          </div>
        </div>

        {/* REPORT EVENT DIALOG MODAL */}
        {isReportOpen && (
          <div 
            className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs"
            onClick={(e) => {
              e.stopPropagation();
              if (!reportSubmitted) setIsReportOpen(false);
            }}
          >
            <div 
              className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl text-slate-900"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2 text-rose-600">
                  <Flag className="h-4 w-4" />
                  <h3 className="font-display font-bold text-sm text-slate-900">Report Tournament</h3>
                </div>
                {!reportSubmitted && (
                  <button
                    onClick={() => setIsReportOpen(false)}
                    className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>

              {reportSubmitted ? (
                <div className="py-6 text-center space-y-2">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                    <CheckCircle2 className="h-6 w-6" />
                  </div>
                  <h4 className="font-bold text-sm text-slate-900">Report Submitted</h4>
                  <p className="text-xs text-slate-600 max-w-xs mx-auto leading-relaxed">
                    Thank you. Your report has been logged. Our moderation team reviews flagged listings within 24 hours to keep KataTira safe for athletes and students across Nepal.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSubmitReport} className="mt-4 space-y-3.5">
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Help maintain trust on KataTira. What issue did you encounter with <strong>{tournament.title}</strong>?
                  </p>

                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                      Reason for Report *
                    </label>
                    <select
                      value={reportReason}
                      onChange={(e) => setReportReason(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 focus:bg-white focus:border-rose-500 focus:outline-none"
                    >
                      <option value="Cancelled or fake tournament">Cancelled or fake tournament</option>
                      <option value="Incorrect host contact / fake payment QR">Incorrect host contact / fake payment QR</option>
                      <option value="Misleading prize pool or rules">Misleading prize pool or rules</option>
                      <option value="Inappropriate poster or content">Inappropriate poster or content</option>
                      <option value="Duplicate listing">Duplicate listing</option>
                      <option value="Other concern">Other concern</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                      Additional Details <span className="text-slate-400 font-normal lowercase">(optional)</span>
                    </label>
                    <textarea
                      rows={3}
                      value={reportDetails}
                      onChange={(e) => setReportDetails(e.target.value)}
                      placeholder="Briefly explain what is wrong or provide evidence..."
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-xs text-slate-900 focus:bg-white focus:border-rose-500 focus:outline-none resize-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                      Your Phone or Email <span className="text-slate-400 font-normal lowercase">(optional - for moderator follow-up)</span>
                    </label>
                    <input
                      type="text"
                      value={reporterContact}
                      onChange={(e) => setReporterContact(e.target.value)}
                      placeholder="e.g. 9841xxxxxx or your@email.com"
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 focus:bg-white focus:border-rose-500 focus:outline-none"
                    />
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => setIsReportOpen(false)}
                      className="rounded-xl border border-slate-200 px-3.5 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="rounded-xl bg-rose-600 hover:bg-rose-700 px-4 py-2 text-xs font-bold text-white shadow-xs active:scale-95 transition-all"
                    >
                      Submit Report
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
