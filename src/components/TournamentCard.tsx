import React, { useState } from 'react';
import {
  Calendar,
  MapPin,
  ArrowRight,
  Eye,
  Heart,
  HeartHandshake,
  CircleDot,
  MessageSquare,
  Briefcase,
  HelpCircle,
  Gamepad2,
  Palette,
  Award,
  Sparkles,
  ShieldCheck,
  Landmark,
  Share2,
  Check,
  Building,
  CheckCircle2
} from 'lucide-react';
import { Tournament } from '../types';
import { formatEventDates } from '../utils/textFormat';
import { getCategoryFallbackImage } from '../data/mockTournaments';
import { getWhatsAppShareUrl, shareTournament } from '../utils/calendarAndShare';
import { RegistrationCountdown } from './RegistrationCountdown';

interface TournamentCardProps {
  tournament: Tournament;
  isInterested?: boolean;
  onSelect: (tournament: Tournament) => void;
  onRegister: (tournament: Tournament) => void;
  onToggleInterest: (tournamentId: string) => void;
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

/**
 * Returns verification badge styling and label according to verification type or organization
 */
export const getHostVerificationBadge = (tournament: Tournament) => {
  if (
    tournament.hostVerificationType === 'government' ||
    tournament.id === 'ev-pm-flood-relief' ||
    tournament.hostOrg?.toLowerCase().includes('government of nepal') ||
    tournament.title.toLowerCase().includes('prime minister')
  ) {
    return {
      label: 'Official Government Desk',
      icon: Landmark,
      bg: 'bg-blue-600',
      border: 'border-blue-400/50',
      text: 'text-white',
      tooltip: 'Official Government of Nepal national desk',
    };
  }

  if (
    tournament.hostVerificationType === 'relief_desk' ||
    tournament.id === 'ev-redcross-flood' ||
    tournament.hostOrg?.toLowerCase().includes('red cross')
  ) {
    return {
      label: 'Verified Relief Desk',
      icon: HeartHandshake,
      bg: 'bg-rose-600',
      border: 'border-rose-400/50',
      text: 'text-white',
      tooltip: 'Authorized national humanitarian disaster relief desk',
    };
  }

  if (
    tournament.hostVerificationType === 'verified_association' ||
    tournament.hostOrg?.toLowerCase().includes('association') ||
    tournament.hostOrg?.toLowerCase().includes('neba') ||
    tournament.hostOrg?.toLowerCase().includes('nesa')
  ) {
    return {
      label: 'Verified Association',
      icon: Building,
      bg: 'bg-purple-600',
      border: 'border-purple-400/50',
      text: 'text-white',
      tooltip: 'Recognized sporting or academic association in Nepal',
    };
  }

  if (tournament.isHostVerified) {
    return {
      label: 'Verified Organizer',
      icon: ShieldCheck,
      bg: 'bg-emerald-600',
      border: 'border-emerald-400/50',
      text: 'text-white',
      tooltip: 'Verified Organizer: Identity and contact confirmed',
    };
  }

  return null;
};

export const TournamentCard: React.FC<TournamentCardProps> = ({
  tournament,
  isInterested = false,
  onSelect,
  onRegister,
  onToggleInterest,
}) => {
  const [copiedShare, setCopiedShare] = useState(false);

  const formattedDates = formatEventDates(
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

  const isReliefOrCharity = Boolean(
    tournament.isCharity ||
    tournament.isReliefFund ||
    tournament.category === 'Charity & Relief' ||
    tournament.reliefBankDetails
  );

  const totalSlotsCount = tournament.totalTeams || tournament.totalSlots || 16;
  const CategoryIcon = getCategoryIcon(tournament.category);
  const interestedCount = (tournament.interestedCount || 0) + (isInterested ? 1 : 0);
  const verificationBadge = getHostVerificationBadge(tournament);

  const handleWhatsAppShare = (e: React.MouseEvent) => {
    e.stopPropagation();
    const url = getWhatsAppShareUrl(tournament);
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleQuickShare = async (e: React.MouseEvent) => {
    e.stopPropagation();
    await shareTournament(tournament, () => {
      setCopiedShare(true);
      setTimeout(() => setCopiedShare(false), 2000);
    });
  };

  return (
    <div className="group relative flex flex-col overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-xs transition-all duration-300 hover:scale-[1.015] hover:-translate-y-1 hover:shadow-xl hover:shadow-orange-500/10 hover:border-orange-300/80 font-sans">
      {/* POSTER / BANNER */}
      <div 
        onClick={() => onSelect(tournament)}
        className="relative aspect-[16/10] sm:aspect-[16/9] w-full overflow-hidden bg-slate-900 cursor-pointer"
      >
        <img
          src={tournament.posterUrl || getCategoryFallbackImage(tournament.category)}
          alt={`${tournament.title} Poster`}
          referrerPolicy="no-referrer"
          className="h-full w-full object-cover object-center transition-transform duration-500 group-hover:scale-105"
          onError={(e) => {
            const target = e.currentTarget as HTMLImageElement;
            target.onerror = null;
            target.src = getCategoryFallbackImage(tournament.category);
          }}
        />

        {/* Gradient Overlays for High Legibility */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/95 via-slate-950/30 to-transparent pointer-events-none" />
        <div className="absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-slate-950/75 to-transparent pointer-events-none" />

        {/* Top Action & Badges Row */}
        <div className="absolute top-3 left-3 right-3 flex items-center justify-between gap-2 z-10 pointer-events-auto">
          <div className="flex items-center gap-1.5 flex-wrap">
            {/* Category Badge with Lucide Icon */}
            <div className="flex items-center gap-1.5 rounded-lg bg-slate-950/90 px-2.5 py-1 text-xs font-bold text-white backdrop-blur-md border border-white/20 shadow-md">
              <CategoryIcon className="h-3.5 w-3.5 text-orange-400" />
              <span className="truncate max-w-[120px]">{tournament.category}</span>
            </div>

            {/* Dedicated Highlight Badges */}
            {tournament.isCharity ? (
              <span className="inline-flex items-center gap-1 rounded-lg bg-rose-600 px-2.5 py-1 text-[10px] font-extrabold text-white shadow-md backdrop-blur-md border border-rose-400/40 tracking-wider">
                <HeartHandshake className="h-3 w-3" />
                <span>RELIEF INITIATIVE</span>
              </span>
            ) : tournament.isFeatured ? (
              <span className="inline-flex items-center gap-1 rounded-lg bg-amber-400 px-2.5 py-1 text-[10px] font-black text-slate-950 shadow-md backdrop-blur-md border border-amber-300/50 tracking-wider">
                <Sparkles className="h-3 w-3" />
                <span>FEATURED</span>
              </span>
            ) : null}

            {tournament.province && (
              <span className="hidden sm:inline-flex items-center rounded-lg bg-slate-900/80 px-2 py-0.5 text-[10px] font-bold text-slate-200 border border-white/10 backdrop-blur-md">
                {tournament.province}
              </span>
            )}

            {/* Registration Deadline Countdown Badge */}
            {tournament.registrationDeadline && (
              <RegistrationCountdown deadline={tournament.registrationDeadline} variant="card-badge" />
            )}
          </div>

          {/* Quick Actions: WhatsApp Share + Heart/Save */}
          <div className="flex items-center gap-1.5">
            {/* WhatsApp Share Button */}
            <button
              type="button"
              onClick={handleWhatsAppShare}
              className="flex items-center justify-center rounded-lg h-7 w-7 bg-emerald-600 text-white hover:bg-emerald-500 shadow-md backdrop-blur-md border border-emerald-400/50 transition-all hover:scale-105 active:scale-95"
              title="Share event on WhatsApp (Popular in Nepal)"
            >
              {/* WhatsApp phone/message icon */}
              <svg className="h-3.5 w-3.5 fill-current" viewBox="0 0 24 24">
                <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.711 2.598 2.664-.699c.974.551 1.874.809 2.795.809 3.179 0 5.767-2.587 5.767-5.766.002-3.18-2.585-5.767-5.766-5.767zm0-1.672c4.108 0 7.438 3.329 7.438 7.438 0 4.109-3.33 7.438-7.438 7.438-1.282 0-2.485-.327-3.535-.899l-4.526 1.187 1.208-4.414c-.655-1.1-1.026-2.385-1.026-3.75 0-4.109 3.33-7.438 7.438-7.438z" />
              </svg>
            </button>

            {/* Quick Share Link Button */}
            <button
              type="button"
              onClick={handleQuickShare}
              className="hidden sm:flex items-center justify-center rounded-lg h-7 w-7 bg-slate-950/85 text-white/90 hover:bg-slate-800 shadow-xs backdrop-blur-md border border-white/15 transition-all"
              title="Copy event link"
            >
              {copiedShare ? (
                <Check className="h-3.5 w-3.5 text-emerald-400" />
              ) : (
                <Share2 className="h-3.5 w-3.5" />
              )}
            </button>

            {/* REGISTER INTEREST (Heart) Button */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onToggleInterest(tournament.id);
              }}
              className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-bold transition-all shadow-xs backdrop-blur-md border ${
                isInterested
                  ? 'bg-orange-500 text-white border-orange-400'
                  : 'bg-slate-950/85 text-white/90 border-white/15 hover:bg-orange-500 hover:text-white'
              }`}
              title={isInterested ? 'Saved in your interests' : 'Save to your interests'}
            >
              <Heart className={`h-3.5 w-3.5 ${isInterested ? 'fill-white' : ''}`} />
              <span className="hidden sm:inline">{isInterested ? 'Saved' : 'Save'}</span>
            </button>
          </div>
        </div>

        {/* Poster Quick Preview Hover Pill */}
        <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity duration-200 group-hover:opacity-100 backdrop-blur-[2px]">
          <span className="flex items-center gap-2 rounded-xl bg-white px-4 py-2 text-xs font-bold text-slate-900 shadow-xl hover:bg-orange-500 hover:text-white transition-all">
            <Eye className="h-4 w-4" />
            <span>View Full Details & Official Link</span>
          </span>
        </div>

        {/* Title and Host on Poster Base */}
        <div className="absolute bottom-3 left-3 right-3 space-y-1">
          <h3 className="font-display text-base sm:text-lg font-bold leading-tight text-white line-clamp-1 group-hover:text-orange-300 transition-colors">
            {tournament.title}
          </h3>
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-xs text-slate-300 line-clamp-1 font-medium">
              By {tournament.hostOrg || tournament.hostName}
            </p>
            {/* Host Verification Badge */}
            {verificationBadge && (
              <span
                className={`inline-flex items-center gap-1 rounded-md ${verificationBadge.bg} ${verificationBadge.text} text-[10px] font-extrabold px-2 py-0.5 shadow-sm border ${verificationBadge.border}`}
                title={verificationBadge.tooltip}
              >
                <verificationBadge.icon className="h-3 w-3 shrink-0" />
                <span>{verificationBadge.label}</span>
              </span>
            )}
          </div>
        </div>
      </div>

      {/* DETAILS SECTION BELOW POSTER */}
      <div className="flex flex-1 flex-col p-4 sm:p-5">
        {/* Date & Time */}
        <div className="mb-2 flex items-center gap-2 text-xs text-slate-600">
          <Calendar className="h-4 w-4 shrink-0 text-orange-500" />
          <span className="font-bold text-slate-800">{formattedDates}</span>
          <span className="text-slate-300">•</span>
          <span className="truncate">{tournament.time}</span>
        </div>

        {/* Location & City & Province in Nepal */}
        <div className="mb-3 flex items-start gap-2 text-xs text-slate-600">
          <MapPin className="h-4 w-4 shrink-0 text-orange-500 mt-0.5" />
          <div className="flex flex-col">
            <span className="font-semibold text-slate-800 line-clamp-1">{tournament.location}</span>
            <span className="text-slate-500">
              {tournament.city}{tournament.province ? `, ${tournament.province} Province` : ''}, {tournament.stateCountry}
            </span>
          </div>
        </div>

        {/* Transparency Info Strip on Disaster Relief & Charity Cards */}
        {isReliefOrCharity && (
          <div className="mb-3 rounded-xl bg-emerald-50 border border-emerald-200/80 p-2.5 text-[11px] text-emerald-950 flex items-start gap-2">
            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600 mt-0.5" />
            <div className="leading-snug">
              <span className="font-bold text-emerald-800 block">Direct Contribution Channel:</span>
              <span className="text-emerald-700">
                {tournament.transparencyNote || 'Direct Bank Transfer | eSewa / Khalti QR available (100% Direct Public Aid)'}
              </span>
            </div>
          </div>
        )}

        {/* Specs Grid: Format, Slots, Entry Fee */}
        {isNoSlotsEvent ? (
          <div className="grid grid-cols-2 gap-2 rounded-xl bg-rose-50/70 p-2.5 border border-rose-200/80 mb-3 text-center">
            <div>
              <span className="text-[10px] font-bold text-rose-800 uppercase tracking-wider block">Initiative</span>
              <span className="text-xs font-bold text-slate-900 truncate block">{tournament.type}</span>
            </div>
            <div>
              <span className="text-[10px] font-bold text-rose-800 uppercase tracking-wider block">Contribution</span>
              <span className="text-xs font-black text-rose-700 truncate block">Direct Public Aid</span>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-2 rounded-xl bg-slate-50 p-2.5 border border-slate-200/80 mb-3 text-center">
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Format</span>
              <span className="text-xs font-bold text-orange-600 truncate block">{tournament.type}</span>
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Slots</span>
              <span className="text-xs font-bold text-slate-800 truncate block">{totalSlotsCount} Slots</span>
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Entry / Cost</span>
              <span className={`text-xs font-extrabold ${tournament.entryFee === 0 ? 'text-emerald-600' : 'text-slate-900'}`}>
                {tournament.entryFee === 0 ? 'FREE' : `Rs. ${tournament.entryFee.toLocaleString()}`}
              </span>
            </div>
          </div>
        )}

        {/* Prize Pool or Cause */}
        {tournament.prizePool && (
          <div className={`mb-3.5 flex items-center gap-2 text-xs rounded-xl p-2.5 border ${
            (tournament.isCharity || isNoSlotsEvent)
              ? 'bg-rose-50/80 border-rose-200 text-rose-900'
              : 'bg-amber-50/70 border-amber-200/60 text-slate-700'
          }`}>
            {(tournament.isCharity || isNoSlotsEvent) ? (
              <HeartHandshake className="h-4 w-4 shrink-0 text-rose-600" />
            ) : (
              <Sparkles className="h-4 w-4 shrink-0 text-amber-500" />
            )}
            <span className="line-clamp-1 font-medium">
              <strong className="font-bold">{(tournament.isCharity || isNoSlotsEvent) ? 'Relief Focus:' : 'Prize:'}</strong> {tournament.prizePool}
            </span>
          </div>
        )}

        {/* Metrics Row */}
        <div className="mb-3 flex items-center justify-between text-[11px] text-slate-500 px-0.5">
          <span className="flex items-center gap-1 font-medium text-slate-600">
            <Heart className={`h-3 w-3 ${isInterested ? 'text-orange-500 fill-orange-500' : 'text-slate-400'}`} />
            <span>{interestedCount} Interested</span>
          </span>

          <span className="font-semibold text-slate-500">
            {isNoSlotsEvent ? (
              <span className="text-emerald-700 font-bold">Open Public Drive</span>
            ) : (
              <span>{tournament.registeredTeamsCount} / {totalSlotsCount} Registered</span>
            )}
          </span>
        </div>

        {/* Registration Deadline Countdown Strip */}
        {tournament.registrationDeadline && (
          <RegistrationCountdown deadline={tournament.registrationDeadline} variant="card-strip" />
        )}

        {/* PRIMARY CTA - CLEAR & FOCUSED WITH VISUAL HOVER FEEDBACK */}
        <div className="mt-auto pt-2 border-t border-slate-100">
          <button
            onClick={() => onSelect(tournament)}
            className={`group/btn w-full flex items-center justify-center gap-2 rounded-xl py-2.5 px-4 text-xs sm:text-sm font-bold transition-all duration-200 shadow-xs active:scale-[0.98] cursor-pointer ${
              tournament.isCharity
                ? 'bg-rose-600 hover:bg-rose-500 hover:shadow-md hover:shadow-rose-600/30 text-white border border-rose-500/40 hover:border-rose-400'
                : 'bg-slate-900 hover:bg-orange-500 hover:shadow-md hover:shadow-orange-500/25 text-white border border-transparent hover:border-orange-400/30'
            }`}
          >
            <span>{tournament.isCharity ? 'View Relief Details & Support' : 'View Details & Register'}</span>
            <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover/btn:translate-x-1" />
          </button>
        </div>
      </div>
    </div>
  );
};
