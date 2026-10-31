import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Upload,
  Image as ImageIcon,
  Calendar,
  MapPin,
  CheckCircle,
  ShieldAlert,
  Eye,
  QrCode,
  Globe,
  Share2,
  HeartHandshake,
  Link as LinkIcon,
  Mail,
  ShieldCheck,
  Sparkles,
  Clock,
  RefreshCw,
  Lock,
  Bot
} from 'lucide-react';
import { Tournament, SocialLinks } from '../types';
import { DEFAULT_POSTER_FALLBACK } from '../data/mockTournaments';
import { normalizeTournamentType, normalizeAgeDivision, formatEventDates } from '../utils/textFormat';
import { NEPALI_MONTHS, convertAdToBs, formatBsDate } from '../utils/nepaliCalendar';
import { AntiBotCaptcha } from './AntiBotCaptcha';
import { isAdminAuthenticated } from '../utils/activityTracker';

interface HostTournamentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddTournament: (tournament: Tournament) => void;
  onUpdateTournament?: (tournament: Tournament) => void;
  tournamentToEdit?: Tournament | null;
  initialCategory?: string;
  isPostedByAdmin?: boolean;
}

export const HostTournamentModal: React.FC<HostTournamentModalProps> = ({
  isOpen,
  onClose,
  onAddTournament,
  onUpdateTournament,
  tournamentToEdit,
  initialCategory,
  isPostedByAdmin,
}) => {
  const [postAsAdmin, setPostAsAdmin] = useState(() => Boolean(isPostedByAdmin) || isAdminAuthenticated());
  // Form State with Nepal defaults
  const [title, setTitle] = useState('');
  const [posterUrl, setPosterUrl] = useState(DEFAULT_POSTER_FALLBACK);
  const [customPosterFile, setCustomPosterFile] = useState<string | null>(null);
  const [posterUrlInput, setPosterUrlInput] = useState('');

  // Official Link & Charity/Flood Relief
  const [officialLink, setOfficialLink] = useState('');
  const [isCharity, setIsCharity] = useState(false);
  const [hasNoSlots, setHasNoSlots] = useState(false);
  const [causeTitle, setCauseTitle] = useState("Prime Minister's Disaster Relief Fund (प्रधानमन्त्री दैवी प्रकोप उद्धार कोष)");
  const [donationLink, setDonationLink] = useState('');
  const [reliefBankDetails, setReliefBankDetails] = useState('');

  // Calendar Type: 'AD' (English) or 'BS' (Nepali Bikram Sambat)
  const [calendarType, setCalendarType] = useState<'AD' | 'BS'>('AD');
  
  // AD Dates: Default to upcoming dates (5-7 days ahead)
  const getUpcomingDateStr = (daysAhead: number) => {
    const d = new Date();
    d.setDate(d.getDate() + daysAhead);
    return d.toISOString().split('T')[0];
  };

  const [startDate, setStartDate] = useState(() => getUpcomingDateStr(7));
  const [endDate, setEndDate] = useState(() => getUpcomingDateStr(8));
  
  // BS Dates
  const [bsStartYear, setBsStartYear] = useState(2083);
  const [bsStartMonth, setBsStartMonth] = useState(7); // Kartik
  const [bsStartDay, setBsStartDay] = useState(15);
  const [bsEndYear, setBsEndYear] = useState(2083);
  const [bsEndMonth, setBsEndMonth] = useState(7);
  const [bsEndDay, setBsEndDay] = useState(16);

  const [time, setTime] = useState('09:00 AM - 05:00 PM NPT');
  const [location, setLocation] = useState('');
  const [city, setCity] = useState('Kathmandu');
  const [province, setProvince] = useState('Bagmati');
  const [stateCountry, setStateCountry] = useState('Bagmati, Nepal');
  const [registrationDeadline, setRegistrationDeadline] = useState(() => getUpcomingDateStr(5));
  const [activeModalTab, setActiveModalTab] = useState<'form' | 'preview'>('form');

  // Category selection with 'Other' option
  const [categorySelect, setCategorySelect] = useState<string>(initialCategory || 'Football');
  const [customCategory, setCustomCategory] = useState('');

  useEffect(() => {
    if (initialCategory && isOpen) {
      setCategorySelect(initialCategory);
    }
  }, [initialCategory, isOpen]);

  // Format selection with 'Other' option
  const [formatSelect, setFormatSelect] = useState<string>('7v7 Knockout');
  const [customFormat, setCustomFormat] = useState('');

  // Age / Eligibility selection with 'Other' option
  const [ageSelect, setAgeSelect] = useState<string>('College/University');
  const [customAge, setCustomAge] = useState('');

  const [entryFee, setEntryFee] = useState<number | string>('');
  const [prizePool, setPrizePool] = useState('Rs. 50,000 Cash + Championship Trophy & Certificates');
  
  // Total teams is completely optional — empty string means open / unconstrained
  const [totalTeams, setTotalTeams] = useState<number | string>('');
  const [audienceAdmission, setAudienceAdmission] = useState('Free for spectators');
  
  // Description is optional
  const [description, setDescription] = useState('');

  // Host Details
  const [hostName, setHostName] = useState('');
  const [hostOrg, setHostOrg] = useState('');
  const [hostEmail, setHostEmail] = useState('');
  const [hostPhone, setHostPhone] = useState('');
  const [hostPhoneSecondary, setHostPhoneSecondary] = useState('');

  // Host Payment Source & QR Code
  const [hasPaymentQr, setHasPaymentQr] = useState<boolean>(true);
  const [hostPaymentMethod, setHostPaymentMethod] = useState<'Fonepay QR' | 'eSewa' | 'Khalti' | 'Bank Transfer'>('Fonepay QR');
  const [hostPaymentNumber, setHostPaymentNumber] = useState('');
  const [hostPaymentInstructions, setHostPaymentInstructions] = useState('');
  const [hostQrFile, setHostQrFile] = useState<string | null>(null);

  // Social Media Links
  const [instagram, setInstagram] = useState('');
  const [facebook, setFacebook] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [website, setWebsite] = useState('');
  const [whatsappGroupLink, setWhatsappGroupLink] = useState('');

  // Auto-Fill Scanner state with realistic 45-60s timer & manual fallback
  const [isAnalyzingPoster, setIsAnalyzingPoster] = useState(false);
  const [aiSuccessMessage, setAiSuccessMessage] = useState<string | null>(null);
  const [scanStepIndex, setScanStepIndex] = useState(0);
  const [scanProgress, setScanProgress] = useState(10);
  const [scanElapsedSeconds, setScanElapsedSeconds] = useState(0);
  const abortControllerRef = useRef<AbortController | null>(null);

  const SCAN_STAGES = [
    'Scanning flyer typography & title...',
    'Detecting event dates & schedule...',
    'Locating venue, city & Nepal province...',
    'Extracting entry fee & prize pool...',
    'Reading organizer contact numbers...',
    'Auto-filling tournament details...',
  ];

  // Pre-populate fields when editing an existing event
  useEffect(() => {
    if (tournamentToEdit && isOpen) {
      setTitle(tournamentToEdit.title || '');
      setPosterUrl(tournamentToEdit.posterUrl || DEFAULT_POSTER_FALLBACK);
      setCustomPosterFile(null);
      setOfficialLink(tournamentToEdit.officialLink || '');
      setIsCharity(Boolean(tournamentToEdit.isCharity));
      setHasNoSlots(Boolean(tournamentToEdit.hasNoSlots));
      setCauseTitle(tournamentToEdit.causeTitle || "Prime Minister's Disaster Relief Fund (प्रधानमन्त्री दैवी प्रकोप उद्धार कोष)");
      setDonationLink(tournamentToEdit.donationLink || '');
      setReliefBankDetails(tournamentToEdit.reliefBankDetails || '');
      setCalendarType(tournamentToEdit.calendarType || 'AD');
      setStartDate(tournamentToEdit.startDate || tournamentToEdit.date || getUpcomingDateStr(7));
      setEndDate(tournamentToEdit.endDate || tournamentToEdit.startDate || tournamentToEdit.date || getUpcomingDateStr(8));
      setTime(tournamentToEdit.time || '09:00 AM - 05:00 PM NPT');
      setLocation(tournamentToEdit.location || '');
      setCity(tournamentToEdit.city || 'Kathmandu');
      setProvince(tournamentToEdit.province || 'Bagmati');
      setRegistrationDeadline(tournamentToEdit.registrationDeadline || getUpcomingDateStr(5));
      setCategorySelect(tournamentToEdit.category || 'Football');
      setFormatSelect(tournamentToEdit.type || '7v7 Knockout');
      setAgeSelect(tournamentToEdit.ageGroup || 'College/University');
      setEntryFee(tournamentToEdit.entryFee ?? 0);
      setPrizePool(tournamentToEdit.prizePool || '');
      setTotalTeams(tournamentToEdit.totalTeams !== undefined && tournamentToEdit.totalTeams !== null && tournamentToEdit.totalTeams > 0 ? tournamentToEdit.totalTeams : '');
      setAudienceAdmission(tournamentToEdit.audienceAdmission || 'Free for spectators');
      setDescription(tournamentToEdit.description || '');
      setHostName(tournamentToEdit.hostName || '');
      setHostOrg(tournamentToEdit.hostOrg || '');
      setHostEmail(tournamentToEdit.hostEmail || '');
      setHostPhone(tournamentToEdit.hostPhone || '');
      setHostPhoneSecondary(tournamentToEdit.hostPhoneSecondary || tournamentToEdit.secondaryPhone || '');
      setHasPaymentQr(Boolean(tournamentToEdit.hostPaymentQrUrl || tournamentToEdit.hostPaymentMethod));
      if (tournamentToEdit.hostPaymentMethod) {
        setHostPaymentMethod(tournamentToEdit.hostPaymentMethod as any);
      }
      setHostPaymentNumber(tournamentToEdit.hostPaymentNumber || '');
      setHostPaymentInstructions(tournamentToEdit.hostPaymentInstructions || '');
      setHostQrFile(tournamentToEdit.hostPaymentQrUrl || null);
      if (tournamentToEdit.socialLinks) {
        setInstagram(tournamentToEdit.socialLinks.instagram || '');
        setFacebook(tournamentToEdit.socialLinks.facebook || '');
        setWhatsapp(tournamentToEdit.socialLinks.whatsapp || '');
        setWebsite(tournamentToEdit.socialLinks.website || '');
      }
      setWhatsappGroupLink(tournamentToEdit.whatsappGroupLink || '');
      setPostAsAdmin(Boolean(tournamentToEdit.postedByAdmin));
      setIsOrganizerCertified(true);
      setCaptchaData(prev => ({ ...prev, isVerified: true }));
    }
  }, [tournamentToEdit, isOpen]);

  // Scanner progression tracking real elapsed time honestly
  useEffect(() => {
    if (!isAnalyzingPoster) {
      setScanStepIndex(0);
      setScanProgress(5);
      setScanElapsedSeconds(0);
      return;
    }

    const stepInterval = setInterval(() => {
      setScanStepIndex((prev) => (prev + 1) % SCAN_STAGES.length);
    }, 3500);

    const timerInterval = setInterval(() => {
      setScanElapsedSeconds((prev) => {
        const next = prev + 1;
        // Asymptotic progress towards 95% that never falsely claims completion early
        // Starts responsive, then reflects genuine wait time without fake 100%
        const pct = Math.min(95, Math.max(5, Math.round(95 * (1 - Math.exp(-next / 40)))));
        setScanProgress(pct);
        return next;
      });
    }, 1000);

    return () => {
      clearInterval(stepInterval);
      clearInterval(timerInterval);
    };
  }, [isAnalyzingPoster]);

  // Anti-Bot and Anti-Scam Security State
  const [captchaData, setCaptchaData] = useState<{
    isVerified: boolean;
    captchaAnswer: string;
    expectedAnswer: string;
    honeypotValue: string;
    timeElapsedMs: number;
  }>({
    isVerified: false,
    captchaAnswer: '',
    expectedAnswer: '',
    honeypotValue: '',
    timeElapsedMs: 0,
  });
  const [isOrganizerCertified, setIsOrganizerCertified] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Compute normalized category, format & age (auto-format e.g. 3V3 -> 3v3, u-8 -> U-8)
  const effectiveCategory = categorySelect === 'Other' ? customCategory.trim() || 'Custom' : categorySelect;
  const effectiveFormat = normalizeTournamentType(
    formatSelect === 'Other' ? customFormat.trim() || 'Custom' : formatSelect
  );
  const effectiveAge = normalizeAgeDivision(
    ageSelect === 'Other' ? customAge.trim() || 'Custom' : ageSelect
  );

  // Formatted BS string
  const bsStartDateStr = formatBsDate(bsStartYear, bsStartMonth, bsStartDay);
  const bsEndDateStr = formatBsDate(bsEndYear, bsEndMonth, bsEndDay);

  // Helper to downscale and compress high-res mobile photos to fast, lightweight web image
  const compressImageFile = (file: File, maxDim = 1200, quality = 0.82): Promise<string> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const rawUrl = e.target?.result as string;
        const img = new Image();
        img.onload = () => {
          let { width, height } = img;
          if (width > maxDim || height > maxDim) {
            if (width > height) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            } else {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            resolve(rawUrl);
            return;
          }
          ctx.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL('image/jpeg', quality));
        };
        img.onerror = () => resolve(rawUrl);
        img.src = rawUrl;
      };
      reader.onerror = () => resolve('');
      reader.readAsDataURL(file);
    });
  };

  const handleSkipAndFillManually = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsAnalyzingPoster(false);
    setAiSuccessMessage(null);
  };

  // AI Multimodal Poster Analysis (Automatic Form Population with Full Editability)
  const analyzePosterWithAi = async (dataUrl: string) => {
    if (!dataUrl) return;
    const controller = new AbortController();
    abortControllerRef.current = controller;
    setIsAnalyzingPoster(true);
    setScanElapsedSeconds(0);
    setAiSuccessMessage(null);
    setErrorMsg('');

    try {
      const res = await fetch('/api/analyze-poster', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          imageBase64: dataUrl,
          mimeType: dataUrl.startsWith('data:image/png') ? 'image/png' : 'image/jpeg',
        }),
      });

      if (!res.ok) {
        throw new Error('Poster analysis service currently unavailable.');
      }

      const json = await res.json();
      if (!json.success || !json.data) {
        throw new Error(json.error || 'Could not parse poster details.');
      }

      const d = json.data;
      let count = 0;

      // 1. Title
      if (d.title && typeof d.title === 'string' && d.title.trim()) {
        setTitle(d.title.trim());
        count++;
      }

      // 2. Category
      if (d.category && typeof d.category === 'string') {
        const catMap: { [key: string]: string } = {
          'football': 'Football',
          'futsal': 'Football',
          'soccer': 'Football',
          'basketball': 'Basketball',
          'mun': 'MUN & Debate',
          'debate': 'MUN & Debate',
          'quiz': 'Quiz',
          'esports': 'Esports',
          'gaming': 'Esports',
          'case competition': 'Case Competition',
          'hackathon': 'Other',
          'cultural': 'Cultural',
          'charity': 'Charity & Relief',
          'relief': 'Charity & Relief',
        };
        const lower = d.category.toLowerCase();
        let matched = '';
        for (const [k, v] of Object.entries(catMap)) {
          if (lower.includes(k)) {
            matched = v;
            break;
          }
        }
        if (matched) {
          setCategorySelect(matched);
        } else {
          setCategorySelect('Other');
          setCustomCategory(d.category);
        }
        count++;
      }

      // 3. Format / Type
      if (d.format && typeof d.format === 'string' && d.format.trim()) {
        const stdFormats = ['7v7 Knockout', '5v5 Futsal', 'League & Knockout', '3v3 Basketball', 'Single Elimination', 'Group Stage + Knockout', 'Open Knockout'];
        const found = stdFormats.find(f => f.toLowerCase().includes(d.format.toLowerCase()));
        if (found) {
          setFormatSelect(found);
        } else {
          setFormatSelect('Other');
          setCustomFormat(d.format.trim());
        }
        count++;
      }

      // 4. Age Division / Eligibility
      if (d.ageGroup && typeof d.ageGroup === 'string' && d.ageGroup.trim()) {
        const stdAges = ['Open', 'College/University', 'High School', 'U-19', 'U-16', 'U-14'];
        const found = stdAges.find(a => a.toLowerCase() === d.ageGroup.toLowerCase());
        if (found) {
          setAgeSelect(found);
        } else {
          setAgeSelect('Other');
          setCustomAge(d.ageGroup.trim());
        }
        count++;
      }

      // 5. Venue / Location & City
      if (d.location && typeof d.location === 'string' && d.location.trim()) {
        setLocation(d.location.trim());
        count++;
      }
      if (d.city && typeof d.city === 'string' && d.city.trim()) {
        setCity(d.city.trim());
        count++;
      }
      if (d.province && typeof d.province === 'string' && d.province.trim()) {
        const provs = ['Bagmati', 'Gandaki', 'Koshi', 'Lumbini', 'Madhesh', 'Karnali', 'Sudurpashchim'];
        const found = provs.find(p => p.toLowerCase().includes(d.province.toLowerCase()));
        if (found) setProvince(found);
      }

      // 6. Calendar Type & Dates
      if (d.calendarType === 'BS') {
        setCalendarType('BS');
      } else if (d.calendarType === 'AD') {
        setCalendarType('AD');
      }

      if (d.startDate && typeof d.startDate === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(d.startDate)) {
        setStartDate(d.startDate);
        if (d.endDate && typeof d.endDate === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(d.endDate)) {
          setEndDate(d.endDate);
        } else {
          setEndDate(d.startDate);
        }
        count++;
      }

      // 7. Time
      if (d.time && typeof d.time === 'string' && d.time.trim()) {
        setTime(d.time.trim());
      }

      // 8. Entry Fee
      if (d.entryFee !== undefined && d.entryFee !== null) {
        const numFee = Number(d.entryFee);
        if (!isNaN(numFee) && numFee >= 0) {
          setEntryFee(numFee);
          count++;
        }
      }

      // 9. Prize Pool
      if (d.prizePool && typeof d.prizePool === 'string' && d.prizePool.trim()) {
        setPrizePool(d.prizePool.trim());
        count++;
      }

      // 10. Max Teams
      if (d.totalTeams && Number(d.totalTeams) > 0) {
        setTotalTeams(Number(d.totalTeams));
      }

      // 11. Host Organizers & Contact Phone(s)
      if (d.hostName && typeof d.hostName === 'string' && d.hostName.trim()) {
        setHostName(d.hostName.trim());
        count++;
      }
      if (d.hostOrg && typeof d.hostOrg === 'string' && d.hostOrg.trim()) {
        setHostOrg(d.hostOrg.trim());
        count++;
      }
      if (d.hostPhone && typeof d.hostPhone === 'string' && d.hostPhone.trim()) {
        setHostPhone(d.hostPhone.trim());
        count++;
      }
      if (d.hostPhoneSecondary && typeof d.hostPhoneSecondary === 'string' && d.hostPhoneSecondary.trim()) {
        setHostPhoneSecondary(d.hostPhoneSecondary.trim());
        count++;
      }
      if (d.hostEmail && typeof d.hostEmail === 'string' && d.hostEmail.trim()) {
        setHostEmail(d.hostEmail.trim());
      }

      // 12. Deadline & Description & Links
      if (d.registrationDeadline && typeof d.registrationDeadline === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(d.registrationDeadline)) {
        setRegistrationDeadline(d.registrationDeadline);
      }
      if (d.description && typeof d.description === 'string' && d.description.trim()) {
        setDescription(d.description.trim());
      }
      if (d.officialLink && typeof d.officialLink === 'string' && d.officialLink.trim()) {
        setOfficialLink(d.officialLink.trim());
      }

      setScanProgress(100);
      setAiSuccessMessage(`Auto-filled ${count} fields directly from your flyer! All information is fully editable below before publishing.`);
    } catch (err: any) {
      if (err.name === 'AbortError') {
        return;
      }
      console.warn('Auto-fill poster scan notice:', err);
    } finally {
      setIsAnalyzingPoster(false);
      abortControllerRef.current = null;
    }
  };

  // Handle file upload for poster/pamphlet
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setErrorMsg('Please upload a valid image file (.png, .jpg, .webp).');
      return;
    }

    if (file.size > 15 * 1024 * 1024) {
      setErrorMsg('Poster image should be under 15MB.');
      return;
    }

    try {
      // 1. High-res version for preview and tournament feed (1200px)
      const displayDataUrl = await compressImageFile(file, 1200, 0.82);
      if (displayDataUrl) {
        setCustomPosterFile(displayDataUrl);
        setPosterUrl(displayDataUrl);
        setErrorMsg('');
        // 2. Ultra-compact version for AI vision (~60KB payload, fast network transfer & rapid model tokenization)
        const fastVisionPayload = await compressImageFile(file, 750, 0.65);
        analyzePosterWithAi(fastVisionPayload || displayDataUrl);
      }
    } catch {
      setErrorMsg('Could not process image file. Please try another image.');
    }
  };

  // Handle Host Payment QR code upload
  const handleQrUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const optimizedQr = await compressImageFile(file, 800, 0.85);
      if (optimizedQr) {
        setHostQrFile(optimizedQr);
      }
    } catch {}
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      setErrorMsg('Please provide a tournament title.');
      return;
    }

    // STRICT COMPULSORY PHONE CHECK & NEPAL FORMAT
    if (!hostPhone.trim()) {
      setErrorMsg('Organizer contact phone number is compulsory. Please enter your mobile or WhatsApp number.');
      return;
    }
    const digitsOnly = hostPhone.trim().replace(/\D/g, '');
    if (digitsOnly.length < 8) {
      setErrorMsg('Please enter a valid mobile number (at least 8-10 digits) for tournament coordination.');
      return;
    }
    if (digitsOnly.length === 10 && !digitsOnly.startsWith('98') && !digitsOnly.startsWith('97') && !digitsOnly.startsWith('01')) {
      setErrorMsg('Please enter a standard Nepal phone number (starting with 98 or 97, or 01 landline).');
      return;
    }

    // Secondary phone validation if provided
    if (hostPhoneSecondary.trim()) {
      const secDigits = hostPhoneSecondary.trim().replace(/\D/g, '');
      if (secDigits.length < 7) {
        setErrorMsg('Please enter a valid secondary phone number or leave the field blank.');
        return;
      }
    }

    // Anti-Bot & Authenticity check for fresh submissions (bypassable when editing by verified admin/organizer)
    if (!tournamentToEdit && !postAsAdmin) {
      if (!captchaData.isVerified) {
        setErrorMsg('Please solve the security challenge below to verify you are a human.');
        return;
      }

      if (!isOrganizerCertified) {
        setErrorMsg('Please check the Organizer Authenticity & Scam Shield certification box before publishing.');
        return;
      }
    }

    setErrorMsg('');
    setIsSubmitting(true);

    // Server-Side Security Check for new submissions
    if (!tournamentToEdit && !postAsAdmin) {
      try {
        const secRes = await fetch('/api/security/verify-submission', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            captchaAnswer: captchaData.captchaAnswer,
            expectedAnswer: captchaData.expectedAnswer,
            honeypot: captchaData.honeypotValue,
            timeElapsedMs: captchaData.timeElapsedMs,
            title: title.trim(),
            description: description.trim(),
            phone: hostPhone.trim(),
          }),
        });

        const secJson = await secRes.json();
        if (!secJson.success) {
          setErrorMsg(secJson.message || 'Security verification failed.');
          setIsSubmitting(false);
          return;
        }
      } catch (secErr) {
        console.warn('Security verify network notice:', secErr);
      }
    }

    setTimeout(() => {
      const socialLinks: SocialLinks = {};
      if (instagram.trim()) socialLinks.instagram = instagram.trim().startsWith('http') ? instagram.trim() : `https://instagram.com/${instagram.trim().replace(/^@/, '')}`;
      if (facebook.trim()) socialLinks.facebook = facebook.trim().startsWith('http') ? facebook.trim() : `https://facebook.com/${facebook.trim()}`;
      if (whatsapp.trim()) socialLinks.whatsapp = whatsapp.trim();
      if (website.trim()) socialLinks.website = website.trim().startsWith('http') ? website.trim() : `https://${website.trim()}`;

      const savedTournament: Tournament = {
        ...(tournamentToEdit || {}),
        id: tournamentToEdit ? tournamentToEdit.id : `kt-${Date.now()}`,
        title: title.trim(),
        category: isCharity ? 'Charity & Relief' : effectiveCategory,
        posterUrl: posterUrl,
        startDate: startDate,
        endDate: endDate || startDate,
        calendarType,
        bsStartDate: calendarType === 'BS' ? bsStartDateStr : convertAdToBs(startDate).bsDateStr,
        bsEndDate: calendarType === 'BS' ? bsEndDateStr : convertAdToBs(endDate || startDate).bsDateStr,
        date: startDate,
        time: time.trim() || '09:00 AM - 05:00 PM NPT',
        registrationDeadline: registrationDeadline.trim() ? registrationDeadline.trim() : (endDate || startDate),
        location: location.trim() || 'Venue TBA / Online',
        city: city.trim() || 'Nepal',
        province: province,
        stateCountry: `${province}, Nepal`,
        type: isCharity ? (effectiveFormat || 'Flood Relief / Charity') : (effectiveFormat || 'Open Format'),
        entryFee: Number(entryFee) || 0,
        ageGroup: effectiveAge || 'Open',
        prizePool: (isCharity || hasNoSlots) ? (prizePool.trim() || 'Direct Emergency Aid & Community Rehabilitation') : (prizePool.trim() || 'Trophy & Certificates'),
        hasNoSlots: hasNoSlots || isCharity || totalTeams === '' || Number(totalTeams) === 0,
        isReliefFund: isCharity || effectiveCategory === 'Charity & Relief',
        totalTeams: (hasNoSlots || isCharity || totalTeams === '') ? 0 : (Number(totalTeams) > 0 ? Number(totalTeams) : 0),
        registeredTeamsCount: tournamentToEdit ? (tournamentToEdit.registeredTeamsCount || 0) : 0,
        postedByAdmin: Boolean(isPostedByAdmin || postAsAdmin || tournamentToEdit?.postedByAdmin),
        hostVerificationType: (isPostedByAdmin || postAsAdmin || tournamentToEdit?.postedByAdmin) ? 'admin' : tournamentToEdit?.hostVerificationType,
        hostName: hostName.trim() || 'Lead Organizer',
        hostOrg: hostOrg.trim() || undefined,
        hostEmail: hostEmail.trim() || 'organizer@katatira.np',
        hostPhone: hostPhone.trim(),
        hostPhoneSecondary: hostPhoneSecondary.trim() || undefined,
        secondaryPhone: hostPhoneSecondary.trim() || undefined,
        description: description.trim() ? description.trim() : undefined,
        audienceAdmission,
        officialLink: officialLink.trim() ? (officialLink.trim().startsWith('http') ? officialLink.trim() : `https://${officialLink.trim()}`) : undefined,
        isCharity,
        causeTitle: isCharity ? causeTitle.trim() : undefined,
        donationLink: isCharity && donationLink.trim() ? (donationLink.trim().startsWith('http') ? donationLink.trim() : `https://${donationLink.trim()}`) : undefined,
        reliefBankDetails: isCharity && reliefBankDetails.trim() ? reliefBankDetails.trim() : undefined,
        hostPaymentQrUrl: hostQrFile || undefined,
        hostPaymentMethod: hasPaymentQr ? hostPaymentMethod : undefined,
        hostPaymentNumber: hostPaymentNumber.trim() || (hasPaymentQr ? hostPhone.trim() : undefined),
        hostPaymentInstructions: hostPaymentInstructions.trim() || undefined,
        socialLinks: Object.keys(socialLinks).length > 0 ? socialLinks : undefined,
        whatsappGroupLink: whatsappGroupLink.trim() || undefined,
        createdAt: tournamentToEdit ? tournamentToEdit.createdAt : new Date().toISOString(),
      };

      if (tournamentToEdit && onUpdateTournament) {
        onUpdateTournament(savedTournament);
      } else {
        onAddTournament(savedTournament);
      }
      setIsSubmitting(false);
      onClose();
    }, 350);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 overflow-y-auto bg-black/60 backdrop-blur-sm">
      <div 
        className="relative w-full max-w-5xl rounded-2xl sm:rounded-3xl border border-slate-200 bg-white text-slate-900 shadow-2xl overflow-hidden my-auto max-h-[94vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 bg-white px-4 sm:px-6 py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-orange-500 text-white font-black text-base shadow-sm">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-display text-lg sm:text-xl font-bold text-slate-900 leading-tight">
                {tournamentToEdit ? 'Edit Tournament Details' : 'Host an Event or Tournament in Nepal'}
              </h2>
              <p className="text-xs text-slate-500">
                {tournamentToEdit ? 'Update details, schedule, prize pool or contact phone' : 'Publish sports tournaments, futsal, basketball, MUNs, quizzes, and relief drives in Nepal'}
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

        {/* Navigation Tabs: Form vs Live Card Preview (Draft Mode) */}
        <div className="flex border-b border-slate-200 bg-slate-50/80 px-4 sm:px-6">
          <button
            type="button"
            onClick={() => setActiveModalTab('form')}
            className={`py-3 px-4 text-xs font-bold transition-all border-b-2 flex items-center gap-2 ${
              activeModalTab === 'form'
                ? 'border-orange-500 text-orange-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <span>1. Edit Event Details</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveModalTab('preview')}
            className={`py-3 px-4 text-xs font-bold transition-all border-b-2 flex items-center gap-2 ${
              activeModalTab === 'preview'
                ? 'border-orange-500 text-orange-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Eye className="h-3.5 w-3.5" />
            <span>2. Live Card Preview & Quality Check</span>
            <span className="rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold px-1.5 py-0.5">
              Attendee View
            </span>
          </button>
        </div>

        {/* HIGH-VISIBILITY SUCCESS NOTIFICATION (100% Editable) */}
        {aiSuccessMessage && !isAnalyzingPoster && (
          <div className="mx-4 sm:mx-6 mt-4 rounded-2xl bg-gradient-to-r from-emerald-950 via-slate-900 to-emerald-950 border-2 border-emerald-500/90 p-4 shadow-xl shadow-emerald-500/25 text-white flex items-start justify-between gap-3 animate-in zoom-in-95 duration-200">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500 text-white shadow-md shadow-emerald-500/30 mt-0.5">
                <CheckCircle className="h-5 w-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="font-display font-bold text-sm text-emerald-300 flex items-center gap-1.5">
                    <span>✨ Tournament Details Auto-Filled</span>
                  </h4>
                  <span className="rounded-full bg-emerald-500/20 border border-emerald-500/40 px-2 py-0.5 text-[10px] font-bold text-emerald-300">
                    100% Editable
                  </span>
                </div>
                <p className="text-xs text-slate-200 mt-1">
                  {aiSuccessMessage}
                </p>
                <p className="text-[11px] text-emerald-400/90 mt-0.5">
                  ✎ Review any pre-filled field below and freely modify dates, rules, or prizes before publishing.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setAiSuccessMessage(null)}
              className="rounded-lg bg-white/10 hover:bg-white/20 px-3 py-1.5 text-xs font-bold text-white transition-colors shrink-0"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Error notification */}
        {errorMsg && (
          <div className="mx-6 mt-4 flex items-center gap-2 rounded-xl bg-rose-50 border border-rose-200 p-3 text-xs font-semibold text-rose-700">
            <ShieldAlert className="h-4 w-4 shrink-0 text-rose-500" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* LIVE CARD PREVIEW TAB */}
        {activeModalTab === 'preview' ? (
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
            <div className="rounded-2xl bg-gradient-to-r from-orange-500/10 via-amber-500/10 to-transparent p-4 border border-orange-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="font-display font-bold text-sm text-slate-900 flex items-center gap-1.5">
                  <Eye className="h-4 w-4 text-orange-500" />
                  <span>Real-Time Attendee Feed Preview</span>
                </h3>
                <p className="text-xs text-slate-600 mt-0.5">
                  Review your event card before publishing. Verify that your poster is legible, dates are accurate, and your contact phone is reachable.
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setActiveModalTab('form')}
                  className="rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-all"
                >
                  Edit Details
                </button>
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="rounded-xl bg-orange-500 hover:bg-orange-600 px-4 py-2 text-xs font-bold text-white shadow-xs transition-all active:scale-95 disabled:opacity-50"
                >
                  {isSubmitting ? (tournamentToEdit ? 'Saving...' : 'Publishing...') : (tournamentToEdit ? 'Save Changes' : 'Looks Good • Publish Live')}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
              {/* Card Preview (5 cols) */}
              <div className="md:col-span-6 lg:col-span-5 mx-auto w-full max-w-sm">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-2 text-center">
                  Feed Card Simulation
                </span>
                <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-lg pointer-events-none">
                  {/* Poster image */}
                  <div className="relative aspect-[16/10] w-full overflow-hidden bg-slate-900">
                    <img
                      src={posterUrl}
                      alt="Preview poster"
                      className="h-full w-full object-cover object-center"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/30 to-transparent" />
                    <div className="absolute top-3 left-3 right-3 flex items-center justify-between">
                      <span className="rounded-lg bg-slate-950/90 px-2.5 py-1 text-xs font-bold text-white border border-white/20">
                        {isCharity ? 'Charity & Relief' : effectiveCategory}
                      </span>
                      <span className="rounded-lg bg-slate-900/80 px-2 py-0.5 text-[10px] font-bold text-slate-200">
                        {province}
                      </span>
                    </div>
                    <div className="absolute bottom-3 left-3 right-3 space-y-1">
                      <h4 className="font-display text-base font-bold text-white line-clamp-1">
                        {title.trim() || 'Untitled Tournament / Event'}
                      </h4>
                      <p className="text-xs text-slate-300 font-medium">
                        By {hostOrg.trim() || 'Event Organization'}
                      </p>
                    </div>
                  </div>

                  {/* Body details */}
                  <div className="p-4 space-y-2 text-xs text-slate-600">
                    <div className="flex items-center gap-2 font-bold text-slate-800">
                      <Calendar className="h-4 w-4 text-orange-500" />
                      <span>
                        {calendarType === 'BS'
                          ? `${bsStartDateStr} – ${bsEndDateStr}`
                          : formatEventDates(startDate, endDate)}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-orange-500 shrink-0" />
                      <span className="line-clamp-1">{location || 'Venue Court'}, {city}, {province}</span>
                    </div>

                    <div className="grid grid-cols-3 gap-1.5 rounded-lg bg-slate-50 p-2 text-center text-xs border border-slate-200">
                      <div>
                        <span className="text-[9px] text-slate-400 block font-bold">FORMAT</span>
                        <span className="font-bold text-orange-600 truncate block">{effectiveFormat}</span>
                      </div>
                      <div>
                        <span className="text-[9px] text-slate-400 block font-bold">DIVISION</span>
                        <span className="font-bold text-slate-800 truncate block">{effectiveAge}</span>
                      </div>
                      <div>
                        <span className="text-[9px] text-slate-400 block font-bold">ENTRY</span>
                        <span className="font-bold text-slate-900 truncate block">
                          {entryFee === '' || Number(entryFee) === 0 ? 'FREE' : `Rs. ${Number(entryFee).toLocaleString()}`}
                        </span>
                      </div>
                    </div>

                    <div className="rounded-lg bg-amber-50 p-2 text-amber-800 border border-amber-200/80 flex items-center gap-2">
                      <Sparkles className="h-3.5 w-3.5 text-amber-600 shrink-0" />
                      <span className="truncate font-semibold">{prizePool}</span>
                    </div>

                    <div className="pt-1">
                      <div className="w-full rounded-xl bg-slate-900 py-2.5 text-center text-xs font-bold text-white">
                        View Details & Register
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Quality Checklist & Trust Signals (7 cols) */}
              <div className="md:col-span-6 lg:col-span-7 space-y-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                  Organizer Quality & Trust Checklist
                </h4>

                <div className="space-y-3">
                  <div className="flex items-start gap-3 rounded-xl border border-slate-200 bg-white p-3.5 shadow-2xs">
                    <CheckCircle className={`h-5 w-5 shrink-0 mt-0.5 ${title.trim().length >= 5 ? 'text-emerald-500' : 'text-amber-500'}`} />
                    <div>
                      <h5 className="font-bold text-xs text-slate-900">Event Title & Category</h5>
                      <p className="text-[11px] text-slate-500">
                        {title.trim().length >= 5 ? `"${title.trim()}" looks descriptive and ready.` : 'Title is too short or empty.'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 rounded-xl border border-slate-200 bg-white p-3.5 shadow-2xs">
                    <CheckCircle className={`h-5 w-5 shrink-0 mt-0.5 ${location.trim() && city.trim() ? 'text-emerald-500' : 'text-rose-500'}`} />
                    <div>
                      <h5 className="font-bold text-xs text-slate-900">Venue & Province in Nepal</h5>
                      <p className="text-[11px] text-slate-500">
                        {location.trim() && city.trim() ? `${location}, ${city} (${province} Province)` : 'Please fill out venue name and city in Nepal.'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 rounded-xl border border-slate-200 bg-white p-3.5 shadow-2xs">
                    <CheckCircle className={`h-5 w-5 shrink-0 mt-0.5 ${hostPhone.trim().length >= 8 ? 'text-emerald-500' : 'text-rose-500'}`} />
                    <div>
                      <h5 className="font-bold text-xs text-slate-900">Direct Organizer WhatsApp / Phone</h5>
                      <p className="text-[11px] text-slate-500">
                        {hostPhone.trim().length >= 8 ? `${hostPhone} (Will receive registration alerts & WhatsApp queries)` : 'Compulsory mobile phone number missing.'}
                      </p>
                    </div>
                  </div>

                  {postAsAdmin ? (
                    <div className="flex items-start gap-3 rounded-xl border border-slate-900 bg-slate-900 p-3.5 text-white">
                      <ShieldCheck className="h-5 w-5 shrink-0 text-orange-400 mt-0.5" />
                      <div>
                        <h5 className="font-bold text-xs text-white">Admin Listing Status</h5>
                        <p className="text-[11px] text-slate-300 mt-0.5">
                          This tournament will be displayed with the <strong>"Posted by Admin"</strong> badge.
                        </p>
                      </div>
                    </div>
                  ) : null}
                </div>
              </div>
            </div>
          </div>
        ) : null}

        {/* Form Body */}
        <form onSubmit={handleSubmit} className={`flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 ${activeModalTab === 'preview' ? 'hidden' : 'block'}`}>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* LEFT COLUMN (7 cols) */}
            <div className="lg:col-span-7 space-y-5">
              {/* POSTER / FLYER UPLOAD SECTION */}
              <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 sm:p-5">
                <div className="mb-2 flex items-center justify-between">
                  <label className="text-xs font-bold uppercase tracking-wider text-orange-600 flex items-center gap-1.5">
                    <Upload className="h-4 w-4" /> Tournament Poster / Flyer
                  </label>
                  <span className="inline-flex items-center gap-1 rounded-full bg-orange-100 px-2 py-0.5 text-[10px] font-bold text-orange-700">
                    <Sparkles className="h-3 w-3" /> Auto-Fill Powered
                  </span>
                </div>

                {/* When scanning: HIGH-CONTRAST LASER SCANNER HUD */}
                {isAnalyzingPoster ? (
                  <div className="relative mt-2 flex flex-col items-center justify-center rounded-2xl border-2 border-orange-500 bg-slate-950 p-6 text-center text-white overflow-hidden shadow-2xl shadow-orange-500/30 min-h-[260px]">
                    {/* Laser Scanner Line traversing vertically */}
                    <div className="absolute left-0 right-0 h-1.5 bg-gradient-to-r from-transparent via-orange-400 to-transparent shadow-[0_0_25px_#f97316] animate-scanner-beam pointer-events-none z-20" />
                    
                    {/* Background poster image with scanner grid overlay */}
                    {(customPosterFile || (posterUrl && posterUrl !== DEFAULT_POSTER_FALLBACK)) && (
                      <div className="absolute inset-0 z-0">
                        <img
                          src={customPosterFile || posterUrl}
                          alt="Poster Scanning"
                          className="h-full w-full object-cover opacity-25 filter blur-[1px]"
                        />
                        <div className="absolute inset-0 bg-gradient-to-b from-slate-950/70 via-slate-950/40 to-slate-950/90" />
                      </div>
                    )}

                    {/* Scanner Foreground Content */}
                    <div className="relative z-10 flex flex-col items-center justify-center space-y-4 max-w-md w-full">
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-500 text-white shadow-lg shadow-orange-500/40">
                        <RefreshCw className="h-6 w-6 animate-spin" />
                      </div>

                      <div>
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-800 border border-slate-700 px-3 py-0.5 text-[11px] font-mono font-bold text-orange-300">
                          Auto-Fill Scanner
                        </span>
                        <h4 className="font-display font-black text-lg text-white mt-1 tracking-tight">
                          Scanning Flyer...
                        </h4>
                        <p className="text-xs font-mono font-medium text-orange-300 mt-0.5">
                          {SCAN_STAGES[scanStepIndex]}
                        </p>
                      </div>

                      {/* Real Live Elapsed Timer & Genuine Progress */}
                      <div className="w-full space-y-1.5 bg-slate-900/80 p-3.5 rounded-xl border border-slate-800 text-left">
                        <div className="flex items-center justify-between text-[11px] font-mono text-slate-300">
                          <span>Reading flyer image & text...</span>
                          <span className="text-orange-400 font-bold">{scanProgress}%</span>
                        </div>
                        <div className="w-full bg-slate-950 border border-slate-700 rounded-full h-3 overflow-hidden shadow-inner p-0.5">
                          <div
                            className="h-full bg-gradient-to-r from-orange-500 via-amber-400 to-orange-500 rounded-full transition-all duration-300 ease-out"
                            style={{ width: `${scanProgress}%` }}
                          />
                        </div>
                        <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
                          <span>Time Elapsed: <strong className="text-white text-xs">{scanElapsedSeconds}s</strong></span>
                          <span className="text-orange-300 font-semibold">
                            {scanElapsedSeconds >= 60 ? 'Processing response...' : 'Parsing details live...'}
                          </span>
                        </div>
                      </div>

                      {/* Prompt & Decision Box: Wait or Fill Manually */}
                      <div className="w-full rounded-xl bg-orange-950/60 border border-orange-500/40 p-3 text-left space-y-2">
                        <p className="text-xs text-orange-200 leading-relaxed font-medium">
                          Processing time depends on image resolution and network speed (live timer above). You can let it auto-fill or skip straight to manual entry at any moment.
                        </p>
                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 pt-0.5">
                          <span className="inline-flex items-center gap-1.5 text-[11px] font-mono font-bold text-orange-300">
                            <span className="h-2 w-2 rounded-full bg-orange-400 animate-ping" />
                            Active scan ({scanElapsedSeconds}s)
                          </span>
                          <button
                            type="button"
                            onClick={handleSkipAndFillManually}
                            className="rounded-lg bg-white hover:bg-slate-100 text-slate-900 px-3 py-1.5 text-xs font-bold shadow-sm transition-all active:scale-95 cursor-pointer text-center"
                          >
                            Fill Manually Instead (Skip Waiting)
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : customPosterFile ? (
                  /* When poster uploaded and not scanning: High-contrast preview box with prominent Re-scan button */
                  <div className="relative mt-2 rounded-2xl border-2 border-slate-200 bg-white p-4 shadow-sm">
                    <div className="flex flex-col sm:flex-row items-center gap-4">
                      <div className="relative h-28 w-24 shrink-0 rounded-xl overflow-hidden border border-slate-200 bg-slate-100 shadow-xs">
                        <img
                          src={customPosterFile}
                          alt="Uploaded Flyer"
                          className="h-full w-full object-cover"
                        />
                        <div className="absolute top-1 right-1 rounded-md bg-emerald-500 p-0.5 text-white">
                          <CheckCircle className="h-3 w-3" />
                        </div>
                      </div>

                      <div className="flex-1 text-center sm:text-left space-y-2">
                        <div className="flex items-center justify-center sm:justify-start gap-1.5">
                          <span className="rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5">
                            Flyer Ready
                          </span>
                          <span className="text-xs text-slate-500">Auto-read applied</span>
                        </div>
                        <p className="text-xs text-slate-600">
                          Flyer uploaded. All fields below are auto-filled and can be edited anytime.
                        </p>

                        <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-1">
                          <button
                            type="button"
                            onClick={() => analyzePosterWithAi(customPosterFile)}
                            className="flex items-center gap-1.5 rounded-xl bg-orange-500 hover:bg-orange-600 px-3.5 py-1.5 text-xs font-bold text-white shadow-sm transition-all active:scale-95 cursor-pointer"
                          >
                            <RefreshCw className="h-3.5 w-3.5" />
                            <span>Scan Flyer to Auto-Fill</span>
                          </button>

                          <label className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 px-3.5 py-1.5 text-xs font-semibold text-slate-700 transition-colors cursor-pointer">
                            <Upload className="h-3.5 w-3.5" />
                            <span>Change Flyer</span>
                            <input
                              type="file"
                              accept="image/*"
                              onChange={handleFileUpload}
                              className="hidden"
                            />
                          </label>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  /* Initial upload drop box */
                  <div className="relative mt-2 flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-orange-300 bg-orange-50/40 p-6 text-center hover:border-orange-500 hover:bg-orange-50/80 transition-all cursor-pointer">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileUpload}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                    />
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-500 text-white shadow-md shadow-orange-500/30 mb-2.5">
                      <Upload className="h-6 w-6" />
                    </div>
                    <p className="text-sm font-bold text-slate-900">
                      Upload Tournament Flyer / Poster
                    </p>
                    <p className="text-xs text-slate-500 mt-1 max-w-sm">
                      Upload tournament flyer (PNG, JPG) — auto-fill scanner reads title, dates, venue, entry fee & prizes!
                    </p>
                    <span className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-white border border-orange-200 px-3 py-1 text-[11px] font-bold text-orange-600 shadow-2xs">
                      <RefreshCw className="h-3.5 w-3.5" /> Auto-Fill Scanner Enabled
                    </span>
                  </div>
                )}

                {/* Or enter Direct Flyer Image URL */}
                <div className="mt-3">
                  <label className="block text-xs font-medium text-slate-600 mb-1">
                    Or paste direct Image / Poster URL:
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="url"
                      value={posterUrlInput}
                      onChange={(e) => setPosterUrlInput(e.target.value)}
                      placeholder="https://images.unsplash.com/... or image link"
                      className="flex-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 focus:border-orange-500 focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (posterUrlInput.trim()) {
                          const url = posterUrlInput.trim();
                          setPosterUrl(url);
                          setCustomPosterFile(null);
                          analyzePosterWithAi(url);
                        }
                      }}
                      className="rounded-xl bg-slate-800 hover:bg-slate-900 px-3 py-2 text-xs font-bold text-white transition-colors"
                    >
                      Apply & Scan
                    </button>
                  </div>
                </div>
              </div>

              {/* CHARITY & FLOOD RELIEF INITIATIVE TOGGLE */}
              <div className="rounded-2xl border-2 border-rose-200 bg-rose-50/60 p-4 sm:p-5 space-y-3">
                <label className="flex items-start gap-3 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={isCharity}
                    onChange={(e) => setIsCharity(e.target.checked)}
                    className="h-5 w-5 mt-0.5 rounded border-rose-300 text-rose-600 focus:ring-rose-500"
                  />
                  <div>
                    <span className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                      <HeartHandshake className="h-4 w-4 text-rose-600" />
                      Mark as Charity or Flood Relief Event
                    </span>
                    <span className="text-xs text-slate-500 block mt-0.5">
                      Check this for disaster relief drives (e.g. PM Disaster Relief Fund, Red Cross) or fundraising tournaments donating proceeds to flood victims.
                    </span>
                  </div>
                </label>

                {isCharity && (
                  <div className="space-y-3 pt-2 border-t border-rose-200/80">
                    <div>
                      <label className="block text-xs font-bold text-rose-900 mb-1">
                        Relief Cause / Beneficiary Title *
                      </label>
                      <input
                        type="text"
                        value={causeTitle}
                        onChange={(e) => setCauseTitle(e.target.value)}
                        placeholder="e.g. Prime Minister's Disaster Relief Fund (प्रधानमन्त्री दैवी प्रकोप उद्धार कोष)"
                        className="w-full rounded-xl border border-rose-200 bg-white px-3 py-2 text-xs text-slate-900 focus:border-rose-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-rose-900 mb-1">
                        Direct Donation Link / Government Portal (Optional)
                      </label>
                      <input
                        type="url"
                        value={donationLink}
                        onChange={(e) => setDonationLink(e.target.value)}
                        placeholder="https://opmcm.gov.np or donation page"
                        className="w-full rounded-xl border border-rose-200 bg-white px-3 py-2 text-xs text-slate-900 focus:border-rose-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-rose-900 mb-1">
                        Bank Accounts & Payment Instructions
                      </label>
                      <textarea
                        value={reliefBankDetails}
                        onChange={(e) => setReliefBankDetails(e.target.value)}
                        placeholder="e.g. Rastriya Banijya Bank A/C: 196000001101 | Fonepay PM Relief QR"
                        rows={2}
                        className="w-full rounded-xl border border-rose-200 bg-white p-2.5 text-xs text-slate-900 focus:border-rose-500 focus:outline-none"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* EVENT LINK FIELD */}
              <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 sm:p-5">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-800 mb-1.5 flex items-center gap-1.5">
                  <LinkIcon className="h-3.5 w-3.5 text-orange-500" />
                  Website or Event Portal URL (Optional)
                </label>
                <input
                  type="url"
                  value={officialLink}
                  onChange={(e) => setOfficialLink(e.target.value)}
                  placeholder="https://yourclub.org or Facebook event page"
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 focus:border-orange-500 focus:outline-none"
                />
                <span className="text-[11px] text-slate-400 block mt-1">
                  Adds a direct link button on the tournament card so participants can view event information.
                </span>
              </div>

              {/* BASIC INFO */}
              <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 sm:p-5 space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                  Event Overview
                </h3>

                {/* Category Selector */}
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Event Domain / Category *
                  </label>
                  <select
                    value={categorySelect}
                    onChange={(e) => setCategorySelect(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 focus:border-orange-500 focus:outline-none"
                  >
                    <option value="Football">Football & Futsal</option>
                    <option value="Basketball">Basketball Tournaments</option>
                    <option value="MUN & Debate">MUNs & Debates</option>
                    <option value="Case Competition">Business & Case Competitions</option>
                    <option value="Quiz">Quizzes & Trivia</option>
                    <option value="Esports">Esports & Gaming</option>
                    <option value="Cultural">Cultural, Arts & Festivals</option>
                    <option value="Other">Other Category</option>
                  </select>

                  {categorySelect === 'Other' && (
                    <div className="mt-2">
                      <input
                        type="text"
                        value={customCategory}
                        onChange={(e) => setCustomCategory(e.target.value)}
                        placeholder="Enter your custom category (e.g. Volleyball, Robotics, Debate)"
                        className="w-full rounded-xl border border-orange-300 bg-white px-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
                        autoFocus
                      />
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Event Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. All-Nepal Futsal Cup, Valley Basketball League, Kathmandu MUN"
                    className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:border-orange-500 focus:outline-none"
                  />
                </div>

                {/* Type & Age Grid with Auto-Normalization */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">
                      Event Format <span className="text-slate-400 font-normal">(Optional)</span>
                    </label>
                    <select
                      value={formatSelect}
                      onChange={(e) => setFormatSelect(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 focus:border-orange-500 focus:outline-none"
                    >
                      <option value="Team (2-4 Members)">Team (2-4 Members)</option>
                      <option value="7v7 Knockout">7v7 Knockout</option>
                      <option value="5v5">5v5</option>
                      <option value="3v3">3v3</option>
                      <option value="1v1">1v1</option>
                      <option value="Individual Delegates">Individual Delegates</option>
                      <option value="Solo or Team">Solo or Team</option>
                      <option value="Other">Other</option>
                    </select>

                    {/* Custom Format Input if Other is selected */}
                    {formatSelect === 'Other' && (
                      <div className="mt-2">
                        <input
                          type="text"
                          value={customFormat}
                          onChange={(e) => setCustomFormat(e.target.value)}
                          onBlur={() => setCustomFormat(normalizeTournamentType(customFormat))}
                          placeholder="e.g. 11v11, 48-Hr Sprint, 4v4"
                          className="w-full rounded-xl border border-orange-300 bg-white px-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
                          autoFocus
                        />
                        <span className="text-[10px] text-slate-400 mt-0.5 block">Auto-formats text</span>
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">
                      Eligibility / Age *
                    </label>
                    <select
                      value={ageSelect}
                      onChange={(e) => setAgeSelect(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 focus:border-orange-500 focus:outline-none"
                    >
                      <option value="Open">Open</option>
                      <option value="College/University">College/University</option>
                      <option value="High School">High School</option>
                      <option value="U-19">U-19</option>
                      <option value="U-16">U-16</option>
                      <option value="U-14">U-14</option>
                      <option value="Other">Other</option>
                    </select>

                    {/* Custom Age Input if Other is selected */}
                    {ageSelect === 'Other' && (
                      <div className="mt-2">
                        <input
                          type="text"
                          value={customAge}
                          onChange={(e) => setCustomAge(e.target.value)}
                          onBlur={() => setCustomAge(normalizeAgeDivision(customAge))}
                          placeholder="e.g. Working Professionals, Freshers, U-12"
                          className="w-full rounded-xl border border-orange-300 bg-white px-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
                          autoFocus
                        />
                        <span className="text-[10px] text-slate-400 mt-0.5 block">Auto-formats text</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Slot Limit Toggle for Open Events / Relief Appeals */}
                <div className="flex items-center justify-between rounded-xl bg-slate-50 p-3 border border-slate-200">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={hasNoSlots || isCharity || categorySelect === 'Charity & Relief'}
                      onChange={(e) => setHasNoSlots(e.target.checked)}
                      className="h-4 w-4 rounded border-slate-300 text-orange-500 focus:ring-orange-500 cursor-pointer"
                    />
                    <span className="text-xs font-bold text-slate-700">
                      Open Event / Relief Appeal (No team slot limit)
                    </span>
                  </label>
                  <span className="text-[10px] text-slate-400 font-medium">e.g. disaster funds, rallies</span>
                </div>

                {/* Entry Fee & Total Teams */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">
                      {hasNoSlots || isCharity ? 'Registration / Donation Fee (Rs.)' : 'Entry Fee (Rs. NPR)'}
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={entryFee}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val === '') {
                          setEntryFee('');
                        } else {
                          // Strip leading zeros like '020' -> 20
                          const parsed = Number(val);
                          setEntryFee(isNaN(parsed) ? '' : parsed);
                        }
                      }}
                      placeholder="0 (Free entry)"
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 focus:border-orange-500 focus:outline-none"
                    />
                    <span className="text-[10px] text-slate-400">
                      {hasNoSlots || isCharity ? 'Leave blank or 0 for voluntary donation' : 'Leave blank or 0 for free entry'}
                    </span>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">
                      {hasNoSlots || isCharity ? 'Participation Scope' : 'Total Teams (Optional — No limit if blank)'}
                    </label>
                    {hasNoSlots || isCharity ? (
                      <div className="flex h-[42px] items-center rounded-xl border border-emerald-200 bg-emerald-50 px-3 text-xs font-bold text-emerald-800">
                        Open to All (No Slot Limits)
                      </div>
                    ) : (
                      <input
                        type="number"
                        min={2}
                        value={totalTeams}
                        onChange={(e) => {
                          const val = e.target.value;
                          if (val === '') {
                            setTotalTeams('');
                          } else {
                            // Strip leading zeros like '020' -> 20
                            const parsed = Number(val);
                            setTotalTeams(isNaN(parsed) ? '' : parsed);
                          }
                        }}
                        placeholder="Optional (e.g. 16, 24, 32 or leave blank)"
                        className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 focus:border-orange-500 focus:outline-none"
                      />
                    )}
                    <span className="text-[10px] text-slate-400">
                      Leave blank if there is no team limit or slots are open.
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    {hasNoSlots || isCharity ? 'Relief Cause & Purpose / Objective' : 'Prize Pool & Awards (NPR)'}
                  </label>
                  <input
                    type="text"
                    value={prizePool}
                    onChange={(e) => setPrizePool(e.target.value)}
                    placeholder={hasNoSlots || isCharity ? 'e.g. 100% Emergency Aid & Medical Kits to Flood Victims' : 'e.g. Rs. 75,000 Cash + Running Trophy & Medals'}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:border-orange-500 focus:outline-none"
                  />
                </div>

                {/* Tournament Description (Optional) */}
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Tournament Description <span className="text-slate-400 font-normal">(Optional)</span>
                  </label>
                  <textarea
                    rows={2}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Optional details, match schedule highlights, special rules..."
                    className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:border-orange-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* DATE SELECTION WITH START/END DATE & NEPALI CALENDAR TOGGLE */}
              <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 sm:p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                    <Calendar className="h-4 w-4 text-orange-500" />
                    <span>Tournament Dates & Calendar</span>
                  </h3>

                  {/* Calendar Selector: AD / BS Toggle */}
                  <div className="flex items-center rounded-lg bg-slate-200/80 p-0.5 text-xs font-semibold">
                    <button
                      type="button"
                      onClick={() => setCalendarType('AD')}
                      className={`px-2.5 py-1 rounded-md transition-all ${
                        calendarType === 'AD'
                          ? 'bg-white text-slate-900 shadow-xs font-bold'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      AD (English)
                    </button>
                    <button
                      type="button"
                      onClick={() => setCalendarType('BS')}
                      className={`px-2.5 py-1 rounded-md transition-all ${
                        calendarType === 'BS'
                          ? 'bg-orange-500 text-white shadow-xs font-bold'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      BS (Nepali / बिक्रम संवत्)
                    </button>
                  </div>
                </div>

                {/* AD Calendar Inputs */}
                {calendarType === 'AD' ? (
                  <div className="space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1">
                          Start Date (AD) *
                        </label>
                        <input
                          type="date"
                          required
                          value={startDate}
                          onChange={(e) => {
                            setStartDate(e.target.value);
                            if (endDate < e.target.value) setEndDate(e.target.value);
                          }}
                          className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-orange-500 focus:outline-none"
                        />
                        <span className="text-[10px] text-slate-400 mt-0.5 block">
                          Nepali Equiv: {convertAdToBs(startDate).bsDateStr}
                        </span>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1">
                          End Date (AD) *
                        </label>
                        <input
                          type="date"
                          required
                          value={endDate}
                          min={startDate}
                          onChange={(e) => setEndDate(e.target.value)}
                          className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-orange-500 focus:outline-none"
                        />
                        <span className="text-[10px] text-slate-400 mt-0.5 block">
                          Nepali Equiv: {convertAdToBs(endDate).bsDateStr}
                        </span>
                      </div>
                    </div>
                  </div>
                ) : (
                  /* BS Nepali Calendar Inputs */
                  <div className="space-y-4 rounded-xl bg-orange-50/60 p-3.5 border border-orange-200">
                    <span className="text-xs font-bold text-orange-900 block">
                      बिक्रम संवत् (BS) मिति चयन गर्नुहोस्:
                    </span>
                    {/* BS Start Date */}
                    <div>
                      <span className="text-xs font-semibold text-slate-700 block mb-1">Start Date (BS):</span>
                      <div className="grid grid-cols-3 gap-2">
                        <div>
                          <label className="text-[10px] text-slate-500 block">Year</label>
                          <select
                            value={bsStartYear}
                            onChange={(e) => setBsStartYear(Number(e.target.value))}
                            className="w-full rounded-lg border border-slate-300 bg-white p-1.5 text-xs font-semibold text-slate-800"
                          >
                            <option value={2081}>2081 BS</option>
                            <option value={2082}>2082 BS</option>
                            <option value={2083}>2083 BS</option>
                            <option value={2084}>2084 BS</option>
                          </select>
                        </div>
                        <div>
                          <label className="text-[10px] text-slate-500 block">Month</label>
                          <select
                            value={bsStartMonth}
                            onChange={(e) => setBsStartMonth(Number(e.target.value))}
                            className="w-full rounded-lg border border-slate-300 bg-white p-1.5 text-xs font-semibold text-slate-800"
                          >
                            {NEPALI_MONTHS.map((m) => (
                              <option key={m.id} value={m.id}>{m.nameEn} ({m.nameNp})</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="text-[10px] text-slate-500 block">Day</label>
                          <select
                            value={bsStartDay}
                            onChange={(e) => setBsStartDay(Number(e.target.value))}
                            className="w-full rounded-lg border border-slate-300 bg-white p-1.5 text-xs font-semibold text-slate-800"
                          >
                            {Array.from({ length: 32 }, (_, i) => i + 1).map((d) => (
                              <option key={d} value={d}>{d}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </div>

                    {/* BS End Date */}
                    <div>
                      <span className="text-xs font-semibold text-slate-700 block mb-1">End Date (BS):</span>
                      <div className="grid grid-cols-3 gap-2">
                        <div>
                          <label className="text-[10px] text-slate-500 block">Year</label>
                          <select
                            value={bsEndYear}
                            onChange={(e) => setBsEndYear(Number(e.target.value))}
                            className="w-full rounded-lg border border-slate-300 bg-white p-1.5 text-xs font-semibold text-slate-800"
                          >
                            <option value={2081}>2081 BS</option>
                            <option value={2082}>2082 BS</option>
                            <option value={2083}>2083 BS</option>
                            <option value={2084}>2084 BS</option>
                          </select>
                        </div>
                        <div>
                          <label className="text-[10px] text-slate-500 block">Month</label>
                          <select
                            value={bsEndMonth}
                            onChange={(e) => setBsEndMonth(Number(e.target.value))}
                            className="w-full rounded-lg border border-slate-300 bg-white p-1.5 text-xs font-semibold text-slate-800"
                          >
                            {NEPALI_MONTHS.map((m) => (
                              <option key={m.id} value={m.id}>{m.nameEn} ({m.nameNp})</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="text-[10px] text-slate-500 block">Day</label>
                          <select
                            value={bsEndDay}
                            onChange={(e) => setBsEndDay(Number(e.target.value))}
                            className="w-full rounded-lg border border-slate-300 bg-white p-1.5 text-xs font-semibold text-slate-800"
                          >
                            {Array.from({ length: 32 }, (_, i) => i + 1).map((d) => (
                              <option key={d} value={d}>{d}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </div>
                    
                    <div className="text-xs text-orange-800 font-bold bg-white/80 p-2 rounded-lg border border-orange-200">
                      Selected BS Schedule: {bsStartDateStr} – {bsEndDateStr}
                    </div>
                  </div>
                )}

                {/* Registration Deadline (Optional) */}
                <div className="rounded-xl border border-orange-200 bg-white p-3.5 space-y-1.5">
                  <label className="flex items-center justify-between text-xs font-bold text-slate-800">
                    <span className="flex items-center gap-1.5 text-orange-600">
                      <Clock className="h-4 w-4" /> Registration Deadline (Optional)
                    </span>
                    <span className="text-[10px] text-slate-400 font-normal">Shows live countdown ticker</span>
                  </label>
                  <input
                    type="date"
                    value={registrationDeadline}
                    max={startDate}
                    onChange={(e) => setRegistrationDeadline(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-orange-500 focus:outline-none"
                  />
                  <span className="text-[10px] text-slate-500 block">
                    Last day for teams to register. Once this deadline passes (or when the event concludes), KataTira will automatically remove the listing so expired events never clutter the platform.
                  </span>
                </div>

                {/* Time Schedule */}
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Daily Match Time Schedule
                  </label>
                  <input
                    type="text"
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    placeholder="e.g. 09:00 AM - 05:00 PM NPT"
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-orange-500 focus:outline-none"
                  />
                </div>

                {/* Venue, City & Province in Nepal */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">
                      Venue / Ground <span className="text-slate-400 font-normal">(Optional)</span>
                    </label>
                    <input
                      type="text"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      placeholder="e.g. Dhuku Futsal Hub (or TBA / Online)"
                      className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm text-slate-900 focus:border-orange-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">
                      City in Nepal <span className="text-slate-400 font-normal">(Optional)</span>
                    </label>
                    <input
                      type="text"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      placeholder="e.g. Kathmandu, Pokhara (default: Nepal)"
                      className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm text-slate-900 focus:border-orange-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">
                      Province in Nepal
                    </label>
                    <select
                      value={province}
                      onChange={(e) => setProvince(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-800 focus:border-orange-500 focus:outline-none"
                    >
                      <option value="Bagmati">Bagmati Province</option>
                      <option value="Gandaki">Gandaki Province</option>
                      <option value="Koshi">Koshi Province</option>
                      <option value="Lumbini">Lumbini Province</option>
                      <option value="Madhesh">Madhesh Province</option>
                      <option value="Karnali">Karnali Province</option>
                      <option value="Sudurpashchim">Sudurpashchim Province</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Audience / Spectator Entry Policy
                  </label>
                  <input
                    type="text"
                    value={audienceAdmission}
                    onChange={(e) => setAudienceAdmission(e.target.value)}
                    placeholder="e.g. Free entry for spectators, open gallery"
                    className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm text-slate-900 focus:border-orange-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* HOST PAYMENT QR CODE / SOURCE OF PAYMENT */}
              <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 sm:p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                    <QrCode className="h-4 w-4 text-orange-500" />
                    <span>Host Payment Source & QR Code</span>
                  </h3>
                  <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700">
                    <input
                      type="checkbox"
                      checked={hasPaymentQr}
                      onChange={(e) => setHasPaymentQr(e.target.checked)}
                      className="rounded text-orange-600 focus:ring-orange-500"
                    />
                    <span>Accept Payments via QR</span>
                  </label>
                </div>

                {hasPaymentQr && (
                  <div className="space-y-3 bg-white p-4 rounded-xl border border-slate-200">
                    <p className="text-xs text-slate-500">
                      Teams will see your QR code directly during registration with zero additional platform fees.
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1">
                          Payment Gateway / Method
                        </label>
                        <select
                          value={hostPaymentMethod}
                          onChange={(e) => setHostPaymentMethod(e.target.value as any)}
                          className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-800"
                        >
                          <option value="Fonepay QR">Fonepay QR (All Mobile Banking)</option>
                          <option value="eSewa">eSewa Wallet</option>
                          <option value="Khalti">Khalti Wallet</option>
                          <option value="Bank Transfer">Bank Transfer / ConnectIPS</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1">
                          Payment Account / Mobile / ID
                        </label>
                        <input
                          type="text"
                          value={hostPaymentNumber}
                          onChange={(e) => setHostPaymentNumber(e.target.value)}
                          placeholder="e.g. 9841234567 or Nabil A/C 019001..."
                          className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 focus:border-orange-500 focus:outline-none"
                        />
                      </div>
                    </div>

                    {/* QR Code Image Upload */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">
                        Upload Host QR Code Image <span className="text-slate-400 font-normal">(Optional)</span>
                      </label>
                      <div className="flex items-center gap-3">
                        <label className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 px-3 py-2 text-xs font-bold text-slate-700 cursor-pointer">
                          <Upload className="h-3.5 w-3.5 text-orange-500" />
                          <span>{hostQrFile ? 'Change QR Image' : 'Upload QR Code Graphic'}</span>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleQrUpload}
                            className="hidden"
                          />
                        </label>
                        {hostQrFile && (
                          <span className="text-xs font-semibold text-emerald-600 flex items-center gap-1">
                            <CheckCircle className="h-3.5 w-3.5" /> QR Code Attached
                          </span>
                        )}
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">
                        Payment Instructions for Teams <span className="text-slate-400 font-normal">(Optional)</span>
                      </label>
                      <input
                        type="text"
                        value={hostPaymentInstructions}
                        onChange={(e) => setHostPaymentInstructions(e.target.value)}
                        placeholder="e.g. Please put your Team Name in transaction remarks."
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* SOCIAL MEDIA ACCOUNTS & LINKS */}
              <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 sm:p-5 space-y-3.5">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                  <Share2 className="h-4 w-4 text-orange-500" />
                  <span>Social Media & Community Links (Optional)</span>
                </h3>
                <p className="text-xs text-slate-500">
                  Connect your team or club social media channels so players can follow tournament highlights.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">
                      Instagram Handle / URL
                    </label>
                    <input
                      type="text"
                      value={instagram}
                      onChange={(e) => setInstagram(e.target.value)}
                      placeholder="@yourclub or instagram.com/..."
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 focus:border-orange-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">
                      Facebook Page / URL
                    </label>
                    <input
                      type="text"
                      value={facebook}
                      onChange={(e) => setFacebook(e.target.value)}
                      placeholder="facebook.com/yourclub"
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 focus:border-orange-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">
                      WhatsApp Group / Phone
                    </label>
                    <input
                      type="text"
                      value={whatsapp}
                      onChange={(e) => setWhatsapp(e.target.value)}
                      placeholder="+977 98XXXXXXXX or chat link"
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 focus:border-orange-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">
                      Website / Linktree URL
                    </label>
                    <input
                      type="text"
                      value={website}
                      onChange={(e) => setWebsite(e.target.value)}
                      placeholder="https://yourclub.np"
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 focus:border-orange-500 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* ORGANIZER CONTACT DETAILS & PUBLIC TRANSPARENCY */}
              <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 sm:p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                    Organizer Contact & Transparency
                  </h3>
                  <span className="text-[11px] font-bold text-slate-500">
                    Privacy Protected
                  </span>
                </div>

                {/* Transparency Notice Box */}
                <div className="rounded-xl border border-blue-200 bg-blue-50/80 p-3.5 text-xs text-blue-900 space-y-1">
                  <div className="flex items-center gap-1.5 font-bold text-blue-950">
                    <ShieldCheck className="h-4 w-4 text-blue-600 shrink-0" />
                    <span>Public Display & Privacy Disclosure</span>
                  </div>
                  <p className="text-[11px] text-blue-800 leading-relaxed">
                    • <strong>Displayed Publicly:</strong> Event Flyer, Title, Category, Dates, Venue, Fees, Prize Pool, <strong>Organization Name</strong>, <strong>Contact Phone Number(s)</strong>, and Links for attendees to reference.<br />
                    • <strong>Kept Strictly Private:</strong> Personal Organizer Name and Email are strictly used for verification and admin alerts—they are <strong>never</strong> displayed publicly.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center justify-between">
                      <span>Lead Organizer Name</span>
                      <span className="text-[10px] font-bold text-slate-500 bg-slate-200/80 px-2 py-0.5 rounded">🔒 Private</span>
                    </label>
                    <input
                      type="text"
                      value={hostName}
                      onChange={(e) => setHostName(e.target.value)}
                      placeholder="e.g. Bikash Shrestha"
                      className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm text-slate-900 focus:border-orange-500 focus:outline-none"
                    />
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      Never shown to public participants.
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center justify-between">
                      <span>Club / Organization Name</span>
                      <span className="text-[10px] font-bold text-blue-700 bg-blue-100 px-2 py-0.5 rounded">🌐 Public</span>
                    </label>
                    <input
                      type="text"
                      value={hostOrg}
                      onChange={(e) => setHostOrg(e.target.value)}
                      placeholder="e.g. Nepal Basketball Association"
                      className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm text-slate-900 focus:border-orange-500 focus:outline-none"
                    />
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      Displayed on event card & details page.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center justify-between">
                      <span>Organizer Email</span>
                      <span className="text-[10px] font-bold text-slate-500 bg-slate-200/80 px-2 py-0.5 rounded">🔒 Private</span>
                    </label>
                    <input
                      type="email"
                      value={hostEmail}
                      onChange={(e) => setHostEmail(e.target.value)}
                      placeholder="organizer@gmail.com"
                      className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm text-slate-900 focus:border-orange-500 focus:outline-none"
                    />
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      Private for OTP & system notifications.
                    </p>
                  </div>

                  <div>
                    <label className="flex items-center justify-between text-xs font-semibold text-slate-700 mb-1">
                      <span>Primary Phone (Nepal) <strong className="text-rose-600 font-bold">*</strong></span>
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">🌐 Public</span>
                    </label>
                    <input
                      type="tel"
                      required
                      value={hostPhone}
                      onChange={(e) => setHostPhone(e.target.value)}
                      placeholder="e.g. +977 9841234567"
                      className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm text-slate-900 focus:border-orange-500 focus:outline-none"
                    />
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      Direct WhatsApp / call number for team inquiries.
                    </p>
                  </div>
                </div>

                {/* Secondary Phone Number Field */}
                <div>
                  <label className="flex items-center justify-between text-xs font-semibold text-slate-700 mb-1">
                    <span>Secondary / Alternate Phone (Optional)</span>
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">🌐 Public</span>
                  </label>
                  <input
                    type="tel"
                    value={hostPhoneSecondary}
                    onChange={(e) => setHostPhoneSecondary(e.target.value)}
                    placeholder="e.g. +977 9801234567 or landline 01-XXXXXXX"
                    className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm text-slate-900 focus:border-orange-500 focus:outline-none"
                  />
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    Optional secondary number displayed for player and team coordination.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    WhatsApp Group Invite Link <span className="text-slate-400 font-normal">(Optional)</span>
                  </label>
                  <input
                    type="url"
                    value={whatsappGroupLink}
                    onChange={(e) => setWhatsappGroupLink(e.target.value)}
                    placeholder="https://chat.whatsapp.com/..."
                    className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm text-slate-900 focus:border-orange-500 focus:outline-none"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">
                    Teams will receive a direct 1-click invite link to join your WhatsApp updates group upon completing registration.
                  </p>
                </div>
              </div>
            </div>

            {/* RIGHT COLUMN: LIVE POSTER & CARD PREVIEW (5 cols) */}
            <div className="lg:col-span-5 space-y-4">
              <div className="sticky top-4">
                <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">
                  <Eye className="h-4 w-4 text-orange-500" />
                  <span>Live KataTira Card Preview</span>
                </div>

                {/* Preview Card */}
                <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-lg">
                  {/* Poster */}
                  <div className="relative aspect-[16/10] w-full bg-slate-900">
                    <img
                      src={posterUrl}
                      alt="Preview Poster"
                      referrerPolicy="no-referrer"
                      className="h-full w-full object-cover object-center"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/30 to-transparent" />
                    <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between">
                      <span className="rounded-lg bg-slate-900/80 px-2 py-0.5 text-xs font-bold text-white backdrop-blur-md">
                        {effectiveFormat}
                      </span>
                      <span className="rounded-lg bg-orange-500 px-2 py-0.5 text-xs font-bold text-white">
                        {effectiveAge}
                      </span>
                    </div>

                    <div className="absolute bottom-2.5 left-2.5 right-2.5">
                      <h4 className="font-display text-base font-bold text-white line-clamp-1">
                        {title || 'Your Tournament Title'}
                      </h4>
                    </div>
                  </div>

                  {/* Body specs */}
                  <div className="p-4 space-y-2.5">
                    <div className="flex items-center gap-2 text-xs text-slate-600">
                      <Calendar className="h-3.5 w-3.5 text-orange-500 shrink-0" />
                      <span>
                        {calendarType === 'BS'
                          ? `${bsStartDateStr} – ${bsEndDateStr}`
                          : formatEventDates(startDate, endDate)}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-xs text-slate-600">
                      <MapPin className="h-3.5 w-3.5 text-orange-500 shrink-0" />
                      <span className="truncate">{location || 'Court Location'}, {city || 'Kathmandu'}, Nepal</span>
                    </div>

                    <div className="grid grid-cols-3 gap-1.5 rounded-lg bg-slate-50 p-2 text-center text-xs border border-slate-200">
                      <div>
                        <span className="text-[9px] text-slate-400 block font-bold">FORMAT</span>
                        <span className="font-bold text-orange-600">{effectiveFormat}</span>
                      </div>
                      <div>
                        <span className="text-[9px] text-slate-400 block font-bold">DIVISION</span>
                        <span className="font-bold text-slate-800 truncate block">{effectiveAge}</span>
                      </div>
                      <div>
                        <span className="text-[9px] text-slate-400 block font-bold">TOTAL TEAMS</span>
                        <span className="font-bold text-slate-900">
                          {totalTeams !== '' && Number(totalTeams) > 0 ? `${totalTeams} Teams` : 'Open / No Limit'}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-xs bg-slate-50 p-2 rounded-lg border border-slate-200">
                      <span className="text-slate-500 font-medium">Entry Fee:</span>
                      <span className="font-bold text-orange-600">
                        {entryFee === '' || Number(entryFee) === 0 ? 'FREE' : `Rs. ${Number(entryFee).toLocaleString()}`} (No Extra Fees)
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-xs text-amber-700 bg-amber-50 rounded-lg p-2 border border-amber-200">
                      <Sparkles className="h-3.5 w-3.5 shrink-0 text-amber-500" />
                      <span className="truncate">{prizePool}</span>
                    </div>

                    <div className="pt-2">
                      <button
                        type="button"
                        className="w-full rounded-xl bg-slate-900 py-2.5 text-xs font-bold text-white hover:bg-orange-500 transition-colors"
                      >
                        Register Team ({entryFee === 0 ? 'FREE' : `Rs. ${entryFee.toLocaleString()}`})
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Admin Posting Option (Active only when authenticated as admin) */}
          {(isAdminAuthenticated() || isPostedByAdmin) && (
            <div className="rounded-2xl border-2 border-slate-900 bg-slate-900 text-white p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-lg">
              <label className="flex items-start sm:items-center gap-3 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={postAsAdmin}
                  onChange={(e) => setPostAsAdmin(e.target.checked)}
                  className="h-5 w-5 mt-0.5 sm:mt-0 rounded border-slate-700 text-orange-500 focus:ring-orange-500 cursor-pointer"
                />
                <div>
                  <span className="font-bold text-sm text-white flex items-center gap-1.5">
                    <ShieldCheck className="h-4 w-4 text-orange-400" />
                    <span>Publish with "Posted by Admin" Badge</span>
                  </span>
                  <span className="text-xs text-slate-400 block mt-0.5">
                    Admin session authenticated. When checked, this event will show the "Posted by Admin" badge.
                  </span>
                </div>
              </label>
              <span className="self-start sm:self-center px-2.5 py-1 rounded-full bg-orange-500 text-white text-[11px] font-mono font-bold shrink-0">
                Admin Session Active
              </span>
            </div>
          )}

          {/* Anti-Bot Verification & Organizer Authenticity Shield */}
          <div className="space-y-4 rounded-2xl border border-slate-200 bg-slate-50/80 p-4 sm:p-5">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-800">
              <ShieldCheck className="h-4 w-4 text-emerald-600" />
              <span>Anti-Bot Verification & Organizer Authenticity</span>
            </div>

            {/* Anti-Bot CAPTCHA Component */}
            <AntiBotCaptcha
              onVerify={(data) => {
                setCaptchaData(data);
              }}
            />

            {/* Organizer Scam Shield Declaration */}
            <div className="rounded-xl border border-emerald-200 bg-emerald-50/70 p-4 transition-all">
              <label className="flex items-start gap-3 cursor-pointer select-none">
                <input
                  type="checkbox"
                  required
                  checked={isOrganizerCertified}
                  onChange={(e) => setIsOrganizerCertified(e.target.checked)}
                  className="h-5 w-5 mt-0.5 rounded border-emerald-400 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                />
                <div className="text-xs text-slate-700 leading-relaxed">
                  <span className="font-bold text-slate-900 block flex items-center gap-1.5">
                    <ShieldCheck className="h-4 w-4 text-emerald-600" />
                    Organizer Authenticity & Anti-Scam Shield Certification
                  </span>
                  <span className="text-[11px] text-slate-600 block mt-1">
                    I solemnly certify that I am the verified organizer or authorized committee member of this event in Nepal. All venue locations, tournament dates, entry fees, and prize amounts listed are genuine. I understand that posting fake events, unauthorized fee collection, or impersonation is strictly prohibited and subject to immediate blacklisting and reporting to the Nepal Police Cyber Bureau.
                  </span>
                </div>
              </label>
            </div>
          </div>

          {/* Form Action Error Notice right above Submit */}
          {errorMsg && (
            <div className="flex items-center gap-2 rounded-xl bg-rose-50 border border-rose-200 p-3 text-xs font-semibold text-rose-700 animate-shake">
              <ShieldAlert className="h-4 w-4 shrink-0 text-rose-500" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Footer Submit Actions */}
          <div className="border-t border-slate-200 pt-4 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-slate-200 px-5 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isSubmitting || (!tournamentToEdit && (!captchaData.isVerified || !isOrganizerCertified))}
              className="flex items-center gap-2 rounded-xl bg-orange-500 hover:bg-orange-600 px-6 py-2.5 text-sm font-bold text-white shadow-sm transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <span className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>{tournamentToEdit ? 'Saving Changes...' : 'Verifying & Publishing...'}</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="h-4 w-4 text-white" />
                  <span>{tournamentToEdit ? 'Save Changes' : 'Publish Tournament Live'}</span>
                </>
              )}
            </button>
          </div>
        </form>
    </div>
  </div>
);
};
