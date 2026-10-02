import React, { useState } from 'react';
import {
  X,
  Lock,
  CheckCircle2,
  ShieldCheck,
  Calendar,
  MapPin,
  Ticket,
  Download,
  Share2,
  ArrowLeft,
  ArrowRight,
  QrCode,
  AlertCircle,
  Smartphone,
  Copy,
  Check,
  Upload,
  CreditCard,
  MessageSquare,
  ShieldAlert,
  Camera,
  Printer,
  HelpCircle,
  MessageCircle
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { Tournament, Registration } from '../types';
import { formatEventDates } from '../utils/textFormat';
import { RegistrationCountdown } from './RegistrationCountdown';

interface RegistrationPaymentModalProps {
  tournament: Tournament | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (registration: Registration) => void;
}

export const RegistrationPaymentModal: React.FC<RegistrationPaymentModalProps> = ({
  tournament,
  isOpen,
  onClose,
  onSuccess,
}) => {
  // Wizard Steps: 1: Team & Contact Details, 2: Host Payment QR & Confirmation, 3: Success Pass
  const [step, setStep] = useState<1 | 2 | 3>(1);

  // Step 1 State: Team & Direct Contact (Removed captain redundant fields and player roster)
  const [teamName, setTeamName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactPhone, setContactPhone] = useState('');

  // Step 2 State: Host Payment QR & Verification
  const [transactionId, setTransactionId] = useState('');
  const [paymentProofFile, setPaymentProofFile] = useState<string | null>(null);
  const [copiedAccount, setCopiedAccount] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentError, setPaymentError] = useState('');

  // Step 3 State: Confirmed Registration
  const [completedRegistration, setCompletedRegistration] = useState<Registration | null>(null);
  const [joinedGroup, setJoinedGroup] = useState(false);
  const [copiedGroupLink, setCopiedGroupLink] = useState(false);

  // Fee calculation in NPR (Strictly 0 additional fees)
  const isFree = tournament ? tournament.entryFee === 0 : false;
  const totalAmount = tournament ? tournament.entryFee : 0;

  // Host QR / Payment info
  const hostPaymentMethod = tournament?.hostPaymentMethod || 'Fonepay / eSewa QR';
  const hostPaymentNumber = tournament?.hostPaymentNumber || tournament?.hostPhone || '9841234567';
  const hostPaymentInstructions = tournament?.hostPaymentInstructions || 'Please include your Squad Name in transaction remarks.';

  // Handle proof upload
  const handleProofUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      setPaymentProofFile(event.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const [copiedPassCode, setCopiedPassCode] = useState(false);
  const [copiedAllDetails, setCopiedAllDetails] = useState(false);
  const [showScreenshotTips, setShowScreenshotTips] = useState(false);

  const handleCopyAccount = () => {
    navigator.clipboard.writeText(hostPaymentNumber);
    setCopiedAccount(true);
    setTimeout(() => setCopiedAccount(false), 2000);
  };

  const handleCopyPassCode = () => {
    if (!completedRegistration) return;
    try {
      navigator.clipboard.writeText(completedRegistration.confirmationCode);
      setCopiedPassCode(true);
      setTimeout(() => setCopiedPassCode(false), 2500);
    } catch (e) {
      console.error(e);
    }
  };

  const handleCopyAllPassDetails = () => {
    if (!completedRegistration) return;
    try {
      const summary =
        `🏆 KataTira Official Match Pass\n` +
        `• Event: ${completedRegistration.tournamentTitle}\n` +
        `• Pass Code: ${completedRegistration.confirmationCode}\n` +
        `• Team / Squad: ${completedRegistration.teamName}\n` +
        `• Dates: ${datesFormatted} (${completedRegistration.tournamentTime})\n` +
        `• Venue: ${completedRegistration.tournamentLocation}, ${completedRegistration.tournamentCity}, Nepal\n` +
        `• Contact: ${completedRegistration.contactPhone}\n` +
        `• Fee: ${completedRegistration.totalAmount === 0 ? 'FREE ENTRY' : `Rs. ${completedRegistration.totalAmount.toLocaleString()}`}\n` +
        `Please present this pass code or a screenshot at venue check-in.`;
      navigator.clipboard.writeText(summary);
      setCopiedAllDetails(true);
      setTimeout(() => setCopiedAllDetails(false), 2500);
    } catch (e) {
      console.error(e);
    }
  };

  // Step 1 Validate & Proceed - Compulsory Phone Validation
  const handleProceedToPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!teamName.trim()) {
      setPaymentError('Please enter your Squad / Team Name.');
      return;
    }
    if (!contactEmail.trim()) {
      setPaymentError('Please enter your contact email address.');
      return;
    }

    // STRICT COMPULSORY PHONE CHECK
    const rawPhone = contactPhone.trim();
    if (!rawPhone) {
      setPaymentError('Phone number is compulsory. Please enter your mobile / WhatsApp number to proceed.');
      return;
    }
    const digitsOnly = rawPhone.replace(/\D/g, '');
    if (digitsOnly.length < 8) {
      setPaymentError('Please enter a valid mobile number (e.g. 98XXXXXXXX) so the tournament host can coordinate schedules and add you to WhatsApp.');
      return;
    }

    setPaymentError('');
    if (isFree) {
      handleCompleteRegistration('free');
    } else {
      setStep(2);
    }
  };

  // Step 2 Complete Registration
  const handleCompleteRegistration = (method: 'host_qr' | 'free' = 'host_qr') => {
    setIsProcessing(true);
    setPaymentError('');

    setTimeout(() => {
      setIsProcessing(false);
      const confCode = `KT-NP-${Math.floor(100000 + Math.random() * 900000)}`;

      const newRegistration: Registration = {
        id: `reg-${Date.now()}`,
        tournamentId: tournament.id,
        tournamentTitle: tournament.title,
        tournamentPoster: tournament.posterUrl,
        tournamentStartDate: tournament.startDate || tournament.date || '',
        tournamentEndDate: tournament.endDate || tournament.date || '',
        tournamentTime: tournament.time,
        tournamentLocation: tournament.location,
        tournamentCity: tournament.city,
        tournamentType: tournament.type,
        teamName: teamName.trim(),
        contactEmail: contactEmail.trim(),
        contactPhone: contactPhone.trim(),
        entryFee: tournament.entryFee,
        totalAmount,
        paymentMethod: method,
        transactionId: transactionId.trim() || undefined,
        paymentScreenshotUrl: paymentProofFile || undefined,
        paymentStatus: 'confirmed',
        registeredAt: new Date().toISOString(),
        confirmationCode: confCode,
        ticketQrCode: `KATATIRA-${confCode}-${tournament.id}`,
        whatsappGroupLink: tournament.whatsappGroupLink,
        hostName: tournament.hostName || tournament.hostOrg,
      };

      setCompletedRegistration(newRegistration);
      onSuccess(newRegistration);
      setStep(3);

      // Trigger celebration confetti
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#f59e0b', '#ea580c', '#10b981', '#3b82f6'],
        });
      } catch (err) {}
    }, 1000);
  };

  if (!isOpen || !tournament) return null;

  const datesFormatted = formatEventDates(
    tournament.startDate || tournament.date || '',
    tournament.endDate || tournament.date || '',
    tournament.bsStartDate,
    tournament.bsEndDate,
    tournament.calendarType
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 overflow-y-auto bg-black/60 backdrop-blur-sm">
      <div 
        className="relative w-full max-w-2xl rounded-2xl sm:rounded-3xl border border-slate-200 bg-white text-slate-900 shadow-2xl overflow-hidden my-auto max-h-[94vh] flex flex-col font-sans"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 bg-white px-4 sm:px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-orange-500 text-white font-bold shadow-sm">
              <Ticket className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-display text-base sm:text-lg font-bold text-slate-900 leading-tight">
                {step === 3 ? 'Registration Confirmed!' : `Register for ${tournament.title}`}
              </h2>
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <span>{tournament.type} Format</span>
                <span>•</span>
                <span>{tournament.ageGroup}</span>
                <span>•</span>
                <span className="text-orange-600 font-bold">
                  {isFree ? 'Free Entry' : `Rs. ${tournament.entryFee.toLocaleString()} (No Extra Fees)`}
                </span>
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Step Indicator (for steps 1 and 2) */}
        {step !== 3 && (
          <div className="flex items-center border-b border-slate-200 bg-slate-50 px-6 py-2.5">
            <div className="flex items-center gap-2 text-xs">
              <span
                className={`flex h-5 w-5 items-center justify-center rounded-full text-[11px] font-bold ${
                  step === 1
                    ? 'bg-orange-500 text-white'
                    : 'bg-emerald-500 text-white'
                }`}
              >
                {step > 1 ? <Check className="h-3 w-3" /> : '1'}
              </span>
              <span className={step === 1 ? 'font-bold text-slate-900' : 'text-slate-500'}>
                Team & Contact
              </span>
            </div>

            <div className="mx-3 h-px flex-1 bg-slate-200" />

            <div className="flex items-center gap-2 text-xs">
              <span
                className={`flex h-5 w-5 items-center justify-center rounded-full text-[11px] font-bold ${
                  step === 2
                    ? 'bg-orange-500 text-white'
                    : 'bg-slate-200 text-slate-500'
                }`}
              >
                2
              </span>
              <span className={step === 2 ? 'font-bold text-slate-900' : 'text-slate-500'}>
                {isFree ? 'Confirmation' : 'Host Payment QR'}
              </span>
            </div>
          </div>
        )}

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          {paymentError && (
            <div className="mb-4 flex items-center gap-2 rounded-xl bg-rose-50 border border-rose-200 p-3 text-xs font-semibold text-rose-700">
              <AlertCircle className="h-4 w-4 shrink-0 text-rose-500" />
              <span>{paymentError}</span>
            </div>
          )}

          {/* STEP 1: TEAM & DIRECT CONTACT FORM */}
          {step === 1 && (
            <form onSubmit={handleProceedToPayment} className="space-y-5">
              {/* Registration Deadline Countdown Banner */}
              {tournament.registrationDeadline && (
                <RegistrationCountdown deadline={tournament.registrationDeadline} variant="modal-banner" />
              )}
              {/* Team Name */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Squad / Team Name *
                </label>
                <input
                  type="text"
                  required
                  value={teamName}
                  onChange={(e) => setTeamName(e.target.value)}
                  placeholder="e.g. Kathmandu Kings, Lalitpur Ballers, Pokhara Thunder"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:border-orange-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-orange-500"
                />
              </div>

              {/* Contact Information */}
              <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 space-y-3.5">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  Registration Contact
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      required
                      value={contactEmail}
                      onChange={(e) => setContactEmail(e.target.value)}
                      placeholder="team@gmail.com"
                      className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm text-slate-900 focus:border-orange-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="flex items-center justify-between text-xs font-semibold text-slate-700 mb-1">
                      <span>Phone / WhatsApp <strong className="text-rose-600 font-bold">* Compulsory</strong></span>
                      <span className="text-[10px] text-orange-600 font-semibold">For WhatsApp Group Updates</span>
                    </label>
                    <input
                      type="tel"
                      required
                      value={contactPhone}
                      onChange={(e) => setContactPhone(e.target.value)}
                      placeholder="e.g. +977 9841234567"
                      className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm text-slate-900 focus:border-orange-500 focus:outline-none"
                    />
                    <p className="text-[11px] text-slate-400 mt-1">
                      Compulsory: The host will add this number to the official WhatsApp updates group for schedules and fixtures.
                    </p>
                  </div>
                </div>
              </div>

              {/* Tournament Summary & Next CTA */}
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 flex items-center justify-between">
                <div>
                  <span className="text-xs text-slate-500 block font-medium">Entry Fee:</span>
                  <span className="text-xl font-extrabold text-slate-900">
                    {isFree ? 'FREE ENTRY' : `Rs. ${totalAmount.toLocaleString()}`}
                  </span>
                  <span className="text-[10px] text-emerald-600 flex items-center gap-1 font-semibold mt-0.5">
                    <Check className="h-3 w-3" />
                    <span>Zero additional processing or platform fees</span>
                  </span>
                </div>

                <button
                  type="submit"
                  className="flex items-center gap-2 rounded-xl bg-slate-900 hover:bg-orange-500 px-6 py-2.5 text-sm font-bold text-white shadow-sm transition-all active:scale-95"
                >
                  <span>{isFree ? 'Confirm Free Registration' : 'Proceed to Host Payment'}</span>
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </form>
          )}

          {/* STEP 2: HOST PAYMENT QR CODE & VERIFICATION */}
          {step === 2 && (
            <div className="space-y-5">
              {/* Trust & Direct Payment Notice */}
              <div className="rounded-xl border border-amber-300 bg-amber-50/90 p-3.5 flex items-start gap-3 text-xs text-amber-900 shadow-2xs">
                <ShieldAlert className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                <div className="text-[11px] leading-relaxed">
                  <span className="font-bold text-amber-950">Direct Host Payment Notice: </span>
                  KataTira connects participants with tournament hosts and does not hold registration escrow. You are transferring funds directly to the organizer ({hostPaymentMethod}: {hostPaymentNumber}). Always verify tournament rules and save your transaction reference code.
                </div>
              </div>

              {/* Host QR Code Hero Box */}
              <div className="rounded-2xl border-2 border-orange-200 bg-gradient-to-br from-orange-50/60 via-white to-amber-50/60 p-5 space-y-4 text-center">
                <div className="flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-wider text-orange-700">
                  <QrCode className="h-4 w-4" />
                  <span>Host Direct Payment QR Code</span>
                </div>

                {/* QR Code Presentation */}
                <div className="mx-auto flex flex-col items-center justify-center">
                  {tournament.hostPaymentQrUrl ? (
                    <div className="p-2 bg-white rounded-2xl border border-slate-200 shadow-md">
                      <img
                        src={tournament.hostPaymentQrUrl}
                        alt="Host Payment QR Code"
                        referrerPolicy="no-referrer"
                        className="h-48 w-48 object-contain rounded-xl"
                      />
                    </div>
                  ) : (
                    <div className="h-44 w-44 rounded-2xl bg-white border-2 border-dashed border-orange-300 p-4 shadow-sm flex flex-col items-center justify-center text-slate-800">
                      <QrCode className="h-20 w-20 text-slate-900 mb-1" />
                      <span className="text-[11px] font-bold text-orange-600">{hostPaymentMethod}</span>
                      <span className="text-[10px] text-slate-500 font-mono mt-0.5">{hostPaymentNumber}</span>
                    </div>
                  )}

                  <div className="mt-3">
                    <span className="text-xs text-slate-500 block">Host Account / Payment ID:</span>
                    <div className="inline-flex items-center gap-2 mt-1 bg-white border border-slate-200 px-3 py-1.5 rounded-xl shadow-xs">
                      <span className="font-mono text-sm font-bold text-slate-900">{hostPaymentNumber}</span>
                      <button
                        type="button"
                        onClick={handleCopyAccount}
                        className="text-xs text-orange-600 hover:text-orange-700 font-bold flex items-center gap-1"
                      >
                        {copiedAccount ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                        <span>{copiedAccount ? 'Copied' : 'Copy'}</span>
                      </button>
                    </div>
                  </div>
                </div>

                <div className="text-xs text-slate-600 max-w-md mx-auto bg-white/90 p-2.5 rounded-xl border border-slate-200">
                  <span className="font-semibold text-slate-800 block">Host Instructions:</span>
                  <p className="mt-0.5 text-slate-600">{hostPaymentInstructions}</p>
                </div>
              </div>

              {/* Payment Verification / Transaction Code */}
              <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 sm:p-5 space-y-3.5">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                  Confirm Payment Details
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">
                      Transaction / Ref Code <span className="text-slate-400 font-normal">(Optional)</span>
                    </label>
                    <input
                      type="text"
                      value={transactionId}
                      onChange={(e) => setTransactionId(e.target.value)}
                      placeholder="e.g. 98A72F or eSewa TXN"
                      className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm text-slate-900 focus:border-orange-500 focus:outline-none font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">
                      Payment Screenshot / Proof <span className="text-slate-400 font-normal">(Optional)</span>
                    </label>
                    <label className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 cursor-pointer hover:bg-slate-50">
                      <span className="truncate">{paymentProofFile ? 'Screenshot Attached (Ready)' : 'Upload Receipt Screenshot'}</span>
                      <Upload className="h-4 w-4 text-orange-500 shrink-0 ml-1" />
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleProofUpload}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>
              </div>

              {/* Total Summary */}
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3.5 flex items-center justify-between text-xs">
                <div>
                  <span className="text-slate-500 block">Total Amount Paid to Host:</span>
                  <span className="text-lg font-bold text-orange-600">
                    Rs. {totalAmount.toLocaleString()}
                  </span>
                </div>
                <span className="text-slate-500 font-medium text-[11px]">
                  Team: <strong>{teamName}</strong>
                </span>
              </div>

              {/* Security & Action Buttons */}
              <div className="flex items-center justify-between gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="flex items-center gap-1.5 rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-100"
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                  <span>Back</span>
                </button>

                <button
                  type="button"
                  disabled={isProcessing}
                  onClick={() => handleCompleteRegistration('host_qr')}
                  className="flex items-center gap-2 rounded-xl bg-slate-900 hover:bg-orange-500 px-6 py-2.5 text-sm font-bold text-white shadow-sm disabled:opacity-50 transition-all active:scale-95"
                >
                  {isProcessing ? (
                    <>
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      <span>Confirming Pass...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="h-4 w-4" />
                      <span>Confirm Registration & Get Pass</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: REGISTRATION PASS & CONFIRMATION */}
          {step === 3 && completedRegistration && (
            <div className="space-y-6 text-center py-2">
              {/* Success Badge */}
              <div className="flex flex-col items-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500 text-white shadow-lg shadow-emerald-500/20 mb-3">
                  <CheckCircle2 className="h-8 w-8" />
                </div>
                <h3 className="font-display text-2xl font-bold text-slate-900">
                  Registration Confirmed!
                </h3>
                <p className="text-xs text-slate-500 mt-1 max-w-sm">
                  Your team <strong>{completedRegistration.teamName}</strong> is registered for{' '}
                  {completedRegistration.tournamentTitle}.
                </p>
              </div>

              {/* ACCOUNT-FREE SYSTEM NOTICE & SCREENSHOT RECOMMENDATION BANNER */}
              <div className="mx-auto max-w-md rounded-2xl border-2 border-amber-300 bg-gradient-to-br from-amber-50 via-orange-50/70 to-amber-100/60 p-4 sm:p-5 text-left shadow-sm space-y-3">
                <div className="flex items-start gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-500 text-white shadow-md ring-4 ring-amber-200/60">
                    <Camera className="h-6 w-6" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="inline-flex items-center gap-1 rounded-md bg-amber-200/90 px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-amber-900">
                        <Smartphone className="h-3 w-3" /> Action Recommended
                      </span>
                      <span className="text-[11px] font-bold text-amber-800">No Account Required</span>
                    </div>
                    <h4 className="font-display text-sm sm:text-base font-bold text-slate-900 mt-1">
                      Please take a photo or screenshot of this pass!
                    </h4>
                    <p className="text-xs text-slate-700 mt-1 leading-relaxed">
                      KataTira has <strong>no user accounts for participants</strong> (only event hosts log in). Your pass is stored solely in this browser. <strong>Please snap a photo or screenshot right now</strong> so you have your Pass Code, QR code, and venue details ready in your photo gallery at check-in, even if you are offline!
                    </p>
                  </div>
                </div>

                {/* Quick Action Helpers */}
                <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-amber-200/80">
                  <button
                    type="button"
                    onClick={() => setShowScreenshotTips(!showScreenshotTips)}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-amber-300 bg-white hover:bg-amber-50 px-2.5 py-1.5 text-xs font-bold text-amber-900 transition-colors shadow-2xs cursor-pointer active:scale-95"
                  >
                    <HelpCircle className="h-3.5 w-3.5 text-amber-600" />
                    <span>{showScreenshotTips ? 'Hide Screenshot Guide' : 'How to Screenshot'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => window.print()}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-amber-300 bg-white hover:bg-amber-50 px-2.5 py-1.5 text-xs font-bold text-amber-900 transition-colors shadow-2xs cursor-pointer active:scale-95"
                  >
                    <Printer className="h-3.5 w-3.5 text-amber-600" />
                    <span>Print / Save Slip</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleCopyAllPassDetails}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-amber-300 bg-white hover:bg-amber-50 px-2.5 py-1.5 text-xs font-bold text-amber-900 transition-colors shadow-2xs cursor-pointer active:scale-95"
                  >
                    {copiedAllDetails ? (
                      <>
                        <Check className="h-3.5 w-3.5 text-emerald-600" />
                        <span className="text-emerald-700">Copied Pass Info!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="h-3.5 w-3.5 text-amber-600" />
                        <span>Copy Pass Info</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Interactive Screenshot Shortcuts Tip Box */}
                {showScreenshotTips && (
                  <div className="rounded-xl bg-white/95 p-3 border border-amber-200 text-xs text-slate-700 space-y-2 animate-in fade-in slide-in-from-top-1 shadow-xs">
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

              {/* Digital Match Pass Card */}
              <div className="mx-auto max-w-md rounded-2xl border-2 border-orange-300 bg-gradient-to-br from-orange-500/10 via-white to-amber-500/10 p-5 text-left shadow-md relative overflow-hidden">
                <div className="flex items-start justify-between border-b border-dashed border-orange-200 pb-4">
                  <div>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-orange-600">
                        Official Tournament Entry Pass
                      </span>
                      <span className="inline-flex items-center gap-1 rounded bg-amber-100 px-1.5 py-0.2 text-[9px] font-extrabold text-amber-800">
                        <Camera className="h-2.5 w-2.5" /> Save Photo/Screenshot
                      </span>
                    </div>
                    <h4 className="font-display text-lg font-bold text-slate-900 line-clamp-1 mt-0.5">
                      {completedRegistration.tournamentTitle}
                    </h4>
                    <p className="text-xs text-slate-700 font-semibold mt-1">
                      Team: {completedRegistration.teamName}
                    </p>
                  </div>
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-900 text-white font-bold p-1 shrink-0">
                    <QrCode className="h-full w-full" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 py-3 text-xs">
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-bold">Match Dates</span>
                    <p className="font-bold text-slate-800">{datesFormatted}</p>
                    <p className="text-[11px] text-slate-500">{completedRegistration.tournamentTime}</p>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-bold">Venue</span>
                    <p className="font-bold text-slate-800 line-clamp-1">{completedRegistration.tournamentLocation}</p>
                    <p className="text-[11px] text-slate-500">{completedRegistration.tournamentCity}, Nepal</p>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-bold">Contact</span>
                    <p className="font-bold text-slate-800">{completedRegistration.contactPhone}</p>
                    <p className="text-[11px] text-slate-500 truncate">{completedRegistration.contactEmail}</p>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">Pass Code</span>
                    <div className="flex items-center gap-1.5">
                      <p className="font-mono font-bold text-orange-600">{completedRegistration.confirmationCode}</p>
                      <button
                        type="button"
                        onClick={handleCopyPassCode}
                        className="p-1 rounded text-slate-400 hover:text-slate-700 hover:bg-orange-100 transition-colors"
                        title="Copy confirmation code"
                      >
                        {copiedPassCode ? (
                          <Check className="h-3 w-3 text-emerald-600" />
                        ) : (
                          <Copy className="h-3 w-3 text-orange-500" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="border-t border-dashed border-orange-200 pt-3 flex items-center justify-between text-xs">
                  <span className="text-slate-500">Total Entry Fee:</span>
                  <span className="font-bold text-emerald-600 flex items-center gap-1">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    {completedRegistration.totalAmount === 0 ? 'FREE ENTRY' : `Rs. ${completedRegistration.totalAmount.toLocaleString()} (Direct Host Payment)`}
                  </span>
                </div>
              </div>

              {/* HOST WHATSAPP GROUP & COMMUNITY ANNOUNCEMENTS */}
              {(() => {
                const groupUrl = tournament.whatsappGroupLink;
                const cleanHostPhone = (tournament.hostPhone || tournament.hostPaymentNumber || '9841234567').replace(/[^\d]/g, '');
                const waRecipient = cleanHostPhone.startsWith('977')
                  ? cleanHostPhone
                  : `977${cleanHostPhone.replace(/^0/, '')}`;
                const directHostChatUrl = `https://wa.me/${waRecipient}?text=${encodeURIComponent(
                  `Namaste ${tournament.hostName || 'Host'}! Our squad "${completedRegistration.teamName}" has registered for "${completedRegistration.tournamentTitle}" (Pass ID: ${completedRegistration.confirmationCode}). Please add us to the tournament WhatsApp group.`
                )}`;

                const targetLink = groupUrl || directHostChatUrl;

                return (
                  <div className="mx-auto max-w-md rounded-2xl border-2 border-emerald-300 bg-gradient-to-br from-emerald-50 via-teal-50/50 to-white p-4 sm:p-5 text-left shadow-xs space-y-3">
                    <div className="flex items-start gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-600 text-white font-bold shadow-xs">
                        <MessageCircle className="h-5 w-5" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="inline-flex items-center rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                            Tournament WhatsApp Hub
                          </span>
                          <span className="text-[11px] font-semibold text-emerald-900">Host: {tournament.hostName}</span>
                        </div>
                        <h4 className="font-display text-sm font-bold text-slate-900 mt-1">
                          Join Host's Official WhatsApp Group
                        </h4>
                        <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">
                          Get real-time match fixture brackets, court schedule timings, and rulebook updates directly from the tournament organizers.
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-2 pt-1">
                      <a
                        href={targetLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={() => setJoinedGroup(true)}
                        className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 px-4 py-2.5 text-xs font-bold text-white shadow-xs transition-all active:scale-95"
                      >
                        <MessageCircle className="h-4 w-4" />
                        <span>{groupUrl ? 'Join WhatsApp Group' : 'Message Host on WhatsApp'}</span>
                      </a>

                      {groupUrl && (
                        <button
                          type="button"
                          onClick={() => {
                            try {
                              navigator.clipboard.writeText(groupUrl);
                              setCopiedGroupLink(true);
                              setTimeout(() => setCopiedGroupLink(false), 2500);
                            } catch (e) {
                              console.error(e);
                            }
                          }}
                          className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-emerald-300 bg-white hover:bg-emerald-50 px-3.5 py-2.5 text-xs font-bold text-emerald-800 transition-colors cursor-pointer"
                        >
                          {copiedGroupLink ? (
                            <>
                              <Check className="h-3.5 w-3.5 text-emerald-600" />
                              <span>Copied Link</span>
                            </>
                          ) : (
                            <>
                              <Copy className="h-3.5 w-3.5 text-emerald-700" />
                              <span>Copy Group Link</span>
                            </>
                          )}
                        </button>
                      )}
                    </div>

                    {joinedGroup && (
                      <div className="flex items-center gap-1.5 text-[11px] font-semibold text-emerald-800 bg-emerald-100/90 rounded-lg px-2.5 py-1.5 animate-in fade-in">
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                        <span>WhatsApp group link opened! Connect with organizers and squad participants.</span>
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* Close / Action CTAs */}
              <div className="flex flex-col items-center justify-center gap-2 pt-2">
                <button
                  onClick={onClose}
                  className="w-full sm:w-auto rounded-xl bg-slate-900 hover:bg-orange-500 px-7 py-2.5 text-xs font-bold text-white transition-all shadow-sm active:scale-95"
                >
                  Done & Back to Tournaments
                </button>
                <p className="text-[11px] text-amber-800 font-semibold flex items-center justify-center gap-1.5 text-center">
                  <Camera className="h-3.5 w-3.5 text-amber-600 shrink-0" />
                  <span>Important: Please ensure you've snapped a photo or screenshot before closing.</span>
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
