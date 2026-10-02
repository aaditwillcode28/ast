import React, { useRef } from 'react';
import { Search, X } from 'lucide-react';
import { FilterState } from '../types';

interface HeroSectionProps {
  filters: FilterState;
  onFilterChange: (filters: FilterState) => void;
  onOpenHostModal: () => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({
  filters,
  onFilterChange,
}) => {
  const scrollTimeoutRef = useRef<number | null>(null);

  const scrollToResults = () => {
    if (scrollTimeoutRef.current) {
      window.clearTimeout(scrollTimeoutRef.current);
    }
    scrollTimeoutRef.current = window.setTimeout(() => {
      const resultsSection = document.getElementById('tournaments-grid-section');
      if (resultsSection) {
        resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 250);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    onFilterChange({
      ...filters,
      searchQuery: query,
    });
    if (query.trim().length > 0) {
      scrollToResults();
    }
  };

  const handleClearSearch = () => {
    onFilterChange({
      ...filters,
      searchQuery: '',
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      const resultsSection = document.getElementById('tournaments-grid-section');
      if (resultsSection) {
        resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  };

  return (
    <div className="relative overflow-hidden border-b border-slate-200 bg-white py-6 sm:py-8">
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center text-center max-w-3xl mx-auto">
          {/* Headline */}
          <h1 className="font-display text-2xl sm:text-4xl font-extrabold tracking-tight text-slate-900 mb-2">
            Competitions & Tournaments in Nepal
          </h1>

          <p className="max-w-2xl text-xs sm:text-sm text-slate-600 leading-relaxed mb-5">
            Discover football cups, basketball leagues, MUNs, case challenges, quizzes, and esports. Register your squad, track your interests, and compete for glory.
          </p>

          {/* Search Box - Fast & Navigates Downwards */}
          <div className="w-full max-w-2xl">
            <div className="relative flex items-center shadow-sm">
              <input
                id="tournament-search-input"
                type="text"
                value={filters.searchQuery}
                onChange={handleSearchChange}
                onKeyDown={handleKeyDown}
                placeholder="Search football, basketball, MUNs, case challenges, quizzes, cities..."
                className="w-full bg-slate-50 hover:bg-slate-100/80 focus:bg-white border border-slate-300 rounded-2xl py-3 pl-11 pr-24 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all shadow-inner"
              />
              <button
                type="button"
                onClick={scrollToResults}
                className="absolute left-3.5 top-3 text-slate-400 hover:text-orange-500 p-0.5"
                title="Search and view tournaments"
              >
                <Search className="h-4 w-4" />
              </button>
              {filters.searchQuery && (
                <button
                  onClick={handleClearSearch}
                  className="absolute right-4 top-3 text-slate-400 hover:text-slate-600 p-1"
                  title="Clear search"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
            {filters.searchQuery && (
              <div className="mt-2 flex items-center justify-between text-xs text-slate-500 px-1">
                <span>
                  Searching for: <strong className="text-orange-600 font-bold">"{filters.searchQuery}"</strong>
                </span>
                <button
                  type="button"
                  onClick={scrollToResults}
                  className="text-orange-600 font-semibold hover:underline"
                >
                  Jump to results ↓
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
