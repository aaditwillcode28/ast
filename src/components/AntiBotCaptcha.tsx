import React, { useState, useEffect } from 'react';
import { ShieldCheck, RefreshCw, CheckCircle2, Lock, AlertTriangle, Sparkles } from 'lucide-react';

interface AntiBotCaptchaProps {
  onVerify: (data: {
    isVerified: boolean;
    captchaAnswer: string;
    expectedAnswer: string;
    honeypotValue: string;
    timeElapsedMs: number;
  }) => void;
  className?: string;
}

export const AntiBotCaptcha: React.FC<AntiBotCaptchaProps> = ({ onVerify, className = '' }) => {
  const [num1, setNum1] = useState(0);
  const [num2, setNum2] = useState(0);
  const [userAnswer, setUserAnswer] = useState('');
  const [isVerified, setIsVerified] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [honeypot, setHoneypot] = useState('');
  const [mountTime] = useState<number>(() => Date.now());

  // Generate a friendly, clean mathematical puzzle
  const generateNewChallenge = () => {
    const a = Math.floor(Math.random() * 9) + 2; // 2-10
    const b = Math.floor(Math.random() * 8) + 1; // 1-8
    setNum1(a);
    setNum2(b);
    setUserAnswer('');
    setIsVerified(false);
    setErrorMessage('');
  };

  useEffect(() => {
    generateNewChallenge();
  }, []);

  const expectedAnswer = String(num1 + num2);

  const handleAnswerChange = (val: string) => {
    setUserAnswer(val);
    setErrorMessage('');

    const clean = val.trim();
    if (clean === expectedAnswer) {
      const elapsed = Date.now() - mountTime;
      setIsVerified(true);
      onVerify({
        isVerified: true,
        captchaAnswer: clean,
        expectedAnswer,
        honeypotValue: honeypot,
        timeElapsedMs: elapsed,
      });
    } else {
      setIsVerified(false);
      onVerify({
        isVerified: false,
        captchaAnswer: clean,
        expectedAnswer,
        honeypotValue: honeypot,
        timeElapsedMs: Date.now() - mountTime,
      });
    }
  };

  return (
    <div className={`rounded-2xl border border-slate-200 bg-slate-50/90 p-4 transition-all ${className}`}>
      {/* Invisible honeypot for bot traps (never visible to real users) */}
      <div style={{ display: 'none', position: 'absolute', left: '-9999px' }} aria-hidden="true">
        <label htmlFor="_kt_security_honeypot_field">Leave this field blank</label>
        <input
          type="text"
          id="_kt_security_honeypot_field"
          name="_kt_security_honeypot_field"
          tabIndex={-1}
          autoComplete="off"
          value={honeypot}
          onChange={(e) => setHoneypot(e.target.value)}
        />
      </div>

      <div className="flex items-center justify-between gap-3 mb-2.5">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-orange-100 text-orange-600">
            <Lock className="h-3.5 w-3.5" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
              <span>Security & Bot Verification</span>
              <span className="rounded bg-slate-200/80 px-1.5 py-0.2 text-[9px] font-semibold text-slate-700">
                Spam Shield
              </span>
            </h4>
            <p className="text-[11px] text-slate-500">
              Prove you're human to protect athletes & prevent spam tournament postings
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={generateNewChallenge}
          title="Get a new math challenge"
          className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-200/50 transition-colors"
        >
          <RefreshCw className="h-3.5 w-3.5" />
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        {/* Challenge Box */}
        <div className="flex items-center gap-2.5 rounded-xl border border-slate-300 bg-white px-3.5 py-2 shadow-2xs">
          <span className="text-xs font-semibold text-slate-600">Solve:</span>
          <div className="flex items-center gap-1.5 font-mono text-sm font-black tracking-wider text-slate-900 select-none bg-orange-50/70 border border-orange-200/60 px-2.5 py-0.5 rounded-lg">
            <span>{num1}</span>
            <span className="text-orange-500">+</span>
            <span>{num2}</span>
            <span className="text-slate-400">=</span>
          </div>
        </div>

        {/* Input Field */}
        <div className="relative flex-1 min-w-[130px]">
          <input
            type="number"
            inputMode="numeric"
            value={userAnswer}
            onChange={(e) => handleAnswerChange(e.target.value)}
            disabled={isVerified}
            placeholder="Type answer"
            className={`w-full rounded-xl border px-3.5 py-2 text-xs font-bold text-slate-900 placeholder:text-slate-400 focus:outline-none transition-all shadow-2xs ${
              isVerified
                ? 'border-emerald-500 bg-emerald-50/60 text-emerald-900 cursor-not-allowed'
                : 'border-slate-300 bg-white focus:border-orange-500 focus:ring-1 focus:ring-orange-500'
            }`}
          />
          {isVerified && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 text-emerald-600 font-bold text-[11px]">
              <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600 animate-in fade-in zoom-in-75 duration-200" />
              <span>Verified</span>
            </div>
          )}
        </div>
      </div>

      {isVerified ? (
        <div className="mt-2.5 flex items-center gap-1.5 text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200/80 rounded-lg px-2.5 py-1">
          <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
          <span>Human verified! Ready to post.</span>
        </div>
      ) : (
        userAnswer && !isVerified && (
          <div className="mt-2 text-[11px] font-medium text-rose-600 flex items-center gap-1">
            <AlertTriangle className="h-3.5 w-3.5" />
            <span>Not quite right. Try again or click refresh.</span>
          </div>
        )
      )}
    </div>
  );
};
