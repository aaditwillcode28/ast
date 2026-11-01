import React from 'react';
import { PlusCircle, Search, X, Activity, Compass, Tv, Film } from 'lucide-react';
import { KataTiraLogo } from './KataTiraLogo';

interface NavbarProps {
  onOpenHostModal: () => void;
  onOpenRegistrationsModal?: () => void;
  onOpenPassesModal?: () => void;
  onOpenHostPortal: () => void;
  onOpenInterestsModal?: () => void;
  onOpenAdminHub?: () => void;
  pendingReportsCount?: number;
  registrationsCount: number;
  hostedCount: number;
  activeView: 'explore' | 'passes' | 'hosted' | 'videos';
  setActiveView: (view: 'explore' | 'passes' | 'hosted' | 'videos') => void;
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  onOpenHostModal,
  onOpenAdminHub,
  pendingReportsCount = 0,
  activeView,
  setActiveView,
  searchQuery = '',
  onSearchChange,
}) => {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200 bg-white/95 backdrop-blur-md">
      <div className="w-full flex h-16 items-center justify-between gap-4 px-3 sm:px-5 lg:px-6">
        {/* BRAND LOGO */}
        <div 
          onClick={() => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          className="group flex cursor-pointer items-center gap-2.5 transition-transform active:scale-95 shrink-0 select-none"
          id="katatira-logo"
        >
          <div className="flex h-10 w-10 sm:h-10.5 sm:w-10.5 items-center justify-center rounded-full bg-transparent p-0.5 group-hover:scale-105 transition-transform shrink-0">
            <KataTiraLogo className="h-full w-full object-contain" />
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="font-brand text-2xl sm:text-[27px] font-black tracking-tight text-slate-900 leading-none">
              Kata<span className="text-orange-500">Tira</span>
            </span>
            <span className="text-[10px] sm:text-[11px] font-bold text-slate-400 tracking-wider uppercase">
              Nepal
            </span>
          </div>
        </div>

        {/* SEARCH BAR IN HEADER - Keeps left panel uncluttered */}
        {onSearchChange && (
          <div className="flex-1 max-w-md hidden sm:block">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder="Search tournaments, venues, flood relief..."
                className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-8 py-2 text-xs text-slate-900 placeholder-slate-400 focus:bg-white focus:border-orange-500 focus:outline-none transition-all shadow-2xs"
              />
              {searchQuery && (
                <button
                  onClick={() => onSearchChange('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-full p-1 text-slate-400 hover:bg-slate-200 hover:text-slate-700"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>
          </div>
        )}

        {/* NAVIGATION VIEW SWITCHER: Tournaments vs Videos */}
        <div className="flex items-center rounded-xl bg-slate-100 p-1 border border-slate-200 shrink-0">
          <button
            type="button"
            onClick={() => setActiveView('explore')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeView === 'explore'
                ? 'bg-white text-slate-900 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Compass className="h-3.5 w-3.5 text-orange-500" />
            <span>Tournaments</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveView('videos')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeView === 'videos'
                ? 'bg-orange-500 text-white shadow-2xs font-extrabold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Tv className="h-3.5 w-3.5" />
            <span>Videos</span>
          </button>
        </div>

        {/* RIGHT SIDE: Host Tournament CTA */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="hidden xl:flex items-center gap-1.5 text-xs text-slate-500 border-r border-slate-200 pr-3">
            <span className="flex h-2 w-2 rounded-full bg-emerald-500" />
            <span className="font-medium">Kathmandu & Nationwide</span>
          </div>


          <button
            id="nav-host-tournament-btn"
            onClick={onOpenHostModal}
            className="flex items-center gap-1.5 rounded-xl bg-orange-500 hover:bg-orange-600 px-3.5 py-2 text-xs sm:text-sm font-bold text-white shadow-xs transition-all active:scale-95 shrink-0"
            title="Host a tournament or competition on KataTira"
          >
            <PlusCircle className="h-4 w-4 shrink-0" />
            <span className="whitespace-nowrap font-bold">Host Event</span>
          </button>
        </div>
      </div>
    </header>
  );
};

