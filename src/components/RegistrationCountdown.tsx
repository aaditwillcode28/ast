import React, { useState, useEffect } from 'react';
import { Clock, AlertCircle } from 'lucide-react';
import { calculateTimeRemaining, formatCountdownBadge, CountdownTime } from '../utils/countdown';

interface RegistrationCountdownProps {
  deadline?: string;
  variant?: 'card-badge' | 'card-strip' | 'modal-banner' | 'pill';
  showZeroState?: boolean;
}

export const RegistrationCountdown: React.FC<RegistrationCountdownProps> = ({
  deadline,
  variant = 'card-strip',
  showZeroState = false,
}) => {
  const [timeLeft, setTimeLeft] = useState<CountdownTime | null>(() =>
    deadline ? calculateTimeRemaining(deadline) : null
  );

  useEffect(() => {
    if (!deadline) {
      setTimeLeft(null);
      return;
    }

    // Initial check
    setTimeLeft(calculateTimeRemaining(deadline));

    // Update every second
    const interval = setInterval(() => {
      const remaining = calculateTimeRemaining(deadline);
      setTimeLeft(remaining);
      if (remaining?.isExpired) {
        clearInterval(interval);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [deadline]);

  if (!deadline || !timeLeft) {
    return null;
  }

  const badgeInfo = formatCountdownBadge(timeLeft);

  // Variant 1: Compact Floating Card Badge (e.g. over poster)
  if (variant === 'card-badge') {
    if (timeLeft.isExpired) {
      return (
        <div className="inline-flex items-center gap-1 rounded-lg bg-slate-900/90 px-2 py-0.5 text-[10px] font-bold text-rose-300 border border-rose-500/30 backdrop-blur-md shadow-xs">
          <AlertCircle className="h-3 w-3 text-rose-400" />
          <span>Registration Ended</span>
        </div>
      );
    }

    return (
      <div
        className={`inline-flex items-center gap-1 rounded-lg px-2 py-0.5 text-[10px] font-extrabold backdrop-blur-md shadow-xs border ${
          badgeInfo.urgent
            ? 'bg-rose-600/95 text-white border-rose-400/50 animate-pulse'
            : 'bg-amber-500/90 text-slate-950 border-amber-300/40'
        }`}
        title={`Registration deadline: ${deadline}`}
      >
        <Clock className="h-3 w-3 shrink-0" />
        <span>{badgeInfo.text}</span>
      </div>
    );
  }

  // Variant 2: Card Strip (integrated seamlessly above actions in TournamentCard)
  if (variant === 'card-strip') {
    if (timeLeft.isExpired) {
      return (
        <div className="mb-3 flex items-center justify-between rounded-xl bg-slate-100 border border-slate-200 px-2.5 py-1.5 text-xs text-slate-600">
          <div className="flex items-center gap-1.5 font-bold text-slate-700">
            <AlertCircle className="h-3.5 w-3.5 text-slate-500 shrink-0" />
            <span>Registration Closed</span>
          </div>
          <span className="text-[10px] text-slate-400">Deadline reached</span>
        </div>
      );
    }

    return (
      <div
        className={`mb-3 flex items-center justify-between rounded-xl px-2.5 py-1.5 text-xs border transition-colors ${
          badgeInfo.urgent
            ? 'bg-rose-50 border-rose-200 text-rose-950'
            : 'bg-orange-50 border-orange-200 text-orange-950'
        }`}
      >
        <div className="flex items-center gap-1.5 font-bold">
          <Clock className={`h-3.5 w-3.5 shrink-0 ${badgeInfo.urgent ? 'text-rose-600 animate-spin-slow' : 'text-orange-600'}`} />
          <span className="text-[11px] font-extrabold uppercase tracking-wide">
            {badgeInfo.urgent ? 'Closing Soon' : 'Deadline'}
          </span>
        </div>

        {/* Live numerical countdown boxes */}
        <div className="flex items-center gap-1 font-mono text-[11px] font-bold">
          {timeLeft.days > 0 && (
            <span className="rounded bg-white/90 px-1 py-0.5 border border-slate-200 shadow-2xs">
              {timeLeft.days}d
            </span>
          )}
          <span className="rounded bg-white/90 px-1 py-0.5 border border-slate-200 shadow-2xs">
            {String(timeLeft.hours).padStart(2, '0')}h
          </span>
          <span className="text-slate-400">:</span>
          <span className="rounded bg-white/90 px-1 py-0.5 border border-slate-200 shadow-2xs">
            {String(timeLeft.minutes).padStart(2, '0')}m
          </span>
          <span className="text-slate-400">:</span>
          <span className={`rounded bg-white/90 px-1 py-0.5 border border-slate-200 shadow-2xs ${badgeInfo.urgent ? 'text-rose-600 font-extrabold' : ''}`}>
            {String(timeLeft.seconds).padStart(2, '0')}s
          </span>
        </div>
      </div>
    );
  }

  // Variant 3: Modal Banner (Rich presentation in TournamentDetailModal & RegistrationModal)
  if (variant === 'modal-banner') {
    if (timeLeft.isExpired) {
      return (
        <div className="rounded-2xl border-2 border-slate-200 bg-slate-50 p-4 text-center">
          <div className="inline-flex items-center gap-2 text-slate-700 font-bold text-sm">
            <AlertCircle className="h-5 w-5 text-slate-500" />
            <span>Registration Has Officially Closed</span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            The deadline of {deadline} has passed. Slots are being finalized with registered teams.
          </p>
        </div>
      );
    }

    return (
      <div
        className={`rounded-2xl border-2 p-4 sm:p-5 transition-all shadow-sm ${
          badgeInfo.urgent
            ? 'border-rose-300 bg-gradient-to-r from-rose-50 to-orange-50 text-rose-950'
            : 'border-orange-300 bg-gradient-to-r from-orange-50 to-amber-50 text-slate-900'
        }`}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div
              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-white ${
                badgeInfo.urgent ? 'bg-rose-600 animate-pulse' : 'bg-orange-500'
              }`}
            >
              <Clock className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span
                  className={`text-[10px] font-black uppercase tracking-wider rounded-md px-2 py-0.5 ${
                    badgeInfo.urgent ? 'bg-rose-600 text-white' : 'bg-orange-500 text-white'
                  }`}
                >
                  Registration Deadline
                </span>
                <span className="text-xs font-semibold text-slate-600">{deadline}</span>
              </div>
              <h4 className="text-sm font-bold text-slate-900 mt-0.5">
                {badgeInfo.urgent ? 'Hurry! Registration closes in:' : 'Time remaining to submit roster:'}
              </h4>
            </div>
          </div>

          {/* Large Countdown Units */}
          <div className="flex items-center gap-1.5 self-start sm:self-auto font-mono">
            {timeLeft.days > 0 && (
              <div className="flex flex-col items-center rounded-xl bg-white px-2.5 py-1.5 border border-slate-200 shadow-2xs min-w-[48px]">
                <span className="text-base font-extrabold text-slate-900 leading-none">{timeLeft.days}</span>
                <span className="text-[9px] font-sans font-bold text-slate-400 uppercase mt-0.5">Days</span>
              </div>
            )}
            <div className="flex flex-col items-center rounded-xl bg-white px-2.5 py-1.5 border border-slate-200 shadow-2xs min-w-[48px]">
              <span className="text-base font-extrabold text-slate-900 leading-none">
                {String(timeLeft.hours).padStart(2, '0')}
              </span>
              <span className="text-[9px] font-sans font-bold text-slate-400 uppercase mt-0.5">Hours</span>
            </div>
            <span className="text-slate-400 font-bold text-lg -mt-3">:</span>
            <div className="flex flex-col items-center rounded-xl bg-white px-2.5 py-1.5 border border-slate-200 shadow-2xs min-w-[48px]">
              <span className="text-base font-extrabold text-slate-900 leading-none">
                {String(timeLeft.minutes).padStart(2, '0')}
              </span>
              <span className="text-[9px] font-sans font-bold text-slate-400 uppercase mt-0.5">Mins</span>
            </div>
            <span className="text-slate-400 font-bold text-lg -mt-3">:</span>
            <div
              className={`flex flex-col items-center rounded-xl bg-white px-2.5 py-1.5 border border-slate-200 shadow-2xs min-w-[48px] ${
                badgeInfo.urgent ? 'ring-2 ring-rose-400' : ''
              }`}
            >
              <span
                className={`text-base font-extrabold leading-none ${
                  badgeInfo.urgent ? 'text-rose-600' : 'text-slate-900'
                }`}
              >
                {String(timeLeft.seconds).padStart(2, '0')}
              </span>
              <span className="text-[9px] font-sans font-bold text-slate-400 uppercase mt-0.5">Secs</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Variant 4: Simple pill
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold ${
        badgeInfo.urgent ? 'bg-rose-100 text-rose-700' : 'bg-orange-100 text-orange-700'
      }`}
    >
      <Clock className="h-3 w-3" />
      <span>{badgeInfo.text}</span>
    </span>
  );
};
