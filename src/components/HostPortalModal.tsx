import React from 'react';
import {
  X,
  Sparkles,
  Plus,
  Eye,
  Calendar,
  MapPin,
  Users,
  Trash2
} from 'lucide-react';
import { Tournament, Registration } from '../types';
import { formatEventDates } from '../utils/textFormat';

interface HostPortalModalProps {
  isOpen: boolean;
  onClose: () => void;
  hostedTournaments: Tournament[];
  allRegistrations: Registration[];
  onOpenHostModal: () => void;
  onSelectTournament: (tournament: Tournament) => void;
  onDeleteTournament?: (tournamentId: string) => void;
}

export const HostPortalModal: React.FC<HostPortalModalProps> = ({
  isOpen,
  onClose,
  hostedTournaments,
  onOpenHostModal,
  onSelectTournament,
  onDeleteTournament,
}) => {
  if (!isOpen) return null;

  const totalHosted = hostedTournaments.length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 overflow-y-auto bg-black/60 backdrop-blur-sm">
      <div 
        className="relative w-full max-w-4xl rounded-2xl sm:rounded-3xl border border-slate-200 bg-white text-slate-900 shadow-2xl overflow-hidden my-auto max-h-[92vh] flex flex-col font-sans"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 bg-white px-4 sm:px-6 py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-orange-50 text-orange-600 border border-orange-200 font-bold">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-display text-lg sm:text-xl font-bold text-slate-900 leading-tight">
                Tournament Host Dashboard
              </h2>
              <p className="text-xs text-slate-500">
                Manage and track your published tournaments, competitions & events across Nepal
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {/* Metrics summary */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-center justify-between text-slate-500 text-xs font-bold uppercase">
                <span>Published Tournaments</span>
                <Sparkles className="h-4 w-4 text-orange-500" />
              </div>
              <p className="mt-2 font-display text-3xl font-extrabold text-slate-900">
                {totalHosted}
              </p>
              <span className="text-[11px] text-slate-500">Active public events in Nepal</span>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 flex flex-col justify-between">
              <div>
                <span className="text-slate-500 text-xs font-bold uppercase">Quick Action</span>
                <p className="font-bold text-slate-900 text-sm mt-1">Host Another Tournament</p>
                <span className="text-[11px] text-slate-500">Upload your event poster & pamphlet</span>
              </div>
              <button
                onClick={() => {
                  onClose();
                  onOpenHostModal();
                }}
                className="mt-3 inline-flex items-center justify-center gap-1.5 rounded-xl bg-slate-900 hover:bg-orange-500 py-2 px-4 text-xs font-bold text-white transition-colors"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Publish New Event</span>
              </button>
            </div>
          </div>

          {/* Hosted Tournaments List */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Your Published Tournaments ({hostedTournaments.length})
              </h3>
            </div>

            {hostedTournaments.length === 0 ? (
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-8 text-center">
                <p className="text-sm text-slate-500 mb-3">You haven't hosted any tournaments yet.</p>
                <button
                  onClick={() => {
                    onClose();
                    onOpenHostModal();
                  }}
                  className="rounded-xl bg-slate-900 hover:bg-orange-500 px-5 py-2 text-xs font-bold text-white transition-colors"
                >
                  Create Your First Tournament
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {hostedTournaments.map((t) => {
                  const dateLabel = formatEventDates(
                    t.startDate || t.date || '',
                    t.endDate || t.date || '',
                    t.bsStartDate,
                    t.bsEndDate,
                    t.calendarType
                  );
                  const totalTeamsCount = t.totalTeams || t.totalSlots || 16;

                  return (
                    <div
                      key={t.id}
                      className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-slate-50/70 p-4 hover:border-slate-300 transition-all"
                    >
                      <div className="flex items-center gap-3">
                        <img
                          src={t.posterUrl}
                          alt={t.title}
                          referrerPolicy="no-referrer"
                          className="h-16 w-16 rounded-xl object-cover border border-slate-200 shadow-sm"
                        />
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="rounded bg-orange-100 px-2 py-0.5 text-[10px] font-bold text-orange-700">
                              {t.type}
                            </span>
                            <span className="text-xs text-slate-500">{t.ageGroup}</span>
                            <span className="text-xs font-semibold text-slate-700">
                              {totalTeamsCount} Teams
                            </span>
                            <span className="text-xs font-bold text-slate-800">
                              {t.entryFee === 0 ? 'FREE' : `Rs. ${t.entryFee.toLocaleString()}`}
                            </span>
                          </div>
                          <h4 className="font-display text-base font-bold text-slate-900 mt-0.5">
                            {t.title}
                          </h4>
                          <p className="text-xs text-slate-500">
                            {dateLabel} • {t.location}, {t.city}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                        <button
                          onClick={() => {
                            onClose();
                            onSelectTournament(t);
                          }}
                          className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 shadow-2xs transition-colors cursor-pointer"
                        >
                          <Eye className="h-3.5 w-3.5 text-orange-500" />
                          <span>View Public Page</span>
                        </button>
                        {onDeleteTournament && (
                          <button
                            type="button"
                            onClick={() => {
                              if (window.confirm(`Are you sure you want to delete "${t.title}"? This will permanently remove your listing from KataTira.`)) {
                                onDeleteTournament(t.id);
                              }
                            }}
                            className="flex items-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 px-3 py-2 text-xs font-bold text-rose-700 shadow-2xs transition-colors cursor-pointer"
                            title="Permanently remove your tournament"
                          >
                            <Trash2 className="h-3.5 w-3.5 text-rose-600" />
                            <span>Delete</span>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
