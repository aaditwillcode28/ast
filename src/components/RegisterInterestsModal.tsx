import React, { useState } from 'react';
import {
  X,
  Sparkles,
  Check,
  Bell,
  Heart,
  Trophy,
  CircleDot,
  MessageSquare,
  Briefcase,
  HelpCircle,
  Gamepad2,
  Palette,
  HeartHandshake
} from 'lucide-react';

interface RegisterInterestsModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedInterests: string[];
  onSaveInterests: (interests: string[], userEmail?: string, userName?: string) => void;
}

const INTEREST_OPTIONS = [
  { id: 'Charity & Relief', label: 'Charity & Flood Relief Drives', icon: HeartHandshake, color: 'text-rose-600 bg-rose-50' },
  { id: 'Football', label: 'Football & Futsal Tournaments', icon: Trophy, color: 'text-emerald-600 bg-emerald-50' },
  { id: 'Basketball', label: 'Basketball (3v3 / 5v5 Tournaments)', icon: CircleDot, color: 'text-orange-600 bg-orange-50' },
  { id: 'MUN & Debate', label: 'Model UN & Parliamentary Debates', icon: MessageSquare, color: 'text-purple-600 bg-purple-50' },
  { id: 'Case Competition', label: 'Business & Startup Challenges', icon: Briefcase, color: 'text-cyan-600 bg-cyan-50' },
  { id: 'Quiz', label: 'Trivia, Quizzes & Olympiads', icon: HelpCircle, color: 'text-amber-700 bg-amber-50' },
  { id: 'Esports', label: 'Esports & Gaming Championships', icon: Gamepad2, color: 'text-pink-600 bg-pink-50' },
  { id: 'Cultural', label: 'Music, Arts & Cultural Fests', icon: Palette, color: 'text-rose-600 bg-rose-50' },
];

export const RegisterInterestsModal: React.FC<RegisterInterestsModalProps> = ({
  isOpen,
  onClose,
  selectedInterests,
  onSaveInterests,
}) => {
  const [currentSelected, setCurrentSelected] = useState<string[]>(selectedInterests);
  const [userName, setUserName] = useState('');
  const [userEmail, setUserEmail] = useState('');

  if (!isOpen) return null;

  const toggleInterest = (id: string) => {
    if (currentSelected.includes(id)) {
      setCurrentSelected(currentSelected.filter((item) => item !== id));
    } else {
      setCurrentSelected([...currentSelected, id]);
    }
  };

  const handleSelectAll = () => {
    if (currentSelected.length === INTEREST_OPTIONS.length) {
      setCurrentSelected([]);
    } else {
      setCurrentSelected(INTEREST_OPTIONS.map((o) => o.id));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveInterests(currentSelected, userEmail.trim(), userName.trim());
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs font-sans">
      <div 
        className="relative w-full max-w-lg rounded-2xl sm:rounded-3xl border border-slate-200 bg-white text-slate-900 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-200 bg-slate-50/80 p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-orange-500 text-white shadow-sm">
              <Heart className="h-5 w-5 fill-white text-white" />
            </div>
            <div>
              <h2 className="font-display text-lg font-bold text-slate-900">
                Register Your Interests
              </h2>
              <p className="text-xs text-slate-500">
                Pick what you want to compete in to customize your opportunities feed.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-200 hover:text-slate-700 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-5">
          {/* Quick toggle all */}
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Choose Categories ({currentSelected.length} selected)
            </span>
            <button
              type="button"
              onClick={handleSelectAll}
              className="text-xs font-bold text-orange-600 hover:underline"
            >
              {currentSelected.length === INTEREST_OPTIONS.length ? 'Clear All' : 'Select All'}
            </button>
          </div>

          {/* Interest Chips Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-60 overflow-y-auto pr-1">
            {INTEREST_OPTIONS.map((item) => {
              const isChecked = currentSelected.includes(item.id);
              const Icon = item.icon;
              return (
                <button
                  type="button"
                  key={item.id}
                  onClick={() => toggleInterest(item.id)}
                  className={`flex items-center gap-2.5 rounded-xl border p-3 text-left transition-all ${
                    isChecked
                      ? 'border-orange-500 bg-orange-50/70 text-slate-900 shadow-xs ring-1 ring-orange-500'
                      : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${item.color}`}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <span className="text-xs font-bold flex-1 leading-tight">{item.label}</span>
                  <div
                    className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border ${
                      isChecked
                        ? 'border-orange-500 bg-orange-500 text-white'
                        : 'border-slate-300 bg-white'
                    }`}
                  >
                    {isChecked && <Check className="h-3 w-3 stroke-[3]" />}
                  </div>
                </button>
              );
            })}
          </div>

          {/* User Contact for interest alerts (optional) */}
          <div className="rounded-xl bg-slate-50 p-3.5 border border-slate-200 space-y-2.5">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
              <Bell className="h-3.5 w-3.5 text-orange-500" />
              <span>Receive Opportunity & Deadline Alerts (Optional)</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <input
                type="text"
                placeholder="Your Name"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-orange-500"
              />
              <input
                type="email"
                placeholder="Your Email (for notifications)"
                value={userEmail}
                onChange={(e) => setUserEmail(e.target.value)}
                className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-orange-500"
              />
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex items-center gap-2 rounded-xl bg-orange-500 hover:bg-orange-600 px-5 py-2.5 text-xs font-bold text-white shadow-sm transition-all active:scale-95"
            >
              <Sparkles className="h-4 w-4" />
              <span>Save & Filter My Feed</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
