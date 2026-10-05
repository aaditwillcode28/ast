import React, { useState, useEffect, useMemo } from 'react';
import { Navbar } from './components/Navbar';
import { LeftSidebar, CATEGORIES_LIST } from './components/LeftSidebar';
import { TournamentCard } from './components/TournamentCard';
import { TournamentDetailModal } from './components/TournamentDetailModal';
import { HostTournamentModal } from './components/HostTournamentModal';
import { RegistrationPaymentModal } from './components/RegistrationPaymentModal';
import { MyPassesModal } from './components/MyPassesModal';
import { HostPortalModal } from './components/HostPortalModal';
import { RegisterInterestsModal } from './components/RegisterInterestsModal';
import { AdminHubModal } from './components/AdminHubModal';
import { NepalLegalComplianceModal } from './components/NepalLegalComplianceModal';
import { Tournament, Registration, FilterState } from './types';
import { INITIAL_TOURNAMENTS } from './data/mockTournaments';
import { trackPageImpression, logActivity, getEventReports, isAdminAuthenticated } from './utils/activityTracker';
import {
  fetchCloudTournaments,
  publishCloudTournament,
  saveCloudRegistration,
  incrementCloudRegistrationCount,
  deleteCloudTournament,
  supabase,
} from './lib/supabase';
import { isEventRegistrationEnded } from './utils/countdown';
import {
  Sparkles,
  Search,
  Heart,
  HeartHandshake,
  ExternalLink,
  SlidersHorizontal,
  X,
  ArrowUpDown,
  ArrowUp,
  PlusCircle,
  Compass,
  Trophy,
  Award,
  CircleDot,
  Activity,
  MessageSquare,
  Briefcase,
  HelpCircle,
  Gamepad2,
  Palette,
  LayoutGrid,
  Lock,
  ShieldCheck,
  Scale,
  Navigation,
  Globe2,
  Calendar as CalendarIcon
} from 'lucide-react';

const STORAGE_KEYS = {
  TOURNAMENTS: 'katatira_tournaments_nepal_v7',
  REGISTRATIONS: 'katatira_registrations_nepal_v7',
  HOSTED_IDS: 'katatira_hosted_ids_nepal_v7',
  USER_INTERESTS: 'katatira_user_interests_v7',
  INTERESTED_EVENT_IDS: 'katatira_interested_events_v7',
};

const DEFAULT_FILTERS: FilterState = {
  searchQuery: '',
  category: 'all',
  type: 'all',
  province: 'all',
  nearMe: false,
  ageGroup: 'all',
  maxFee: 0,
  onlyFree: false,
  onlyInterested: false,
  selectedDateFilter: 'all',
};

// Category tabs matching Nepal's competitive scene
const CATEGORY_TABS = [
  { id: 'all', label: 'All Opportunities', icon: LayoutGrid },
  { id: 'Football', label: 'Football & Futsal', icon: Award },
  { id: 'Basketball', label: 'Basketball', icon: Trophy },
  { id: 'MUN & Debate', label: 'MUNs & Debates', icon: MessageSquare },
  { id: 'Case Competition', label: 'Case Competitions', icon: Briefcase },
  { id: 'Quiz', label: 'Quizzes & Trivia', icon: HelpCircle },
  { id: 'Esports', label: 'Esports & Gaming', icon: Gamepad2 },
  { id: 'Cultural', label: 'Arts & Cultural', icon: Palette },
  { id: 'Charity & Relief', label: 'Disaster Relief', icon: HeartHandshake, isRelief: true },
];

// Helper to detect test/dummy placeholder listings (e.g. 3E2, ASDNAJSD, 23d23d)
export const isTestOrPlaceholderTournament = (item: any): boolean => {
  if (!item || !item.title) return true;
  const title = String(item.title).trim().toLowerCase();
  const desc = String(item.description || '').trim().toLowerCase();
  const host = String(item.hostName || '').trim().toLowerCase();
  const loc = String(item.location || '').trim().toLowerCase();
  const id = String(item.id || '').trim().toLowerCase();
  const combined = `${title} ${desc} ${host} ${loc} ${id}`;

  const testTokens = ['3e2', '33d3d', 'asdnajsd', '23d23d', 'dummy', 'fake', 'asdf'];
  for (const token of testTokens) {
    if (title === token || id.includes(token)) return true;
    if (combined.includes(token)) return true;
  }
  if (title === 'test' || title === 'test tournament' || title === 'sample event') return true;
  if (title.length < 4 && !INITIAL_TOURNAMENTS.some((it) => it.id === item.id)) {
    return true;
  }
  return false;
};

// Helper to determine if an event has concluded
export const isConcludedTournament = (t: Tournament): boolean => {
  if (t.isReliefFund || t.id === 'ev-pm-flood-relief' || t.id === 'ev-redcross-flood') {
    return false; // Relief initiatives are ongoing public appeals
  }
  const dateStr = t.endDate || t.startDate || t.date;
  if (!dateStr) return false;
  const today = '2026-10-02';
  return dateStr < today;
};

export default function App() {
  // 1. Tournaments State (with local storage & automatic data synchronization)
  const [tournaments, setTournaments] = useState<Tournament[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.TOURNAMENTS);
      if (saved) {
        const parsed: Tournament[] = JSON.parse(saved);
        // Clean out any test or placeholder cards (e.g. 3E2, ASDNAJSD, 33d3d) immediately
        // Filter out test cards AND any events whose registration has ended
        const cleaned = parsed.filter(
          (item) => !isTestOrPlaceholderTournament(item) && !isEventRegistrationEnded(item)
        );

        // Synchronize initial tournaments with fresh mock data updates (e.g. slot adjustments & flags)
        const merged = cleaned.map((item) => {
          const fresh = INITIAL_TOURNAMENTS.find((it) => it.id === item.id);
          if (fresh) {
            return { ...item, ...fresh };
          }
          if (
            item.id === 'ev-pm-flood-relief' ||
            item.id === 'ev-redcross-flood' ||
            item.title?.toLowerCase().includes('prime minister') ||
            item.title?.toLowerCase().includes('disaster relief')
          ) {
            return {
              ...item,
              hasNoSlots: true,
              isReliefFund: true,
              totalTeams: 0,
              registeredTeamsCount: 0,
            };
          }
          return item;
        });

        // Ensure any new initial tournaments exist (and are not expired)
        INITIAL_TOURNAMENTS.forEach((it) => {
          if (!merged.some((m) => m.id === it.id) && !isEventRegistrationEnded(it)) {
            merged.push(it);
          }
        });

        try {
          localStorage.setItem(STORAGE_KEYS.TOURNAMENTS, JSON.stringify(merged));
        } catch (err) {}

        return merged;
      }
    } catch (e) {
      console.error('Error loading tournaments from storage', e);
    }
    return INITIAL_TOURNAMENTS;
  });

  // 2. Registrations State (with local storage)
  const [registrations, setRegistrations] = useState<Registration[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.REGISTRATIONS);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.error('Error loading registrations from storage', e);
    }
    return [];
  });

  // 3. User Hosted Tournament IDs
  const [hostedTournamentIds, setHostedTournamentIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.HOSTED_IDS);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.error('Error loading hosted ids from storage', e);
    }
    return ['kt-tourn-1'];
  });

  // 4. User Registered Interests (categories)
  const [userInterests, setUserInterests] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.USER_INTERESTS);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {}
    return ['Football', 'Basketball'];
  });

  // 5. User Bookmarked/Interested Event IDs
  const [interestedEventIds, setInterestedEventIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.INTERESTED_EVENT_IDS);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {}
    return ['kt-tourn-1', 'kt-tourn-2'];
  });

  // Persist states to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.TOURNAMENTS, JSON.stringify(tournaments));
    } catch (e) {}
  }, [tournaments]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.REGISTRATIONS, JSON.stringify(registrations));
    } catch (e) {}
  }, [registrations]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.HOSTED_IDS, JSON.stringify(hostedTournamentIds));
    } catch (e) {}
  }, [hostedTournamentIds]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.USER_INTERESTS, JSON.stringify(userInterests));
    } catch (e) {}
  }, [userInterests]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.INTERESTED_EVENT_IDS, JSON.stringify(interestedEventIds));
    } catch (e) {}
  }, [interestedEventIds]);

  // 6. UI Modals & Navigation State
  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS);
  const [sortBy, setSortBy] = useState<'featured' | 'fee_asc' | 'popular'>('featured');
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);
  const [showConcluded, setShowConcluded] = useState(false);

  const [selectedTournamentDetail, setSelectedTournamentDetail] = useState<Tournament | null>(null);
  const [selectedTournamentRegister, setSelectedTournamentRegister] = useState<Tournament | null>(null);
  const [isHostModalOpen, setIsHostModalOpen] = useState(false);
  const [isPassesModalOpen, setIsPassesModalOpen] = useState(false);
  const [isHostPortalOpen, setIsHostPortalOpen] = useState(false);
  const [isInterestsModalOpen, setIsInterestsModalOpen] = useState(false);
  const [isAdminHubOpen, setIsAdminHubOpen] = useState(false);
  const [isLegalModalOpen, setIsLegalModalOpen] = useState(false);
  const [isAdminAuth, setIsAdminAuth] = useState(() => isAdminAuthenticated());
  const [pendingReportsCount, setPendingReportsCount] = useState(0);
  const [activeView, setActiveView] = useState<'explore' | 'passes' | 'hosted'>('explore');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [hostModalCategory, setHostModalCategory] = useState<string | undefined>(undefined);
  const [showBackToTop, setShowBackToTop] = useState(false);

  // Floating Back to Top scroll listener
  useEffect(() => {
    const handleScroll = () => {
      setShowBackToTop(window.scrollY > 280);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Track impressions on platform load & subscribe to report & auth updates
  useEffect(() => {
    trackPageImpression();
    const updateReportsCount = () => {
      const reports = getEventReports();
      setPendingReportsCount(reports.filter((r) => r.status === 'pending').length);
    };
    updateReportsCount();

    const handleAuthChange = (e: any) => {
      setIsAdminAuth(Boolean(e.detail?.authenticated));
    };

    window.addEventListener('katatira_reports_updated', updateReportsCount);
    window.addEventListener('katatira_admin_auth_changed', handleAuthChange);
    return () => {
      window.removeEventListener('katatira_reports_updated', updateReportsCount);
      window.removeEventListener('katatira_admin_auth_changed', handleAuthChange);
    };
  }, []);

  // Fetch tournaments from Supabase cloud on load & subscribe to live updates
  useEffect(() => {
    let isMounted = true;
    const syncCloudData = async () => {
      try {
        const cloudTournaments = await fetchCloudTournaments();
        if (isMounted) {
          // Identify any tournaments that have ended and remove from cloud & local
          const expiredCloudItems = cloudTournaments.filter(isEventRegistrationEnded);
          if (expiredCloudItems.length > 0) {
            // Delete from Supabase in background
            expiredCloudItems.forEach((exp) => {
              deleteCloudTournament(exp.id).catch(console.warn);
            });
          }

          const activeCloudTournaments = cloudTournaments.filter(
            (t) => !isEventRegistrationEnded(t)
          );

          setTournaments((prev) => {
            const map = new Map<string, Tournament>();
            // Add INITIAL_TOURNAMENTS (only active ones)
            INITIAL_TOURNAMENTS.filter((t) => !isEventRegistrationEnded(t)).forEach((t) => map.set(t.id, t));
            // Add local storage tournaments (only active ones)
            prev.filter((t) => !isEventRegistrationEnded(t)).forEach((t) => map.set(t.id, t));
            // Active cloud tournaments take precedence
            activeCloudTournaments.forEach((t) => map.set(t.id, t));
            return Array.from(map.values());
          });
        }
      } catch (err) {
        console.warn('Initial cloud sync error:', err);
      }
    };

    syncCloudData();
  }, []);

  // Periodic automatic cleanup: runs every 60 seconds to automatically delete any event whose registration has ended
  useEffect(() => {
    const purgeExpired = () => {
      setTournaments((prev) => {
        const expired = prev.filter(isEventRegistrationEnded);
        if (expired.length === 0) return prev;

        // Auto-delete each expired tournament from cloud
        expired.forEach((exp) => {
          deleteCloudTournament(exp.id).catch(console.warn);
        });

        // Filter them out of active tournaments
        return prev.filter((t) => !isEventRegistrationEnded(t));
      });
    };

    // Run on mount and every 60 seconds
    purgeExpired();
    const interval = setInterval(purgeExpired, 60000);
    return () => clearInterval(interval);
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Add new tournament handler (from Host modal)
  const handleAddTournament = (newTournament: Tournament) => {
    setTournaments((prev) => [newTournament, ...prev]);
    setHostedTournamentIds((prev) => [newTournament.id, ...prev]);
    
    // Save to Supabase Cloud so all users worldwide see it
    publishCloudTournament(newTournament).catch((err) => {
      console.warn('Could not sync tournament to Supabase cloud:', err);
    });

    // Log platform activity
    logActivity({
      type: 'event_host',
      actor: newTournament.hostName || 'Event Host',
      actorContact: newTournament.hostPhone,
      action: 'Published new event',
      targetTitle: newTournament.title,
      targetId: newTournament.id,
      details: `Category: ${newTournament.category} | Fee: Rs. ${newTournament.entryFee} | City: ${newTournament.city}`,
      location: `${newTournament.city}, Nepal`,
      severity: 'info',
    });

    showToast(`"${newTournament.title}" is now published live on KataTira!`);
  };

  // Handle registration success handler
  const handleRegistrationSuccess = (newReg: Registration) => {
    setRegistrations((prev) => [newReg, ...prev]);

    setTournaments((prev) =>
      prev.map((t) =>
        t.id === newReg.tournamentId
          ? { ...t, registeredTeamsCount: t.registeredTeamsCount + 1 }
          : t
      )
    );

    // Save registration to cloud and increment slot counter on cloud
    saveCloudRegistration(newReg).catch(console.warn);
    incrementCloudRegistrationCount(newReg.tournamentId).catch(console.warn);

    // Log platform activity
    logActivity({
      type: 'registration',
      actor: `${newReg.teamName} (Captain: ${newReg.contactPhone})`,
      actorContact: newReg.contactPhone,
      action: 'Registered squad for tournament',
      targetTitle: newReg.tournamentTitle,
      targetId: newReg.tournamentId,
      details: `Pass: ${newReg.confirmationCode} | Fee: Rs. ${newReg.entryFee} | Txn: ${newReg.transactionId || 'QR Paid'}`,
      location: `${newReg.tournamentCity}, Nepal`,
      severity: 'success',
    });

    showToast(`Squad "${newReg.teamName}" registered! 📸 Take a screenshot or photo of your pass!`);
  };

  // Toggle interest in a specific tournament
  const handleToggleInterest = (tournamentId: string) => {
    const targetTournament = tournaments.find((t) => t.id === tournamentId);
    setInterestedEventIds((prev) => {
      const isExisting = prev.includes(tournamentId);
      const updated = isExisting
        ? prev.filter((id) => id !== tournamentId)
        : [...prev, tournamentId];
      
      logActivity({
        type: 'interest_update',
        actor: 'Platform Visitor',
        action: isExisting ? 'Removed bookmark' : 'Bookmarked event for updates',
        targetTitle: targetTournament?.title,
        targetId: tournamentId,
        severity: 'info',
      });

      showToast(
        isExisting
          ? 'Removed event from your saved list'
          : 'Saved to your interests! You can track it under Saved Interests.'
      );
      return updated;
    });
  };

  // Verification & Delist handlers for Admin
  const handleToggleTournamentVerification = (tournamentId: string, isVerified: boolean) => {
    setTournaments((prev) =>
      prev.map((t) => (t.id === tournamentId ? { ...t, isHostVerified: isVerified } : t))
    );
  };

  // Permanently delete a tournament from the platform (Admin & Host)
  const handleDeleteTournament = (tournamentId: string) => {
    const target = tournaments.find((t) => t.id === tournamentId);
    setTournaments((prev) => prev.filter((t) => t.id !== tournamentId));
    setHostedTournamentIds((prev) => prev.filter((id) => id !== tournamentId));
    setInterestedEventIds((prev) => prev.filter((id) => id !== tournamentId));
    setRegistrations((prev) => prev.filter((r) => r.tournamentId !== tournamentId));

    // Delete from Supabase cloud database
    deleteCloudTournament(tournamentId).catch(console.warn);

    logActivity({
      type: 'tournament_delete',
      actor: 'Administrator',
      action: 'Permanently deleted tournament from platform',
      targetTitle: target?.title,
      targetId: tournamentId,
      severity: 'warning',
    });

    showToast(`Event "${target?.title || 'Tournament'}" permanently removed.`);
  };

  const handleDelistTournament = (tournamentId: string) => {
    handleDeleteTournament(tournamentId);
  };

  // Batch purge all concluded/finished events
  const handlePurgeFinishedTournaments = () => {
    const finishedItems = tournaments.filter(isConcludedTournament);
    const count = finishedItems.length;
    if (count === 0) {
      showToast('No concluded events to purge. All current listings are active or upcoming.');
      return;
    }
    const idsToRemove = new Set(finishedItems.map((t) => t.id));
    setTournaments((prev) => prev.filter((t) => !idsToRemove.has(t.id)));
    setHostedTournamentIds((prev) => prev.filter((id) => !idsToRemove.has(id)));
    setInterestedEventIds((prev) => prev.filter((id) => !idsToRemove.has(id)));
    setRegistrations((prev) => prev.filter((r) => !idsToRemove.has(r.tournamentId)));

    logActivity({
      type: 'batch_purge',
      actor: 'Administrator',
      action: `Purged ${count} concluded tournament(s) whose date has ended`,
      severity: 'info',
    });

    showToast(`Purged ${count} finished/concluded event(s).`);
  };

  // Clean out any test or placeholder cards (e.g. 3E2, ASDNAJSD)
  const handleCleanTestTournaments = () => {
    const testItems = tournaments.filter(isTestOrPlaceholderTournament);
    const count = testItems.length;
    if (count === 0) {
      showToast('No placeholder or test data detected. All events are authentic.');
      return;
    }
    const idsToRemove = new Set(testItems.map((t) => t.id));
    setTournaments((prev) => prev.filter((t) => !idsToRemove.has(t.id)));
    setHostedTournamentIds((prev) => prev.filter((id) => !idsToRemove.has(id)));
    setInterestedEventIds((prev) => prev.filter((id) => !idsToRemove.has(id)));
    setRegistrations((prev) => prev.filter((r) => !idsToRemove.has(r.tournamentId)));

    logActivity({
      type: 'batch_purge',
      actor: 'Administrator',
      action: `Scanned and removed ${count} test/placeholder listings`,
      severity: 'info',
    });

    showToast(`Successfully removed ${count} test/placeholder listing(s).`);
  };

  // Category counts for quick badges
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { all: tournaments.length };
    tournaments.forEach((t) => {
      counts[t.category] = (counts[t.category] || 0) + 1;
      if (t.isCharity) {
        counts['Charity & Relief'] = (counts['Charity & Relief'] || 0) + 1;
      }
    });
    return counts;
  }, [tournaments]);

  // Count concluded tournaments
  const concludedCount = useMemo(() => {
    return tournaments.filter(isConcludedTournament).length;
  }, [tournaments]);

  // Filtered & Sorted Tournaments
  const filteredTournaments = useMemo(() => {
    const result = tournaments.filter((t) => {
      // 0. Auto-exclude any event whose registration has ended
      if (isEventRegistrationEnded(t)) {
        return false;
      }

      // 0b. Concluded / past events filter
      if (!showConcluded && isConcludedTournament(t)) {
        return false;
      }

      // 1. Only Interested filter
      if (filters.onlyInterested && !interestedEventIds.includes(t.id)) {
        return false;
      }

      // 2. Category filter
      if (filters.category && filters.category !== 'all') {
        if (filters.category.toLowerCase() === 'charity & relief') {
          if (!t.isCharity && t.category !== 'Charity & Relief') {
            return false;
          }
        } else if (t.category.toLowerCase() !== filters.category.toLowerCase()) {
          return false;
        }
      }

      // 3. City / Location filter via filters.type
      if (filters.type && filters.type !== 'all') {
        const targetCity = filters.type.toLowerCase();
        const matchesCity =
          t.city.toLowerCase() === targetCity ||
          t.location.toLowerCase().includes(targetCity);
        if (!matchesCity) {
          return false;
        }
      }

      // 4. Province filter
      if (filters.province && filters.province !== 'all') {
        const targetProv = filters.province.toLowerCase();
        const tProv = (t.province || '').toLowerCase();
        const tState = (t.stateCountry || '').toLowerCase();
        if (!tProv.includes(targetProv) && !tState.includes(targetProv)) {
          return false;
        }
      }

      // 5. Near Me toggle (highlights Kathmandu valley & central Bagmati hubs or matching current area)
      if (filters.nearMe) {
        const localKeywords = ['bagmati', 'kathmandu', 'lalitpur', 'bhaktapur', 'patan'];
        const tProv = (t.province || '').toLowerCase();
        const tCity = (t.city || '').toLowerCase();
        const isLocal = localKeywords.some((k) => tProv.includes(k) || tCity.includes(k));
        if (!isLocal && !t.isReliefFund) {
          return false;
        }
      }

      // 6. Date Range filter (AD & BS)
      if (filters.selectedDateFilter && filters.selectedDateFilter !== 'all') {
        const startStr = t.startDate || t.date || '';
        const endStr = t.endDate || t.startDate || t.date || '';
        const today = '2026-10-02';

        if (filters.selectedDateFilter === 'this_weekend') {
          // Weekend: Friday Oct 2 to Sunday Oct 4
          const weekendStart = '2026-10-02';
          const weekendEnd = '2026-10-05';
          const overlapsWeekend = (startStr <= weekendEnd && endStr >= weekendStart) || t.isReliefFund;
          if (!overlapsWeekend) return false;
        } else if (filters.selectedDateFilter === 'next_7_days') {
          const sevenDaysLater = '2026-10-09';
          const within7Days = (startStr <= sevenDaysLater && endStr >= today) || t.isReliefFund;
          if (!within7Days) return false;
        } else if (filters.selectedDateFilter === 'this_month') {
          const monthEnd = '2026-10-31';
          const withinMonth = (startStr <= monthEnd && endStr >= '2026-10-01') || t.isReliefFund;
          if (!withinMonth) return false;
        }
      }

      // 7. Only Free Entry filter
      if (filters.onlyFree && t.entryFee > 0) {
        return false;
      }

      // 8. Search query
      if (filters.searchQuery.trim()) {
        const q = filters.searchQuery.toLowerCase();
        const matchesTitle = t.title.toLowerCase().includes(q);
        const matchesCategory = t.category.toLowerCase().includes(q);
        const matchesLocation = t.location.toLowerCase().includes(q);
        const matchesCity = t.city.toLowerCase().includes(q);
        const matchesState = t.stateCountry.toLowerCase().includes(q);
        const matchesProvince = t.province && t.province.toLowerCase().includes(q);
        const matchesDate = (t.date && t.date.toLowerCase().includes(q)) || (t.startDate && t.startDate.toLowerCase().includes(q));
        const matchesType = t.type.toLowerCase().includes(q);
        const matchesHost =
          t.hostName.toLowerCase().includes(q) ||
          (t.hostOrg && t.hostOrg.toLowerCase().includes(q));
        const matchesAge = t.ageGroup.toLowerCase().includes(q);
        const matchesCause = t.causeTitle && t.causeTitle.toLowerCase().includes(q);

        if (
          !matchesTitle &&
          !matchesCategory &&
          !matchesLocation &&
          !matchesCity &&
          !matchesState &&
          !matchesProvince &&
          !matchesDate &&
          !matchesType &&
          !matchesHost &&
          !matchesAge &&
          !matchesCause
        ) {
          return false;
        }
      }

      return true;
    });

    // Sorting
    return result.sort((a, b) => {
      if (sortBy === 'fee_asc') {
        return a.entryFee - b.entryFee;
      }
      if (sortBy === 'popular') {
        return (b.interestedCount || 0) - (a.interestedCount || 0);
      }
      // default featured: featured first, then newest
      if (a.isFeatured && !b.isFeatured) return -1;
      if (!a.isFeatured && b.isFeatured) return 1;
      return 0;
    });
  }, [tournaments, filters, interestedEventIds, sortBy, showConcluded]);

  // Hosted tournaments list
  const userHostedTournaments = useMemo(() => {
    return tournaments.filter((t) => hostedTournamentIds.includes(t.id));
  }, [tournaments, hostedTournamentIds]);

  // Active Category Meta
  const activeCategoryMeta = useMemo(() => {
    if (filters.onlyInterested) {
      return { 
        id: 'interested', 
        label: 'My Saved Interests', 
        description: 'Competitions and initiatives you have saved.' 
      };
    }
    const found = CATEGORIES_LIST.find(
      (c) => c.id.toLowerCase() === (filters.category || 'all').toLowerCase()
    );
    return found || { 
      id: 'all', 
      label: 'All Opportunities', 
      description: 'Explore verified competitions and tournaments in Nepal.' 
    };
  }, [filters.category, filters.onlyInterested]);

  const hasActiveFilters =
    Boolean(filters.searchQuery) ||
    filters.category !== 'all' ||
    filters.onlyFree ||
    filters.onlyInterested ||
    (filters.type !== 'all' && filters.type !== '') ||
    (filters.province && filters.province !== 'all') ||
    filters.nearMe ||
    filters.selectedDateFilter !== 'all' ||
    showConcluded;

  const resetAllFilters = () => {
    setFilters(DEFAULT_FILTERS);
    setShowConcluded(false);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans selection:bg-orange-500 selection:text-white">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-4 z-50 flex items-center gap-2.5 rounded-2xl border border-orange-200 bg-white/95 px-4 py-3 text-sm font-semibold text-slate-900 shadow-xl shadow-slate-900/10 backdrop-blur-md animate-in fade-in slide-in-from-top-2">
          <Sparkles className="h-4 w-4 text-orange-500 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Navigation Header */}
      <Navbar
        onOpenHostModal={() => {
          setHostModalCategory(undefined);
          setIsHostModalOpen(true);
        }}
        onOpenRegistrationsModal={() => setIsPassesModalOpen(true)}
        onOpenPassesModal={() => setIsPassesModalOpen(true)}
        onOpenHostPortal={() => setIsHostPortalOpen(true)}
        onOpenInterestsModal={() => setIsInterestsModalOpen(true)}
        onOpenAdminHub={() => setIsAdminHubOpen(true)}
        pendingReportsCount={pendingReportsCount}
        registrationsCount={registrations.length}
        hostedCount={userHostedTournaments.length}
        activeView={activeView}
        setActiveView={setActiveView}
        searchQuery={filters.searchQuery}
        onSearchChange={(query) => setFilters({ ...filters, searchQuery: query })}
      />

      {/* MAIN CONTAINER: UNSTOP-STYLE CLEAN DISCOVERY LAYOUT */}
      <div id="tournaments-grid-section" className="w-full flex-1 px-3 sm:px-5 lg:px-6 py-4 sm:py-6">
        <div className="flex flex-col md:flex-row items-start gap-4 lg:gap-6">
          
          {/* SEGMENTED LEFT SIDEBAR: FILTERS & NAVIGATION */}
          <LeftSidebar
            filters={filters}
            onFilterChange={setFilters}
            onOpenHostModal={() => {
              setHostModalCategory(undefined);
              setIsHostModalOpen(true);
            }}
            onOpenHostPortal={() => setIsHostPortalOpen(true)}
            onOpenRegistrationsModal={() => setIsPassesModalOpen(true)}
            onOpenInterestsModal={() => setIsInterestsModalOpen(true)}
            onOpenAdminHub={() => setIsAdminHubOpen(true)}
            pendingReportsCount={pendingReportsCount}
            registrationsCount={registrations.length}
            hostedCount={userHostedTournaments.length}
            userInterestedIds={interestedEventIds}
            userInterests={userInterests}
            tournaments={tournaments}
            isMobileOpen={isMobileFiltersOpen}
            onCloseMobile={() => setIsMobileFiltersOpen(false)}
          />

          {/* MAIN OPPORTUNITY FEED (DIRECT DISCOVERY - NO ROADBLOCKS) */}
          <main className="w-full flex-1 min-w-0 space-y-4 sm:space-y-5">
            
            {/* 1. UNSTOP-STYLE HORIZONTAL CATEGORY PILL STRIP (STICKY SEARCH & FILTERS ON SCROLL) */}
            <div className="sticky top-16 z-30 bg-slate-50/95 backdrop-blur-md pt-2 pb-2.5 -mx-3 px-3 sm:mx-0 sm:px-0 border-b border-slate-200/60 transition-all">
              {/* Compact Mobile Search Input (Visible only on mobile devices) */}
              <div className="sm:hidden mb-2 px-0.5">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                  <input
                    type="text"
                    value={filters.searchQuery}
                    onChange={(e) => setFilters({ ...filters, searchQuery: e.target.value })}
                    placeholder="Search tournaments, events, flood relief..."
                    className="w-full rounded-xl border border-slate-200 bg-white pl-8.5 pr-8 py-2 text-xs text-slate-900 placeholder-slate-400 focus:border-orange-500 focus:outline-none transition-all shadow-2xs"
                  />
                  {filters.searchQuery && (
                    <button
                      onClick={() => setFilters({ ...filters, searchQuery: '' })}
                      className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-1 text-slate-400 hover:bg-slate-200 hover:text-slate-700"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none no-scrollbar flex-nowrap">
                {CATEGORY_TABS.map((tab) => {
                  const Icon = tab.icon;
                  const isSelected = filters.category.toLowerCase() === tab.id.toLowerCase() && !filters.onlyInterested;
                  const count = categoryCounts[tab.id] || 0;

                  return (
                    <button
                      key={tab.id}
                      onClick={() => {
                        setFilters({
                          ...filters,
                          category: tab.id,
                          onlyInterested: false,
                        });
                      }}
                      className={`flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-bold shrink-0 transition-all shadow-2xs border ${
                        isSelected
                          ? tab.isRelief
                            ? 'bg-rose-600 border-rose-600 text-white shadow-xs'
                            : 'bg-slate-900 border-slate-900 text-white shadow-xs'
                          : tab.isRelief
                            ? 'bg-rose-50 border-rose-200 text-rose-700 hover:bg-rose-100'
                            : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      <Icon className={`h-3.5 w-3.5 ${isSelected ? 'text-white' : tab.isRelief ? 'text-rose-600' : 'text-orange-500'}`} />
                      <span>{tab.label}</span>
                      <span
                        className={`rounded-full px-1.5 py-0.2 text-[10px] font-extrabold ${
                          isSelected
                            ? 'bg-white/20 text-white'
                            : tab.isRelief
                              ? 'bg-rose-200/60 text-rose-800'
                              : 'bg-slate-100 text-slate-500'
                        }`}
                      >
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 2. FLOOD RELIEF COMPACT NOTIFICATION (NON-BLOCKING) */}
            {filters.category === 'Charity & Relief' && (
              <div className="rounded-2xl border border-rose-200 bg-gradient-to-r from-rose-50 via-red-50 to-orange-50 px-4 py-3 sm:px-5 sm:py-3.5 shadow-2xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-rose-600 text-white shadow-xs">
                      <HeartHandshake className="h-4 w-4" />
                    </div>
                    <div>
                      <h3 className="font-display text-xs sm:text-sm font-bold text-slate-900 leading-tight">
                        Monsoon Disaster Relief & Flood Emergency Appeal 2026
                      </h3>
                      <p className="text-[11px] text-slate-600 mt-0.5">
                        Direct contributions reach the Prime Minister’s Disaster Relief Fund (प्रधानमन्त्री दैवी प्रकोप उद्धार कोष) & Nepal Red Cross.
                      </p>
                    </div>
                  </div>

                  <a
                    href="https://opmcm.gov.np"
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 px-3.5 py-1.5 text-xs font-bold text-white shadow-xs transition-all shrink-0"
                  >
                    <span>Official Portal</span>
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              </div>
            )}

            {/* 3. TOOLBAR: RESULTS COUNT, QUICK TOGGLES, CITY & SORT */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200/80 pb-3">
              {/* Left: Active Title & Count */}
              <div className="flex items-center gap-2">
                <h1 className="font-display text-base sm:text-lg font-bold text-slate-900 leading-none">
                  {filters.searchQuery
                    ? `Results for "${filters.searchQuery}"`
                    : activeCategoryMeta.label}
                </h1>
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-bold text-slate-600">
                  {filteredTournaments.length} {filteredTournaments.length === 1 ? 'event' : 'events'}
                </span>
              </div>

              {/* Right: Quick Action Controls (Smooth horizontal scroll on mobile) */}
              <div className="w-full sm:w-auto flex items-center gap-2 text-xs overflow-x-auto pb-1 scrollbar-none no-scrollbar flex-nowrap -mx-3 px-3 sm:mx-0 sm:px-0 sm:flex-wrap">
                {/* Free Only Toggle Pill */}
                <button
                  onClick={() => setFilters({ ...filters, onlyFree: !filters.onlyFree })}
                  className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 font-bold transition-all border shrink-0 ${
                    filters.onlyFree
                      ? 'bg-emerald-600 border-emerald-600 text-white shadow-2xs'
                      : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <span className={`h-1.5 w-1.5 rounded-full ${filters.onlyFree ? 'bg-white' : 'bg-emerald-500'}`} />
                  <span>Free Entry</span>
                </button>

                {/* Saved Interests Toggle Pill */}
                <button
                  onClick={() => setFilters({ ...filters, onlyInterested: !filters.onlyInterested })}
                  className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 font-bold transition-all border shrink-0 ${
                    filters.onlyInterested
                      ? 'bg-orange-500 border-orange-500 text-white shadow-2xs'
                      : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <Heart className={`h-3 w-3 ${filters.onlyInterested ? 'fill-white text-white' : 'text-orange-500'}`} />
                  <span>Saved ({interestedEventIds.length})</span>
                </button>


                {/* Near Me Quick Toggle Pill */}
                <button
                  onClick={() => setFilters({ ...filters, nearMe: !filters.nearMe })}
                  className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 font-bold transition-all border shrink-0 ${
                    filters.nearMe
                      ? 'bg-emerald-600 border-emerald-600 text-white shadow-2xs'
                      : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                  title="Local opportunities in Nepal"
                >
                  <Navigation className={`h-3 w-3 ${filters.nearMe ? 'text-white' : 'text-emerald-600'}`} />
                  <span>Near Me</span>
                </button>

                {/* Province Filter Quick Dropdown */}
                <select
                  value={filters.province || 'all'}
                  onChange={(e) => setFilters({ ...filters, province: e.target.value, nearMe: false })}
                  className="rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 focus:border-orange-500 focus:outline-none shrink-0"
                >
                  <option value="all">All Provinces</option>
                  <option value="Bagmati">Bagmati Province</option>
                  <option value="Gandaki">Gandaki Province</option>
                  <option value="Koshi">Koshi Province</option>
                  <option value="Lumbini">Lumbini Province</option>
                  <option value="Madhesh">Madhesh Province</option>
                  <option value="Karnali">Karnali Province</option>
                  <option value="Sudurpashchim">Sudurpashchim Province</option>
                </select>

                {/* Date Range Quick Dropdown */}
                <select
                  value={filters.selectedDateFilter || 'all'}
                  onChange={(e) => setFilters({ ...filters, selectedDateFilter: e.target.value as any })}
                  className="rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 focus:border-orange-500 focus:outline-none shrink-0"
                >
                  <option value="all">All Dates</option>
                  <option value="this_weekend">This Weekend</option>
                  <option value="next_7_days">Next 7 Days</option>
                  <option value="this_month">This Month</option>
                </select>

                {/* City Filter Quick Dropdown */}
                <select
                  value={filters.type === '' ? 'all' : filters.type}
                  onChange={(e) => setFilters({ ...filters, type: e.target.value })}
                  className="rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 focus:border-orange-500 focus:outline-none shrink-0"
                >
                  <option value="all">All Cities</option>
                  <option value="Kathmandu">Kathmandu</option>
                  <option value="Lalitpur">Lalitpur</option>
                  <option value="Pokhara">Pokhara</option>
                  <option value="Dharan">Dharan</option>
                  <option value="Chitwan">Chitwan</option>
                  <option value="Online">Online / Remote</option>
                </select>

                {/* Sort Dropdown */}
                <div className="flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 shrink-0">
                  <ArrowUpDown className="h-3 w-3 text-slate-400" />
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as any)}
                    className="bg-transparent text-xs font-semibold text-slate-700 focus:outline-none cursor-pointer"
                  >
                    <option value="featured">Featured First</option>
                    <option value="fee_asc">Entry Fee: Low to High</option>
                    <option value="popular">Most Interested</option>
                  </select>
                </div>

                {/* Mobile Filter Sheet Button */}
                <button
                  onClick={() => setIsMobileFiltersOpen(true)}
                  className="md:hidden inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50"
                >
                  <SlidersHorizontal className="h-3 w-3 text-orange-500" />
                  <span>Filters</span>
                </button>

                {/* Reset Filters button if any active */}
                {hasActiveFilters && (
                  <button
                    onClick={resetAllFilters}
                    className="inline-flex items-center gap-1 rounded-xl border border-rose-200 bg-rose-50 px-2.5 py-1.5 text-xs font-bold text-rose-700 hover:bg-rose-100 transition-colors"
                    title="Clear all active filters"
                  >
                    <X className="h-3 w-3" />
                    <span>Clear</span>
                  </button>
                )}
              </div>
            </div>

            {/* 4. OPPORTUNITIES GRID - DISPLAYED INSTANTLY (UNSTOP STYLE) */}
            {filteredTournaments.length === 0 ? (
              <div className="rounded-3xl border border-slate-200/90 bg-gradient-to-b from-orange-50/40 via-white to-slate-50/50 p-8 sm:p-14 text-center my-4 shadow-xs relative overflow-hidden">
                {/* Soft ambient background glow */}
                <div className="absolute -top-16 left-1/2 -translate-x-1/2 h-36 w-80 bg-orange-400/10 rounded-full blur-3xl pointer-events-none" />

                {/* Friendly Illustration / Category Icon Badge */}
                <div className="relative mx-auto mb-4 flex h-16 w-16 sm:h-20 sm:w-20 items-center justify-center rounded-3xl bg-gradient-to-tr from-orange-500 to-amber-400 text-white shadow-xl shadow-orange-500/20 ring-8 ring-orange-500/10">
                  {filters.onlyInterested ? (
                    <Heart className="h-8 w-8 sm:h-9 sm:w-9 fill-white" />
                  ) : filters.category === 'Charity & Relief' ? (
                    <HeartHandshake className="h-8 w-8 sm:h-9 sm:w-9" />
                  ) : filters.searchQuery ? (
                    <Search className="h-8 w-8 sm:h-9 sm:w-9 text-white" />
                  ) : (
                    (() => {
                      const CatIcon = CATEGORY_TABS.find(t => t.id.toLowerCase() === filters.category.toLowerCase())?.icon || Trophy;
                      return <CatIcon className="h-8 w-8 sm:h-9 sm:w-9 text-white" />;
                    })()
                  )}
                  {/* Plus badge on icon */}
                  <div className="absolute -bottom-1 -right-1 flex h-6 w-6 sm:h-7 sm:w-7 items-center justify-center rounded-full bg-slate-950 text-white border-2 border-white shadow-xs">
                    <Sparkles className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-amber-400" />
                  </div>
                </div>

                {/* Dynamic Tag */}
                <div className="inline-flex items-center gap-1.5 rounded-full bg-orange-100/80 px-3 py-1 text-[11px] font-bold text-orange-800 mb-3 border border-orange-200/60">
                  <Sparkles className="h-3 w-3 text-orange-500" />
                  <span>
                    {filters.onlyInterested
                      ? 'Saved Watchlist'
                      : filters.category !== 'all'
                      ? 'Open for First Organizer'
                      : 'No Matching Events'}
                  </span>
                </div>

                {/* Heading */}
                <h3 className="font-display text-lg sm:text-xl font-extrabold text-slate-900 tracking-tight">
                  {filters.onlyInterested
                    ? 'No saved opportunities yet'
                    : filters.category !== 'all'
                    ? `No events found in ${activeCategoryMeta.label}`
                    : filters.searchQuery
                    ? `No events matching "${filters.searchQuery}"`
                    : 'No tournaments match your current filters'}
                </h3>

                {/* Friendly Description with prompt */}
                <p className="text-xs sm:text-sm text-slate-600 max-w-md mx-auto mt-2 mb-6 leading-relaxed">
                  {filters.onlyInterested
                    ? 'Click the heart button on any tournament or disaster relief appeal card to bookmark it here for fast access.'
                    : filters.category !== 'all'
                    ? `No events found in this category yet. Be the first to bring ${activeCategoryMeta.label} to the community — host one yourself for free!`
                    : filters.searchQuery
                    ? `We couldn't find any tournaments or drives matching "${filters.searchQuery}". Try a broader term or host this event yourself.`
                    : 'Try resetting some filters or create a new tournament listing for your college or club.'}
                </p>

                {/* Action Buttons */}
                <div className="flex flex-wrap items-center justify-center gap-3">
                  <button
                    onClick={() => {
                      setHostModalCategory(filters.category !== 'all' ? filters.category : undefined);
                      setIsHostModalOpen(true);
                    }}
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-orange-500 hover:bg-orange-600 px-5 py-2.5 text-xs sm:text-sm font-bold text-white shadow-md shadow-orange-500/25 transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
                  >
                    <PlusCircle className="h-4 w-4" />
                    <span>
                      {filters.category !== 'all'
                        ? `Host an Event in ${activeCategoryMeta.label}`
                        : 'Host one yourself!'}
                    </span>
                  </button>

                  <button
                    onClick={resetAllFilters}
                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 px-4 py-2.5 text-xs sm:text-sm font-bold text-slate-700 transition-all shadow-2xs hover:border-slate-300 cursor-pointer"
                  >
                    <LayoutGrid className="h-3.5 w-3.5 text-slate-400" />
                    <span>Explore All Categories</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4 sm:gap-5">
                {filteredTournaments.map((tournament) => (
                  <TournamentCard
                    key={tournament.id}
                    tournament={tournament}
                    isInterested={interestedEventIds.includes(tournament.id)}
                    onSelect={(t) => setSelectedTournamentDetail(t)}
                    onRegister={(t) => setSelectedTournamentRegister(t)}
                    onToggleInterest={handleToggleInterest}
                  />
                ))}
              </div>
            )}
          </main>
        </div>
      </div>

      {/* MODALS */}
      {/* 1. Register Interests Modal */}
      {isInterestsModalOpen && (
        <RegisterInterestsModal
          isOpen={isInterestsModalOpen}
          onClose={() => setIsInterestsModalOpen(false)}
          selectedInterests={userInterests}
          onSaveInterests={(newInterests) => {
            setUserInterests(newInterests);
            showToast('Your competitive interests have been saved!');
          }}
        />
      )}

      {/* 2. Tournament Details & Poster Modal */}
      {selectedTournamentDetail && (
        <TournamentDetailModal
          tournament={selectedTournamentDetail}
          isInterested={interestedEventIds.includes(selectedTournamentDetail.id)}
          onClose={() => setSelectedTournamentDetail(null)}
          onToggleInterest={handleToggleInterest}
          onRegister={(t) => {
            setSelectedTournamentDetail(null);
            setSelectedTournamentRegister(t);
          }}
        />
      )}

      {/* 3. Host a Tournament / Competition Modal */}
      {isHostModalOpen && (
        <HostTournamentModal
          isOpen={isHostModalOpen}
          initialCategory={hostModalCategory}
          onClose={() => {
            setIsHostModalOpen(false);
            setHostModalCategory(undefined);
          }}
          onAddTournament={handleAddTournament}
        />
      )}

      {/* 4. Integrated Registration & Payment Gateway Modal */}
      {selectedTournamentRegister && (
        <RegistrationPaymentModal
          tournament={selectedTournamentRegister}
          isOpen={Boolean(selectedTournamentRegister)}
          onClose={() => setSelectedTournamentRegister(null)}
          onSuccess={handleRegistrationSuccess}
        />
      )}

      {/* 5. My Passes & Digital QR Codes Modal */}
      {isPassesModalOpen && (
        <MyPassesModal
          isOpen={isPassesModalOpen}
          onClose={() => setIsPassesModalOpen(false)}
          registrations={registrations}
          onExploreClick={() => {
            const element = document.getElementById('tournaments-grid-section');
            element?.scrollIntoView({ behavior: 'smooth' });
          }}
        />
      )}

      {/* 6. Host Portal & Organizer Dashboard Modal */}
      {isHostPortalOpen && (
        <HostPortalModal
          isOpen={isHostPortalOpen}
          onClose={() => setIsHostPortalOpen(false)}
          hostedTournaments={userHostedTournaments}
          allRegistrations={registrations}
          onOpenHostModal={() => setIsHostModalOpen(true)}
          onSelectTournament={(t) => setSelectedTournamentDetail(t)}
          onDeleteTournament={handleDeleteTournament}
        />
      )}

      {/* 7. Platform Insights & Admin Hub Modal */}
      {isAdminHubOpen && (
        <AdminHubModal
          isOpen={isAdminHubOpen}
          onClose={() => setIsAdminHubOpen(false)}
          tournaments={tournaments}
          registrations={registrations}
          onToggleTournamentVerification={handleToggleTournamentVerification}
          onDelistTournament={handleDelistTournament}
          onDeleteTournament={handleDeleteTournament}
          onPurgeFinishedTournaments={handlePurgeFinishedTournaments}
          onCleanTestTournaments={handleCleanTestTournaments}
        />
      )}

      {/* 8. Nepal Legal Framework & Regulatory Compliance Modal */}
      <NepalLegalComplianceModal
        isOpen={isLegalModalOpen}
        onClose={() => setIsLegalModalOpen(false)}
      />

      {/* Footer */}
      <footer className="mt-16 border-t border-slate-200 bg-white py-10 text-slate-500 text-xs">
        <div className="w-full px-3 sm:px-5 lg:px-6 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-1.5 text-center md:text-left">
            <div className="flex items-center justify-center md:justify-start gap-2">
              <span className="font-brand font-black text-xl tracking-tight text-slate-900">
                Kata<span className="text-orange-500">Tira</span>
              </span>
              <span className="text-slate-300">|</span>
              <span className="text-slate-700 font-semibold">Competitions & Relief Hub of Nepal</span>
            </div>
            <p className="text-slate-500 text-[11px] max-w-lg leading-relaxed">
              Nepal's official open tournament discovery platform. KataTira connects athletes, students, and clubs directly with verified event organizers.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3 text-center sm:text-right">
            <span className="text-slate-400 text-[11px]">Kathmandu, Pokhara & All 7 Provinces</span>
            <span className="hidden sm:inline text-slate-200">|</span>
            <button
              onClick={() => setIsLegalModalOpen(true)}
              className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-400 hover:text-slate-700 transition-colors"
              title="Nepal Laws & Regulatory Compliance"
            >
              <Scale className="h-3 w-3 text-slate-400" />
              <span>Nepal Law Compliance</span>
            </button>
            <span className="hidden sm:inline text-slate-200">|</span>
            <button
              onClick={() => setIsAdminHubOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-[11px] font-medium text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
              title="Restricted admin portal for KataTira platform owners"
            >
              <Lock className="h-3 w-3 text-slate-400" />
              <span>Admin Portal</span>
              {pendingReportsCount > 0 && (
                <span className="flex h-3.5 min-w-3.5 px-1 items-center justify-center rounded-full bg-amber-500 text-white text-[9px] font-bold">
                  {pendingReportsCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </footer>

      {/* Floating quick-access badge ONLY visible to authenticated admin sessions */}
      {isAdminAuth && (
        <div className="fixed bottom-4 right-4 z-40 flex items-center gap-2 rounded-2xl border border-slate-700 bg-slate-900/95 backdrop-blur-md px-3.5 py-2 text-white shadow-xl text-xs animate-in slide-in-from-bottom-2 font-sans">
          <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="font-semibold text-slate-200">Admin Mode</span>
          <button
            onClick={() => setIsAdminHubOpen(true)}
            className="ml-1 rounded-lg bg-orange-500 hover:bg-orange-600 px-2.5 py-1 font-bold text-white transition-colors"
          >
            Dashboard
          </button>
        </div>
      )}

      {/* Floating Back to Top Button */}
      {showBackToTop && (
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className={`fixed ${
            isAdminAuth ? 'bottom-16 right-4 sm:bottom-20 sm:right-6' : 'bottom-5 right-5 sm:bottom-6 sm:right-6'
          } z-40 flex items-center gap-1.5 rounded-full bg-slate-900/95 hover:bg-orange-500 text-white px-3.5 py-2 sm:px-4 sm:py-2.5 shadow-xl shadow-slate-900/25 backdrop-blur-md border border-white/20 transition-all duration-300 hover:scale-105 active:scale-95 animate-in fade-in slide-in-from-bottom-4 group cursor-pointer`}
          title="Back to Top"
          aria-label="Back to Top"
        >
          <ArrowUp className="h-4 w-4 transition-transform duration-200 group-hover:-translate-y-0.5" />
          <span className="text-xs font-bold">Top</span>
        </button>
      )}
    </div>
  );
}
