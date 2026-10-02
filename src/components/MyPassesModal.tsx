import React, { useState } from 'react';
import {
  X,
  Ticket,
  Calendar,
  MapPin,
  QrCode,
  Download,
  ArrowRight,
  Trophy,
  Camera,
  Smartphone,
  Copy,
  Check,
  Printer,
  HelpCircle,
  MessageCircle
} from 'lucide-react';
import { Registration } from '../types';
import { formatEventDates } from '../utils/textFormat';

interface MyPassesModalProps {
  isOpen: boolean;
  onClose: () => void;
  registrations: Registration[];
  onExploreClick: () => void;
}

export const MyPassesModal: React.FC<MyPassesModalProps> = ({
  isOpen,
  onClose,
  registrations,
  onExploreClick,
}) => {
  const [selectedPass, setSelectedPass] = useState<Registration | null>(
    registrations.length > 0 ? registrations[0] : null
  );
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedAllDetails, setCopiedAllDetails] = useState(false);
  const [showScreenshotTips, setShowScreenshotTips] = useState(false);

  const handleCopyCode = (code: string) => {
    try {
      navigator.clipboard.writeText(code);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    } catch (e) {
      console.error(e);
    }
  };

  const handleCopyDetails = (reg: Registration) => {
    try {
      const summary =
        `🏆 KataTira Official Pass\n` +
        `• Event: ${reg.tournamentTitle}\n` +
        `• Pass Code: ${reg.confirmationCode}\n` +
        `• Team: ${reg.teamName}\n` +
        `• Dates: ${formatEventDates(reg.tournamentStartDate, reg.tournamentEndDate)} (${reg.tournamentTime})\n` +
        `• Venue: ${reg.tournamentLocation}, ${reg.tournamentCity}\n` +
        `• Contact: ${reg.contactPhone}\n` +
        `• Fee: ${reg.totalAmount === 0 ? 'FREE ENTRY' : `Rs. ${reg.totalAmount.toLocaleString()}`}`;
      navigator.clipboard.writeText(summary);
      setCopiedAllDetails(true);
      setTimeout(() => setCopiedAllDetails(false), 2000);
    } catch (e) {
      console.error(e);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 overflow-y-auto bg-black/60 backdrop-blur-sm">
      <div 
        className="relative w-full max-w-4xl rounded-2xl sm:rounded-3xl border border-slate-200 bg-white text-slate-900 shadow-2xl overflow-hidden my-auto max-h-[92vh] flex flex-col font-sans"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 bg-white px-4 sm:px-6 py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-orange-50 text-orange-600 border border-orange-200">
              <Ticket className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-display text-lg sm:text-xl font-bold text-slate-900 leading-tight">
                My Registrations
              </h2>
              <p className="text-xs text-slate-500">
                Official registration slips, team confirmation codes, and venue entry details
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
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          {registrations.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-50 text-slate-400 mb-4 border border-slate-200">
                <Ticket className="h-8 w-8 text-orange-500/70" />
              </div>
              <h3 className="font-display text-lg font-bold text-slate-900">No active registrations yet</h3>
              <p className="text-xs sm:text-sm text-slate-500 max-w-sm mt-1 mb-6">
                Explore football, basketball, MUNs, case competitions, and quizzes across Nepal. Register your squad and your entry confirmation will appear here.
              </p>
              <button
                onClick={() => {
                  onClose();
                  onExploreClick();
                }}
                className="flex items-center gap-2 rounded-xl bg-slate-900 hover:bg-orange-500 px-6 py-2.5 text-xs font-bold text-white shadow-sm transition-all"
              >
                <span>Browse Opportunities</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {/* ACCOUNT-FREE PARTICIPANT NOTICE & PHOTO/SCREENSHOT RECOMMENDATION BANNER */}
              <div className="rounded-2xl border-2 border-amber-300 bg-gradient-to-r from-amber-50 via-orange-50/70 to-amber-100/60 p-4 text-xs shadow-2xs space-y-2.5">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-500 text-white shadow-xs ring-4 ring-amber-200/60">
                    <Camera className="h-5 w-5" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="inline-flex items-center gap-1 rounded bg-amber-200/90 px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-amber-900">
                        <Smartphone className="h-3 w-3" /> Recommended
                      </span>
                      <span className="text-[11px] font-bold text-amber-900">No Account Required</span>
                    </div>
                    <h4 className="font-display text-sm font-bold text-slate-900 mt-1">
                      Take a photo or screenshot of your passes
                    </h4>
                    <p className="text-slate-700 mt-0.5 leading-relaxed text-xs">
                      Because KataTira does not require accounts or passwords for athletes and visitors (only event hosts log in), your passes are kept in this device's browser. <strong>We strongly advise snapping a photo or screenshot</strong> of your entry slips so you can present your official QR and Pass ID at the gate even if you clear your browser or go offline.
                    </p>
                  </div>
                </div>

                {/* Quick actions for screenshot banner */}
                <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-amber-200/80">
                  <button
                    type="button"
                    onClick={() => setShowScreenshotTips(!showScreenshotTips)}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-amber-300 bg-white hover:bg-amber-50 px-2.5 py-1 text-xs font-bold text-amber-900 transition-colors shadow-2xs cursor-pointer active:scale-95"
                  >
                    <HelpCircle className="h-3.5 w-3.5 text-amber-600" />
                    <span>{showScreenshotTips ? 'Hide Screenshot Guide' : 'Screenshot Shortcuts'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => window.print()}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-amber-300 bg-white hover:bg-amber-50 px-2.5 py-1 text-xs font-bold text-amber-900 transition-colors shadow-2xs cursor-pointer active:scale-95"
                  >
                    <Printer className="h-3.5 w-3.5 text-amber-600" />
                    <span>Print / Save Current Slip</span>
                  </button>

                  {selectedPass && (
                    <button
                      type="button"
                      onClick={() => handleCopyDetails(selectedPass)}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-amber-300 bg-white hover:bg-amber-50 px-2.5 py-1 text-xs font-bold text-amber-900 transition-colors shadow-2xs cursor-pointer active:scale-95"
                    >
                      {copiedAllDetails ? (
                        <>
                          <Check className="h-3.5 w-3.5 text-emerald-600" />
                          <span className="text-emerald-700">Copied Pass Info!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="h-3.5 w-3.5 text-amber-600" />
                          <span>Copy Pass Text</span>
                        </>
                      )}
                    </button>
                  )}
                </div>

                {/* Device Screenshot shortcuts card */}
                {showScreenshotTips && (
                  <div className="rounded-xl bg-white/95 p-3 border border-amber-200 text-xs text-slate-700 space-y-1.5 animate-in fade-in slide-in-from-top-1 shadow-xs">
                    <div className="font-bold text-slate-900 text-[11px] uppercase tracking-wider flex items-center gap-1.5">
                      <Smartphone className="h-3.5 w-3.5 text-amber-600" /> Quick Device Screenshot Shortcuts:
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-[11px]">
                      <div className="flex items-center justify-between bg-slate-50 rounded-lg px-2.5 py-1.5 border border-slate-200/80">
                        <span className="font-bold text-slate-900">Android:</span>
                        <code className="text-orange-700 font-mono text-[10px] bg-white px-1.5 py-0.5 rounded border border-slate-200">Power + Vol Down</code>
                      </div>
                      <div className="flex items-center justify-between bg-slate-50 rounded-lg px-2.5 py-1.5 border border-slate-200/80">
                        <span className="font-bold text-slate-900">iPhone / iPad:</span>
                        <code className="text-orange-700 font-mono text-[10px] bg-white px-1.5 py-0.5 rounded border border-slate-200">Side + Vol Up</code>
                      </div>
                      <div className="flex items-center justify-between bg-slate-50 rounded-lg px-2.5 py-1.5 border border-slate-200/80">
                        <span className="font-bold text-slate-900">Windows PC:</span>
                        <code className="text-orange-700 font-mono text-[10px] bg-white px-1.5 py-0.5 rounded border border-slate-200">Win + Shift + S</code>
                      </div>
                      <div className="flex items-center justify-between bg-slate-50 rounded-lg px-2.5 py-1.5 border border-slate-200/80">
                        <span className="font-bold text-slate-900">Mac:</span>
                        <code className="text-orange-700 font-mono text-[10px] bg-white px-1.5 py-0.5 rounded border border-slate-200">Cmd + Shift + 4</code>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                {/* Pass List (5 cols) */}
                <div className="md:col-span-5 space-y-3">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-1">
                    My Active Registrations ({registrations.length})
                  </span>

                  {registrations.map((reg) => {
                    const isSelected = selectedPass?.id === reg.id;
                    const dateStr = formatEventDates(reg.tournamentStartDate, reg.tournamentEndDate);
                    return (
                      <div
                        key={reg.id}
                        onClick={() => setSelectedPass(reg)}
                        className={`cursor-pointer rounded-2xl border p-3.5 transition-all ${
                          isSelected
                            ? 'border-orange-500 bg-orange-50/50 shadow-md ring-1 ring-orange-500'
                            : 'border-slate-200 bg-slate-50/70 hover:border-slate-300 hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <h4 className="font-display text-sm font-bold text-slate-900 line-clamp-1">
                            {reg.tournamentTitle}
                          </h4>
                          <span className="shrink-0 rounded-md bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                            CONFIRMED
                          </span>
                        </div>

                        <div className="mt-2 text-xs text-slate-600">
                          <p className="font-semibold text-orange-600">{reg.teamName}</p>
                          <p className="text-slate-500 mt-0.5">{dateStr || reg.tournamentStartDate}</p>
                        </div>

                        <div className="mt-2 flex items-center justify-between border-t border-slate-200 pt-2 text-[11px] text-slate-500 font-mono">
                          <span>{reg.confirmationCode}</span>
                          <span className="text-slate-700 font-semibold">{reg.tournamentType}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Selected Pass Detailed Ticket (7 cols) */}
                <div className="md:col-span-7">
                  {selectedPass && (
                    <div className="rounded-2xl border-2 border-orange-300 bg-gradient-to-br from-orange-50/50 via-white to-amber-50/50 p-5 sm:p-6 shadow-lg space-y-4">
                      {/* Header */}
                      <div className="flex items-center justify-between border-b border-dashed border-orange-200 pb-3">
                        <div className="flex items-center gap-2">
                          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-100 text-orange-600">
                            <Trophy className="h-4 w-4" />
                          </div>
                          <div>
                            <span className="font-display text-sm font-bold tracking-wider text-slate-900 block">
                              KATATIRA OFFICIAL REGISTRATION SLIP
                            </span>
                            <div className="flex items-center gap-1.5">
                              <span className="text-[10px] text-slate-500">Verified Participation Access</span>
                              <span className="inline-flex items-center gap-0.5 rounded bg-amber-100 px-1.5 py-0.2 text-[9px] font-extrabold text-amber-800">
                                <Camera className="h-2.5 w-2.5" /> Photo / Screenshot
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="text-[10px] text-slate-400 block font-bold">ENTRY CODE</span>
                          <div className="flex items-center gap-1 justify-end">
                            <span className="font-mono text-xs font-bold text-orange-600">
                              {selectedPass.confirmationCode}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleCopyCode(selectedPass.confirmationCode)}
                              className="p-1 rounded text-slate-400 hover:text-slate-700 hover:bg-orange-100 transition-colors"
                              title="Copy code"
                            >
                              {copiedCode ? <Check className="h-3 w-3 text-emerald-600" /> : <Copy className="h-3 w-3 text-orange-500" />}
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Tournament Info */}
                      <div>
                        <span className="rounded bg-orange-100 px-2 py-0.5 text-[10px] font-bold text-orange-700 mb-1 inline-block">
                          {selectedPass.tournamentType} COMPETITION
                        </span>
                        <h3 className="font-display text-lg font-bold text-slate-900">
                          {selectedPass.tournamentTitle}
                        </h3>
                        <div className="mt-2 space-y-1 text-xs text-slate-600">
                          <div className="flex items-center gap-2">
                            <Calendar className="h-3.5 w-3.5 text-orange-500" />
                            <span>
                              {formatEventDates(selectedPass.tournamentStartDate, selectedPass.tournamentEndDate)} ({selectedPass.tournamentTime})
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <MapPin className="h-3.5 w-3.5 text-orange-500" />
                            <span>{selectedPass.tournamentLocation}, {selectedPass.tournamentCity}, Nepal</span>
                          </div>
                        </div>
                      </div>

                      {/* Team & Contact Details */}
                      <div className="grid grid-cols-2 gap-2.5 rounded-xl bg-slate-50 p-3.5 border border-slate-200 text-xs">
                        <div>
                          <span className="text-[10px] text-slate-400 block uppercase font-bold">Team / Participant</span>
                          <span className="font-bold text-slate-900">{selectedPass.teamName}</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 block uppercase font-bold">Contact Phone</span>
                          <span className="font-bold text-slate-900">{selectedPass.contactPhone}</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 block uppercase font-bold">Email</span>
                          <span className="text-slate-700 truncate block">{selectedPass.contactEmail}</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 block uppercase font-bold">Registration Fee</span>
                          <span className="font-bold text-emerald-600">
                            {selectedPass.totalAmount === 0 ? 'FREE ENTRY' : `Rs. ${selectedPass.totalAmount.toLocaleString()}`}
                          </span>
                        </div>
                      </div>

                      {/* QR Code Bar */}
                      <div className="flex items-center justify-between rounded-xl bg-white border border-slate-200 p-3 text-slate-900 shadow-sm">
                        <div>
                          <span className="text-xs font-bold uppercase tracking-wider block">Official Gate Check-in QR</span>
                          <span className="text-[10px] text-slate-500">Present this QR code or screenshot at check-in desk</span>
                        </div>
                        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-slate-900 text-white p-1 shrink-0">
                          <QrCode className="h-10 w-10 text-white" />
                        </div>
                      </div>

                      {/* Host WhatsApp Group Link */}
                      {selectedPass.whatsappGroupLink && (
                        <div className="rounded-xl border border-emerald-200 bg-emerald-50/80 p-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5">
                          <div className="flex items-center gap-2">
                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-600 text-white shrink-0">
                              <MessageCircle className="h-4 w-4" />
                            </div>
                            <div>
                              <span className="text-xs font-bold text-slate-900 block">Host's Official WhatsApp Group</span>
                              <span className="text-[10px] text-slate-500">Live fixtures, match schedules, and announcements</span>
                            </div>
                          </div>
                          <a
                            href={selectedPass.whatsappGroupLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 px-3.5 py-1.5 text-xs font-bold text-white transition-colors shadow-2xs cursor-pointer"
                          >
                            <span>Join WhatsApp Group</span>
                            <ArrowRight className="h-3 w-3" />
                          </a>
                        </div>
                      )}

                      {/* Actions */}
                      <div className="flex flex-wrap gap-2 pt-2">
                        <button
                          onClick={() => window.print()}
                          className="flex-1 min-w-[140px] flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-100 transition-colors shadow-2xs cursor-pointer active:scale-95"
                        >
                          <Download className="h-3.5 w-3.5" />
                          <span>Print / Save Slip</span>
                        </button>
                        <button
                          onClick={() => handleCopyDetails(selectedPass)}
                          className="flex-1 min-w-[140px] flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-100 transition-colors shadow-2xs cursor-pointer active:scale-95"
                        >
                          {copiedAllDetails ? (
                            <>
                              <Check className="h-3.5 w-3.5 text-emerald-600" />
                              <span className="text-emerald-700">Copied!</span>
                            </>
                          ) : (
                            <>
                              <Copy className="h-3.5 w-3.5 text-slate-500" />
                              <span>Copy Pass Details</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export const MyRegistrationsModal = MyPassesModal;
