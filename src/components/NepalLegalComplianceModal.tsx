import React from 'react';
import {
  X,
  Scale,
  ShieldCheck,
  CheckCircle2,
  FileText,
  AlertTriangle,
  Building2,
  HeartHandshake,
  Landmark,
  ExternalLink
} from 'lucide-react';

interface NepalLegalComplianceModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NepalLegalComplianceModal: React.FC<NepalLegalComplianceModalProps> = ({
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl bg-white rounded-3xl shadow-2xl border border-slate-200 flex flex-col max-h-[90vh] overflow-hidden font-sans">
        {/* HEADER */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-900 text-white shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-500 text-white shadow-xs">
              <Scale className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-white tracking-tight">
                Nepal Legal Framework & Compliance Guide
              </h3>
              <p className="text-xs text-slate-300">
                Regulatory adherence under the Laws of Nepal (विद्युतीय कारोबार ऐन, २०६३ तथा राष्ट्र बैंक निर्देशन)
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* BODY */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5 bg-slate-50/50 text-xs text-slate-700">
          {/* Executive Summary Card */}
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50/80 p-4 sm:p-5 text-emerald-950 space-y-2">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
              <h4 className="font-bold text-sm text-emerald-900">
                100% Legally Compliant Intermediary Architecture
              </h4>
            </div>
            <p className="leading-relaxed text-emerald-900 text-[11px] sm:text-xs">
              KataTira operates strictly as an <strong>information marketplace & tournament directory</strong>. It adheres fully to the laws of Nepal regarding digital platforms, payment processing, consumer protection, and disaster relief campaigns.
            </p>
          </div>

          {/* 1. Electronic Transactions Act */}
          <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 shadow-xs space-y-3">
            <div className="flex items-start gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-900 text-white font-bold shrink-0">
                <FileText className="h-4 w-4 text-orange-400" />
              </div>
              <div className="flex-1">
                <h5 className="font-bold text-slate-900 text-sm">
                  1. Electronic Transactions Act, 2063 (विद्युतीय कारोबार ऐन, २०६३)
                </h5>
                <p className="text-slate-500 text-[11px] mt-0.5">
                  Intermediary Liability & Data Privacy (दफा ४४–४७)
                </p>
              </div>
            </div>
            <div className="space-y-2 pl-11 text-[11px] sm:text-xs text-slate-600 leading-relaxed">
              <p>
                • <strong>Confidentiality Protection (Section 44):</strong> Participant records (squad phone numbers, emails, transaction codes) are strictly shielded from public view behind the master passcode lock gate. Unauthorized disclosure is prohibited under Nepali cyber law.
              </p>
              <p>
                • <strong>Intermediary Platform Status:</strong> KataTira hosts event flyers and schedules published by verified organizers. In accordance with Section 46, KataTira maintains a rapid reporting and delisting system to remove unauthorized or deceptive listings upon notification.
              </p>
            </div>
          </div>

          {/* 2. NRB Payment Regulations */}
          <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 shadow-xs space-y-3">
            <div className="flex items-start gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-900 text-white font-bold shrink-0">
                <Landmark className="h-4 w-4 text-emerald-400" />
              </div>
              <div className="flex-1">
                <h5 className="font-bold text-slate-900 text-sm">
                  2. Nepal Rastra Bank (NRB) Payment & Settlement Directives 2077/2080
                </h5>
                <p className="text-slate-500 text-[11px] mt-0.5">
                  Zero Fund Escrow & Peer-to-Merchant Compliance
                </p>
              </div>
            </div>
            <div className="space-y-2 pl-11 text-[11px] sm:text-xs text-slate-600 leading-relaxed">
              <p>
                • <strong>Non-Escrow Legal Shield:</strong> Under NRB regulations, holding public money or pooling third-party entry fees in an escrow account requires a formal Payment Service Provider (PSP) license. 
              </p>
              <p>
                • <strong>KataTira's Compliant Model:</strong> KataTira <em>never holds, deposits, or pools</em> player registration fees. 100% of payments are direct peer-to-peer / peer-to-merchant transfers to the host's own official Fonepay QR, eSewa, Khalti, or bank account. KataTira charges 0% transaction commission.
              </p>
            </div>
          </div>

          {/* 3. Consumer Protection Act */}
          <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 shadow-xs space-y-3">
            <div className="flex items-start gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-900 text-white font-bold shrink-0">
                <ShieldCheck className="h-4 w-4 text-blue-400" />
              </div>
              <div className="flex-1">
                <h5 className="font-bold text-slate-900 text-sm">
                  3. Consumer Protection Act, 2075 & Muluki Civil Code, 2074
                </h5>
                <p className="text-slate-500 text-[11px] mt-0.5">
                  Organizer Liability, Prize Pool Integrity & Dispute Resolution
                </p>
              </div>
            </div>
            <div className="space-y-2 pl-11 text-[11px] sm:text-xs text-slate-600 leading-relaxed">
              <p>
                • <strong>Organizer Responsibility:</strong> Event organizers are solely liable for venue safety, match schedules, tournament rules, and disbursing cash prize pools as advertised.
              </p>
              <p>
                • <strong>Verification Due Diligence:</strong> KataTira offers a 3-step verification system (phone verification, arena booking confirmation, and PAN/identity check) to badge authentic organizers and protect participating youth and students.
              </p>
            </div>
          </div>

          {/* 4. Natural Disaster Relief Fund Law */}
          <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 shadow-xs space-y-3">
            <div className="flex items-start gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-900 text-white font-bold shrink-0">
                <HeartHandshake className="h-4 w-4 text-rose-400" />
              </div>
              <div className="flex-1">
                <h5 className="font-bold text-slate-900 text-sm">
                  4. Disaster Risk Reduction & Management Act, 2074 (विपद् जोखिम ऐन)
                </h5>
                <p className="text-slate-500 text-[11px] mt-0.5">
                  Flood Relief & Humanitarian Appeal Integrity
                </p>
              </div>
            </div>
            <div className="space-y-2 pl-11 text-[11px] sm:text-xs text-slate-600 leading-relaxed">
              <p>
                • <strong>Direct State Desks Only:</strong> KataTira does not solicit private donations into personal accounts. All charity campaigns featured (such as the Prime Minister's Disaster Relief Fund, Rastriya Banijya Bank A/C: 196000001101 and Nepal Red Cross Society) direct donors directly to recognized statutory bodies.
              </p>
            </div>
          </div>

          {/* 5. Windfall Tax Compliance Note */}
          <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 shadow-xs space-y-2">
            <h5 className="font-bold text-slate-900 text-sm">
              5. Income Tax Act, 2058 (आयकर ऐन, २०५८) — Windfall Gain Tax (आकस्मिक लाभ कर)
            </h5>
            <p className="text-slate-600 text-[11px] sm:text-xs leading-relaxed">
              Organizers awarding cash prizes are reminded of Section 88A of the Income Tax Act, 2058, which requires event hosts to deduct a 25% windfall gain tax on cash winnings where applicable under Inland Revenue Department (IRD) regulations.
            </p>
          </div>
        </div>

        {/* FOOTER */}
        <div className="px-6 py-3 border-t border-slate-200 bg-slate-50 flex items-center justify-between text-xs text-slate-500 shrink-0">
          <span className="text-[11px] text-slate-500">
            Applicable throughout the Federal Democratic Republic of Nepal
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-orange-500 text-white font-bold transition-colors shadow-2xs"
          >
            I Understand & Agree
          </button>
        </div>
      </div>
    </div>
  );
};
