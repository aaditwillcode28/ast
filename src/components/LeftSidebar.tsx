import React from 'react';
import {
  Compass,
  Ticket,
  Heart,
  PlusCircle,
  Building2,
  HeartHandshake,
  LayoutGrid,
  Award,
  CircleDot,
  MessageSquare,
  Briefcase,
  HelpCircle,
  Gamepad2,
  Palette,
  SlidersHorizontal,
  MapPin,
  Sparkles,
  X,
  Search,
  Check,
  BarChart3,
  Activity,
  Calendar,
  Navigation,
  Globe2
} from 'lucide-react';
import { FilterState, Tournament } from '../types';
import { PROVINCES_OF_NEPAL } from '../data/mockTournaments';

export interface CategoryItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  badge?: string;
  description: string;
}

export const CATEGORIES_LIST: CategoryItem[] = [
  { 
    id: 'All', 
    label: 'All Opportunities', 
    icon: LayoutGrid, 
    color: 'text-slate-700 bg-slate-100',
    description: 'Explore all tournaments, competitions, and relief initiatives in Nepal.'
  },
  { 
    id: 'Charity & Relief', 
    label: 'Charity & Flood Relief', 
    icon: HeartHandshake, 
    color: 'text-rose-600 bg-rose-100',
    badge: 'Relief Appeal',
    description: 'Prime Minister’s Disaster Relief Fund and charity futsal drives for flood-affected families.'
  },
  { 
    id: 'Football', 
    label: 'Football & Futsal', 
    icon: Award, 
    color: 'text-emerald-600 bg-emerald-100',
    description: 'Premier 5v5 and 7v7 futsal tournaments and inter-college gold cups across Kathmandu & Pokhara.'
  },
  { 
    id: 'Basketball', 
    label: 'Basketball Tournaments', 
    icon: Trophy, 
    color: 'text-orange-600 bg-orange-100',
    description: 'National Basketball League (NeBA), 3v3 streetball showdowns, and open college cups.'
  },
  { 
    id: 'MUN & Debate', 
    label: 'MUNs & Debates', 
    icon: MessageSquare, 
    color: 'text-purple-600 bg-purple-100',
    description: 'Kathmandu Model United Nations and national parliamentary debate championships.'
  },
  { 
    id: 'Case Competition', 
    label: 'Case Competitions', 
    icon: Briefcase, 
    color: 'text-cyan-600 bg-cyan-100',
    description: 'Hult Prize at TU, startup venture pitch battles, and collegiate business challenges.'
  },
  { 
    id: 'Quiz', 
    label: 'Quizzes & Trivia', 
    icon: HelpCircle, 
    color: 'text-amber-700 bg-amber-100',
    description: 'MahaQuiz Nepal National Trivia Olympiad and high-school inter-collegiate quiz bowls.'
  },
  { 
    id: 'Esports', 
    label: 'Esports & Gaming', 
    icon: Gamepad2, 
    color: 'text-pink-600 bg-pink-100',
    description: 'PMNC PUBG Mobile national squads, Valorant 5v5 LAN stages, and creator tournaments.'
  },
  { 
    id: 'Cultural', 
    label: 'Arts & Cultural Fests', 
    icon: Palette, 
    color: 'text-violet-600 bg-violet-100',
    description: 'Battle of the bands, inter-college theatre, photography, and cultural exhibitions.'
  },
];

const MAJOR_CITIES = ['All Cities', 'Kathmandu', 'Lalitpur', 'Pokhara', 'Dharan', 'Chitwan', 'Online'];

interface LeftSidebarProps {
  filters: FilterState;
  onFilterChange: (filters: FilterState) => void;
  onOpenHostModal: () => void;
  onOpenHostPortal: () => void;
  onOpenRegistrationsModal: () => void;
  onOpenInterestsModal: () => void;
  onOpenAdminHub?: () => void;
  pendingReportsCount?: number;
  registrationsCount: number;
  hostedCount: number;
  userInterestedIds: string[];
  userInterests: string[];
  tournaments: Tournament[];
  isMobileOpen?: boolean;
  onCloseMobile?: () => void;
}

export const LeftSidebar: React.FC<LeftSidebarProps> = ({
  filters,
  onFilterChange,
  onOpenHostModal,
  onOpenHostPortal,
  onOpenRegistrationsModal,
  onOpenInterestsModal,
  onOpenAdminHub,
  pendingReportsCount = 0,
  registrationsCount,
  hostedCount,
  userInterestedIds,
  userInterests,
  tournaments,
  isMobileOpen = false,
  onCloseMobile,
}) => {
  // Compute counts per category
  const categoryCounts = React.useMemo(() => {
    const counts: Record<string, number> = { All: tournaments.length };
    tournaments.forEach((t) => {
      counts[t.category] = (counts[t.category] || 0) + 1;
    });
    return counts;
  }, [tournaments]);

  const charityEventsCount = React.useMemo(() => {
    return tournaments.filter((t) => t.isCharity || t.category === 'Charity & Relief').length;
  }, [tournaments]);

  const handleCategorySelect = (catId: string) => {
    onFilterChange({
      ...filters,
      category: catId === 'All' ? 'all' : catId,
      onlyInterested: false,
      onlyCharity: false,
    });
  };

  const handleSelectCharityRelief = () => {
    onFilterChange({
      ...filters,
      category: 'Charity & Relief',
      onlyInterested: false,
    });
  };

  const handleResetToExplore = () => {
    onFilterChange({
      ...filters,
      category: 'all',
      onlyInterested: false,
      onlyCharity: false,
      searchQuery: '',
    });
  };

  const toggleOnlyInterested = () => {
    onFilterChange({
      ...filters,
      onlyInterested: !filters.onlyInterested,
    });
  };

  const toggleOnlyFree = () => {
    onFilterChange({
      ...filters,
      onlyFree: !filters.onlyFree,
    });
  };

  const handleCitySelect = (city: string) => {
    onFilterChange({
      ...filters,
      type: city === 'All Cities' ? 'all' : city,
    });
  };

  const handleResetFilters = () => {
    onFilterChange({
      searchQuery: '',
      category: 'all',
      type: 'all',
      ageGroup: 'all',
      maxFee: 0,
      onlyFree: false,
      onlyInterested: false,
      onlyCharity: false,
      selectedDateFilter: 'all',
    });
  };

  const hasActiveFilters =
    Boolean(filters.searchQuery) ||
    filters.category !== 'all' ||
    filters.onlyFree ||
    filters.onlyInterested ||
    (filters.type !== 'all' && filters.type !== '');

  const isExploreActive = filters.category === 'all' && !filters.onlyInterested;

  const sidebarContent = (
    <div className="space-y-4">
      {/* Mobile Drawer Header */}
      <div className="flex md:hidden items-center justify-between pb-2 border-b border-slate-200">
        <span className="font-bold text-sm text-slate-900">Filters & Navigation</span>
        <button
          onClick={onCloseMobile}
          className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* SEGMENT 1: PRIMARY NAVIGATION (Explore, Registrations, Interests, Host) */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs space-y-2">
        <div className="px-1 pb-1 flex items-center justify-between border-b border-slate-100 mb-2">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Navigation
          </span>
          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            Live Nepal
          </span>
        </div>

        {/* Explore Button */}
        <button
          onClick={handleResetToExplore}
          className={`w-full flex items-center justify-between rounded-xl px-3.5 py-2.5 text-xs font-bold transition-all ${
            isExploreActive
              ? 'bg-orange-500 text-white shadow-xs'
              : 'text-slate-700 hover:bg-slate-50 hover:text-slate-900'
          }`}
        >
          <div className="flex items-center gap-2.5">
            <Compass className={`h-4 w-4 ${isExploreActive ? 'text-white' : 'text-orange-500'}`} />
            <span>Explore Opportunities</span>
          </div>
          <span className={`rounded-full px-2 py-0.5 text-[10px] font-extrabold ${
            isExploreActive ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'
          }`}>
            {tournaments.length}
          </span>
        </button>

        {/* My Registrations Button */}
        <button
          onClick={onOpenRegistrationsModal}
          className="w-full flex items-center justify-between rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 hover:text-slate-900 border border-transparent hover:border-slate-200 transition-all"
        >
          <div className="flex items-center gap-2.5">
            <Ticket className="h-4 w-4 text-orange-500" />
            <span>My Registrations</span>
          </div>
          {registrationsCount > 0 ? (
            <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-orange-500 px-1.5 text-[11px] font-extrabold text-white">
              {registrationsCount}
            </span>
          ) : (
            <span className="text-[10px] font-semibold text-slate-400">Slips</span>
          )}
        </button>

        {/* My Interests / Bookmarks Button */}
        <button
          onClick={toggleOnlyInterested}
          className={`w-full flex items-center justify-between rounded-xl px-3.5 py-2.5 text-xs font-bold transition-all border ${
            filters.onlyInterested
              ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
              : 'text-slate-700 border-transparent hover:bg-slate-50 hover:text-slate-900'
          }`}
        >
          <div className="flex items-center gap-2.5">
            <Heart className={`h-4 w-4 ${filters.onlyInterested ? 'fill-white text-white' : 'text-orange-500'}`} />
            <span>Saved Interests</span>
          </div>
          <span className={`rounded-full px-2 py-0.5 text-[10px] font-extrabold ${
            filters.onlyInterested ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
          }`}>
            {userInterestedIds.length}
          </span>
        </button>

        {/* Host Tournament Button */}
        <div className="pt-2 border-t border-slate-100">
          <button
            onClick={onOpenHostModal}
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-slate-900 hover:bg-orange-500 px-3.5 py-2.5 text-xs font-bold text-white shadow-xs transition-all active:scale-95"
          >
            <PlusCircle className="h-4 w-4 text-orange-400" />
            <span>Host Tournament</span>
          </button>

          {hostedCount > 0 && (
            <button
              onClick={onOpenHostPortal}
              className="w-full mt-2 flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-700 transition-colors"
            >
              <Building2 className="h-3.5 w-3.5 text-slate-500" />
              <span>Manage Hosted ({hostedCount})</span>
            </button>
          )}

        </div>
      </div>

      {/* SEGMENT 2: EMERGENCY FLOOD RELIEF SPOTLIGHT (HIGH VISIBILITY, DISTINCT) */}
      <div className="rounded-2xl border-2 border-rose-300 bg-gradient-to-br from-rose-50 via-red-50 to-white p-4 shadow-xs">
        <div className="flex items-start gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-rose-600 text-white shadow-xs">
            <HeartHandshake className="h-5 w-5" />
          </div>
          <div className="flex-1 min-w-0">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-rose-700 block">
              Emergency Flood Appeal
            </span>
            <h4 className="text-xs font-bold text-slate-900 leading-snug mt-0.5">
              PM Disaster Relief Fund 2026
            </h4>
            <p className="text-[11px] text-slate-600 mt-1 line-clamp-2 leading-relaxed">
              Koshi, Madhesh & Gandaki relief drives and charity sports cups.
            </p>
          </div>
        </div>

        <button
          onClick={handleSelectCharityRelief}
          className={`w-full mt-3 flex items-center justify-center gap-1.5 rounded-xl py-2 px-3 text-xs font-bold transition-all ${
            filters.category === 'Charity & Relief'
              ? 'bg-rose-700 text-white'
              : 'bg-rose-600 hover:bg-rose-700 text-white shadow-xs'
          }`}
        >
          <span>View Relief Drives ({charityEventsCount})</span>
        </button>
      </div>

      {/* SEGMENT 3: BROWSE BY CATEGORY / DOMAIN */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100 mb-2">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Categories & Sectors
          </span>
          {hasActiveFilters && (
            <button
              onClick={handleResetFilters}
              className="text-[11px] font-bold text-orange-600 hover:underline"
            >
              Reset
            </button>
          )}
        </div>

        <div className="space-y-1">
          {CATEGORIES_LIST.map((category) => {
            const Icon = category.icon;
            const isSelected =
              category.id === 'All'
                ? filters.category === 'all' && !filters.onlyInterested
                : filters.category === category.id && !filters.onlyInterested;
            const count =
              category.id === 'Charity & Relief'
                ? charityEventsCount
                : categoryCounts[category.id] || 0;

            return (
              <button
                key={category.id}
                onClick={() => handleCategorySelect(category.id)}
                className={`w-full flex items-center justify-between rounded-xl px-3 py-2 text-xs font-medium transition-all ${
                  isSelected
                    ? 'bg-slate-900 text-white font-bold shadow-xs'
                    : 'text-slate-700 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <div className="flex items-center gap-2.5 truncate">
                  <div className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md ${
                    isSelected ? 'bg-white/20 text-white' : category.color
                  }`}>
                    <Icon className="h-3.5 w-3.5" />
                  </div>
                  <span className="truncate">{category.label}</span>
                </div>

                <div className="flex items-center gap-1.5 shrink-0 ml-2">
                  {category.badge && !isSelected && (
                    <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded bg-rose-100 text-rose-700">
                      {category.badge}
                    </span>
                  )}
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                      isSelected
                        ? 'bg-white/20 text-white'
                        : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    {count}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* SEGMENT 4: DATE RANGE SELECTOR */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs space-y-2.5">
        <div className="flex items-center justify-between pb-1.5 border-b border-slate-100">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900">
            <Calendar className="h-3.5 w-3.5 text-orange-500" />
            <span>Date Range (AD & BS)</span>
          </div>
          {filters.selectedDateFilter !== 'all' && (
            <button
              onClick={() => onFilterChange({ ...filters, selectedDateFilter: 'all' })}
              className="text-[11px] font-bold text-orange-600 hover:underline"
            >
              Reset
            </button>
          )}
        </div>

        <div className="grid grid-cols-2 gap-1.5">
          {[
            { id: 'all', label: 'All Dates' },
            { id: 'this_weekend', label: 'This Weekend' },
            { id: 'next_7_days', label: 'Next 7 Days' },
            { id: 'this_month', label: 'This Month' },
          ].map((d) => {
            const isSelected = filters.selectedDateFilter === d.id;
            return (
              <button
                key={d.id}
                onClick={() => onFilterChange({ ...filters, selectedDateFilter: d.id as any })}
                className={`rounded-lg px-2.5 py-1.5 text-[11px] font-semibold text-center transition-all ${
                  isSelected
                    ? 'bg-orange-500 text-white font-bold shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {d.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* SEGMENT 5: PROVINCE OF NEPAL & NEAR ME */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs space-y-3">
        <div className="flex items-center justify-between pb-1.5 border-b border-slate-100">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900">
            <Globe2 className="h-3.5 w-3.5 text-orange-500" />
            <span>Province in Nepal</span>
          </div>
          {(filters.province && filters.province !== 'all') || filters.nearMe ? (
            <button
              onClick={() => onFilterChange({ ...filters, province: 'all', nearMe: false })}
              className="text-[11px] font-bold text-orange-600 hover:underline"
            >
              Clear
            </button>
          ) : null}
        </div>

        {/* Near Me Quick Toggle */}
        <button
          onClick={() => onFilterChange({ ...filters, nearMe: !filters.nearMe })}
          className={`w-full flex items-center justify-between rounded-xl px-3 py-2 text-xs font-bold transition-all border ${
            filters.nearMe
              ? 'bg-emerald-600 border-emerald-600 text-white shadow-xs'
              : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
          }`}
        >
          <div className="flex items-center gap-2">
            <Navigation className={`h-3.5 w-3.5 ${filters.nearMe ? 'text-white' : 'text-emerald-600'}`} />
            <span>Near Me (Local Hubs)</span>
          </div>
          <span className={`h-2 w-2 rounded-full ${filters.nearMe ? 'bg-white animate-pulse' : 'bg-emerald-500'}`} />
        </button>

        {/* Province Buttons */}
        <div className="flex flex-wrap gap-1">
          {PROVINCES_OF_NEPAL.map((prov) => {
            const isSelected =
              prov === 'All Provinces'
                ? (!filters.province || filters.province === 'all') && !filters.nearMe
                : filters.province === prov;
            return (
              <button
                key={prov}
                onClick={() =>
                  onFilterChange({
                    ...filters,
                    province: prov === 'All Provinces' ? 'all' : prov,
                    nearMe: false,
                  })
                }
                className={`rounded-lg px-2.5 py-1 text-[11px] font-semibold transition-all ${
                  isSelected
                    ? 'bg-slate-900 text-white font-bold'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {prov}
              </button>
            );
          })}
        </div>
      </div>

      {/* SEGMENT 6: CITY & ENTRY FEE */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900">
            <SlidersHorizontal className="h-3.5 w-3.5 text-slate-500" />
            <span>Filter by City & Entry</span>
          </div>
          {filters.type !== 'all' && (
            <button
              onClick={() => handleCitySelect('All Cities')}
              className="text-[11px] font-bold text-orange-600 hover:underline"
            >
              Clear City
            </button>
          )}
        </div>

        {/* Free Entry Checkbox */}
        <label className="flex items-center gap-2.5 text-xs font-semibold text-slate-700 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={filters.onlyFree}
            onChange={toggleOnlyFree}
            className="h-4 w-4 rounded border-slate-300 text-orange-600 focus:ring-orange-500"
          />
          <span>Free Entry Opportunities Only</span>
        </label>

        {/* Cities Grid */}
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1.5">
            City in Nepal
          </span>
          <div className="flex flex-wrap gap-1">
            {MAJOR_CITIES.map((city) => {
              const isSelected =
                city === 'All Cities'
                  ? filters.type === 'all' || !filters.type
                  : filters.type === city;
              return (
                <button
                  key={city}
                  onClick={() => handleCitySelect(city)}
                  className={`rounded-lg px-2.5 py-1 text-[11px] font-semibold transition-all ${
                    isSelected
                      ? 'bg-slate-900 text-white font-bold'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {city}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sticky Sidebar */}
      <aside className="hidden md:block w-64 lg:w-72 shrink-0 font-sans md:sticky md:top-20 md:self-start">
        {sidebarContent}
      </aside>

      {/* Mobile Slide-Over Drawer */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity"
            onClick={onCloseMobile}
          />
          <div className="relative ml-auto h-full w-full max-w-xs bg-slate-50 p-4 shadow-2xl overflow-y-auto z-10">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
};
