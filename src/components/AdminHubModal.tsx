import React, { useState, useEffect } from 'react';
import {
  X,
  Activity,
  ShieldCheck,
  Flag,
  Users,
  Search,
  Download,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Phone,
  Mail,
  ExternalLink,
  Building2,
  Eye,
  Filter,
  RefreshCw,
  SlidersHorizontal,
  ChevronRight,
  UserCheck,
  UserX,
  FileSpreadsheet,
  Lock,
  Unlock,
  KeyRound,
  Settings,
  Copy,
  Check,
  Trash2,
  Calendar,
  Trophy,
  ShieldAlert
} from 'lucide-react';
import { ActivityLog, EventReport, OrganizerProfile, Registration, Tournament } from '../types';
import {
  getActivityLogs,
  getEventReports,
  getOrganizers,
  getPageStats,
  updateEventReportStatus,
  toggleOrganizerVerification,
  verifyAdminPin,
  isAdminAuthenticated,
  clearAdminSession,
  getAdminPin,
  setAdminPin,
  clearAllActivityLogs
} from '../utils/activityTracker';

interface AdminHubModalProps {
  isOpen: boolean;
  onClose: () => void;
  tournaments: Tournament[];
  registrations: Registration[];
  onToggleTournamentVerification?: (tournamentId: string, isVerified: boolean) => void;
  onDelistTournament?: (tournamentId: string) => void;
  onDeleteTournament?: (tournamentId: string) => void;
  onPurgeFinishedTournaments?: () => void;
  onCleanTestTournaments?: () => void;
}

export const AdminHubModal: React.FC<AdminHubModalProps> = ({
  isOpen,
  onClose,
  tournaments,
  registrations,
  onToggleTournamentVerification,
  onDelistTournament,
  onDeleteTournament,
  onPurgeFinishedTournaments,
  onCleanTestTournaments,
}) => {
  const [activeTab, setActiveTab] = useState<'activity' | 'tournaments' | 'registrations' | 'reports' | 'organizers' | 'settings'>('activity');
  const [eventFilter, setEventFilter] = useState<'all' | 'active' | 'finished' | 'relief'>('all');
  const [eventSearchQuery, setEventSearchQuery] = useState('');
  const [isUnlocked, setIsUnlocked] = useState<boolean>(() => isAdminAuthenticated());
  const [enteredPin, setEnteredPin] = useState('');
  const [pinError, setPinError] = useState('');
  const [showPin, setShowPin] = useState(false);

  // Settings tab states
  const [oldPin, setOldPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [settingsStatus, setSettingsStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [reports, setReports] = useState<EventReport[]>([]);
  const [organizers, setOrganizers] = useState<OrganizerProfile[]>([]);
  const [pageStats, setPageStats] = useState({ impressions: 1420, uniqueVisitors: 890 });

  // Filters
  const [activityFilter, setActivityFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [adminNoteInput, setAdminNoteInput] = useState<{ [reportId: string]: string }>({});
  const [actionSuccessMsg, setActionSuccessMsg] = useState<string | null>(null);

  // Re-verify auth when opening
  useEffect(() => {
    if (isOpen) {
      setIsUnlocked(isAdminAuthenticated());
      setEnteredPin('');
      setPinError('');
    }
  }, [isOpen]);

  const handleUnlock = (e: React.FormEvent) => {
    e.preventDefault();
    if (!enteredPin.trim()) {
      setPinError('Please enter your admin passcode.');
      return;
    }
    const isValid = verifyAdminPin(enteredPin);
    if (isValid) {
      setIsUnlocked(true);
      setPinError('');
      loadData();
    } else {
      setPinError('Incorrect admin passcode. Please try again.');
    }
  };

  const handleLogout = () => {
    clearAdminSession();
    setIsUnlocked(false);
    setEnteredPin('');
    showNotification('Logged out of Admin Session. Lock active.');
  };

  const handleChangePin = (e: React.FormEvent) => {
    e.preventDefault();
    const currentStoredPin = getAdminPin();
    if (oldPin.trim() !== currentStoredPin) {
      setSettingsStatus({ type: 'error', message: 'Current passcode is incorrect.' });
      return;
    }
    if (newPin.trim().length < 4) {
      setSettingsStatus({ type: 'error', message: 'New passcode must be at least 4 characters.' });
      return;
    }
    if (newPin.trim() !== confirmPin.trim()) {
      setSettingsStatus({ type: 'error', message: 'New passcodes do not match.' });
      return;
    }

    const success = setAdminPin(newPin.trim());
    if (success) {
      setSettingsStatus({ type: 'success', message: 'Admin passcode updated successfully!' });
      setOldPin('');
      setNewPin('');
      setConfirmPin('');
    } else {
      setSettingsStatus({ type: 'error', message: 'Failed to update passcode.' });
    }
  };

  const handleClearLogs = () => {
    if (window.confirm('Are you sure you want to reset activity logs? This cannot be undone.')) {
      clearAllActivityLogs();
      loadData();
      showNotification('Activity logs reset.');
    }
  };

  // Load and subscribe to real-time events
  const loadData = () => {
    setActivities(getActivityLogs());
    setReports(getEventReports());
    setOrganizers(getOrganizers());
    setPageStats(getPageStats());
  };

  useEffect(() => {
    loadData();

    const handleActivityUpdate = () => loadData();
    const handleReportsUpdate = () => loadData();
    const handleOrganizersUpdate = () => loadData();

    window.addEventListener('katatira_activity_updated', handleActivityUpdate);
    window.addEventListener('katatira_reports_updated', handleReportsUpdate);
    window.addEventListener('katatira_organizers_updated', handleOrganizersUpdate);

    return () => {
      window.removeEventListener('katatira_activity_updated', handleActivityUpdate);
      window.removeEventListener('katatira_reports_updated', handleReportsUpdate);
      window.removeEventListener('katatira_organizers_updated', handleOrganizersUpdate);
    };
  }, [isOpen]);

  const showNotification = (msg: string) => {
    setActionSuccessMsg(msg);
    setTimeout(() => setActionSuccessMsg(null), 3000);
  };

  // Handlers for reports
  const handleSetReportStatus = (reportId: string, status: EventReport['status']) => {
    const note = adminNoteInput[reportId] || '';
    updateEventReportStatus(reportId, status, note);
    showNotification(`Report marked as ${status.toUpperCase()}`);
    loadData();
  };

  const handleDelistFromReport = (tournamentId: string, reportId: string) => {
    if (onDelistTournament) {
      onDelistTournament(tournamentId);
    }
    updateEventReportStatus(reportId, 'resolved', 'Tournament delisted from public board.');
    showNotification('Tournament delisted from public discovery');
    loadData();
  };

  // Handlers for organizers
  const handleToggleOrganizer = (org: OrganizerProfile) => {
    const updated = toggleOrganizerVerification(org.id, !org.isVerified);
    if (updated) {
      // Also update matching tournaments verification if handler available
      tournaments.forEach((t) => {
        if (
          t.hostName?.toLowerCase() === org.name.toLowerCase() ||
          t.hostOrg?.toLowerCase() === org.name.toLowerCase()
        ) {
          if (onToggleTournamentVerification) {
            onToggleTournamentVerification(t.id, updated.isVerified);
          }
        }
      });
      showNotification(
        updated.isVerified
          ? `Verified "${org.name}". Verification badge active on tournaments!`
          : `Revoked verification for "${org.name}".`
      );
      loadData();
    }
  };

  // Export handlers
  const exportActivityCSV = () => {
    const headers = ['Timestamp', 'Type', 'Actor', 'Action', 'Target', 'Details', 'Location'];
    const rows = activities.map((a) => [
      `"${a.timestamp}"`,
      `"${a.type}"`,
      `"${a.actor || ''}"`,
      `"${a.action || ''}"`,
      `"${a.targetTitle || ''}"`,
      `"${a.details || ''}"`,
      `"${a.location || ''}"`,
    ]);
    const csvContent = [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `katatira_activity_log_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportRegistrationsCSV = () => {
    const headers = [
      'Registration ID',
      'Tournament',
      'Team Name',
      'Contact Email',
      'Contact Phone',
      'Entry Fee',
      'Payment Status',
      'Transaction ID',
      'Date Registered',
    ];
    const rows = registrations.map((r) => [
      `"${r.id}"`,
      `"${r.tournamentTitle}"`,
      `"${r.teamName}"`,
      `"${r.contactEmail}"`,
      `"${r.contactPhone}"`,
      `"Rs. ${r.entryFee}"`,
      `"${r.paymentStatus}"`,
      `"${r.transactionId || 'N/A'}"`,
      `"${r.registeredAt}"`,
    ]);
    const csvContent = [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `katatira_registered_teams_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filter activities
  const filteredActivities = activities.filter((act) => {
    if (activityFilter !== 'all' && act.type !== activityFilter) return false;
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      act.actor?.toLowerCase().includes(q) ||
      act.action?.toLowerCase().includes(q) ||
      act.targetTitle?.toLowerCase().includes(q) ||
      act.details?.toLowerCase().includes(q)
    );
  });

  // Filter registered teams
  const filteredRegistrations = registrations.filter((reg) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      reg.teamName.toLowerCase().includes(q) ||
      reg.tournamentTitle.toLowerCase().includes(q) ||
      reg.contactPhone.toLowerCase().includes(q) ||
      reg.contactEmail.toLowerCase().includes(q) ||
      (reg.transactionId && reg.transactionId.toLowerCase().includes(q))
    );
  });

  const pendingReportsCount = reports.filter((r) => r.status === 'pending').length;
  const totalFeesFacilitated = registrations.reduce((sum, r) => sum + (r.entryFee || 0), 0);

  if (!isOpen) return null;

  if (!isUnlocked) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-slate-950/75 backdrop-blur-md animate-in fade-in duration-200">
        <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden font-sans">
          {/* Header */}
          <div className="bg-slate-900 p-6 text-white text-center relative">
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-1.5 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-orange-500 text-white shadow-lg mb-3">
              <Lock className="h-7 w-7" />
            </div>
            <h3 className="text-xl font-bold tracking-tight text-white">Admin Security Access</h3>
            <p className="text-xs text-slate-300 mt-1 max-w-xs mx-auto">
              Restricted portal for KataTira owners & event moderators
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleUnlock} className="p-6 space-y-4">
            <div className="rounded-xl bg-amber-50 border border-amber-200 p-3 text-left">
              <p className="text-xs text-amber-900 leading-relaxed">
                <strong>Confidential Area:</strong> Restricted access containing participant phone numbers, payment transaction IDs, and verified organizer controls.
              </p>
            </div>


            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Admin Passcode / PIN
              </label>
              <div className="relative">
                <KeyRound className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type={showPin ? 'text' : 'password'}
                  value={enteredPin}
                  onChange={(e) => {
                    setEnteredPin(e.target.value);
                    setPinError('');
                  }}
                  placeholder="Paste or type master passcode"
                  autoFocus
                  className="w-full rounded-xl border border-slate-300 bg-slate-50 pl-10 pr-16 py-2.5 text-xs sm:text-sm font-semibold text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-orange-500 focus:outline-none transition-all shadow-2xs"
                />
                <button
                  type="button"
                  onClick={() => setShowPin(!showPin)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-500 hover:text-slate-800 px-1"
                >
                  {showPin ? 'Hide' : 'Show'}
                </button>
              </div>
              {pinError && (
                <p className="mt-1.5 text-xs font-semibold text-rose-600 flex items-center gap-1">
                  <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                  <span>{pinError}</span>
                </p>
              )}
            </div>

            <div className="pt-1">
              <button
                type="submit"
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-orange-500 hover:bg-orange-600 py-3 px-4 text-sm font-bold text-white shadow-md transition-all active:scale-[0.98]"
              >
                <Unlock className="h-4 w-4" />
                <span>Unlock Admin Dashboard</span>
              </button>
            </div>

            <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
              <span>Change passcode anytime inside <strong>Settings</strong></span>
              <button
                type="button"
                onClick={onClose}
                className="font-semibold text-slate-600 hover:text-slate-900"
              >
                Cancel & Return
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-5xl bg-white rounded-2xl shadow-2xl border border-slate-200 flex flex-col max-h-[92vh] overflow-hidden">
        
        {/* HEADER */}
        <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-slate-200 bg-slate-900 text-white shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-500 text-white shadow-xs">
              <Activity className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-bold text-white tracking-tight">
                  KataTira Platform Insights & Admin Hub
                </h3>
                <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                  Authenticated
                </span>
              </div>
              <p className="text-xs text-slate-300">
                Audit visitor actions, check verified organizers, and resolve event reports
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors"
              title="Lock admin session and log out"
            >
              <Lock className="h-3.5 w-3.5 text-orange-400" />
              <span className="hidden sm:inline">Lock Session</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
              title="Close Admin Hub"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* NOTIFICATION TOAST */}
        {actionSuccessMsg && (
          <div className="bg-emerald-600 text-white text-xs font-semibold px-4 py-2 flex items-center justify-between animate-in slide-in-from-top">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4" />
              <span>{actionSuccessMsg}</span>
            </div>
            <button onClick={() => setActionSuccessMsg(null)} className="text-white/80 hover:text-white">
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        )}

        {/* METRICS BAR */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4 p-4 border-b border-slate-200 bg-slate-50 shrink-0 text-xs">
          <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-2xs">
            <div className="flex items-center justify-between text-slate-500 mb-1">
              <span className="font-semibold">Page Impressions</span>
              <Eye className="h-3.5 w-3.5 text-blue-500" />
            </div>
            <div className="text-lg font-bold text-slate-900">{pageStats.impressions.toLocaleString()}</div>
            <div className="text-[10px] text-emerald-600 font-medium">Direct website traffic</div>
          </div>

          <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-2xs">
            <div className="flex items-center justify-between text-slate-500 mb-1">
              <span className="font-semibold">Registered Teams</span>
              <Users className="h-3.5 w-3.5 text-emerald-500" />
            </div>
            <div className="text-lg font-bold text-slate-900">{registrations.length}</div>
            <div className="text-[10px] text-slate-500 font-medium">Across all tournaments</div>
          </div>

          <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-2xs">
            <div className="flex items-center justify-between text-slate-500 mb-1">
              <span className="font-semibold">Pending Reports</span>
              <Flag className="h-3.5 w-3.5 text-amber-500" />
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-lg font-bold text-slate-900">{pendingReportsCount}</span>
              {pendingReportsCount > 0 && (
                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800">
                  Needs review
                </span>
              )}
            </div>
            <div className="text-[10px] text-slate-500 font-medium">Player dispute inbox</div>
          </div>

          <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-2xs">
            <div className="flex items-center justify-between text-slate-500 mb-1">
              <span className="font-semibold">Host Fees Facilitated</span>
              <Building2 className="h-3.5 w-3.5 text-orange-500" />
            </div>
            <div className="text-lg font-bold text-slate-900">Rs. {totalFeesFacilitated.toLocaleString()}</div>
            <div className="text-[10px] text-emerald-600 font-medium">100% Direct to hosts</div>
          </div>
        </div>

        {/* NAVIGATION TABS */}
        <div className="flex items-center border-b border-slate-200 px-4 sm:px-6 bg-white shrink-0 overflow-x-auto">
          <button
            onClick={() => setActiveTab('activity')}
            className={`flex items-center gap-2 py-3 px-3 text-xs sm:text-sm font-bold border-b-2 transition-all whitespace-nowrap ${
              activeTab === 'activity'
                ? 'border-orange-500 text-orange-600'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Activity className="h-4 w-4" />
            <span>Live Activity Stream</span>
            <span className="ml-1 text-[11px] px-1.5 py-0.2 rounded-full bg-slate-100 text-slate-600">
              {activities.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('tournaments')}
            className={`flex items-center gap-2 py-3 px-3 text-xs sm:text-sm font-bold border-b-2 transition-all whitespace-nowrap ${
              activeTab === 'tournaments'
                ? 'border-orange-500 text-orange-600'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Calendar className="h-4 w-4" />
            <span>Tournaments & Events</span>
            <span className="ml-1 text-[11px] px-1.5 py-0.2 rounded-full bg-slate-100 text-slate-600">
              {tournaments.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('registrations')}
            className={`flex items-center gap-2 py-3 px-3 text-xs sm:text-sm font-bold border-b-2 transition-all whitespace-nowrap ${
              activeTab === 'registrations'
                ? 'border-orange-500 text-orange-600'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Users className="h-4 w-4" />
            <span>Registered Teams</span>
            <span className="ml-1 text-[11px] px-1.5 py-0.2 rounded-full bg-slate-100 text-slate-600">
              {registrations.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('reports')}
            className={`flex items-center gap-2 py-3 px-3 text-xs sm:text-sm font-bold border-b-2 transition-all whitespace-nowrap ${
              activeTab === 'reports'
                ? 'border-orange-500 text-orange-600'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Flag className="h-4 w-4" />
            <span>Reports & Moderation</span>
            {pendingReportsCount > 0 ? (
              <span className="ml-1 text-[11px] px-1.5 py-0.2 rounded-full bg-amber-500 text-white font-bold">
                {pendingReportsCount}
              </span>
            ) : (
              <span className="ml-1 text-[11px] px-1.5 py-0.2 rounded-full bg-slate-100 text-slate-600">
                {reports.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('organizers')}
            className={`flex items-center gap-2 py-3 px-3 text-xs sm:text-sm font-bold border-b-2 transition-all whitespace-nowrap ${
              activeTab === 'organizers'
                ? 'border-orange-500 text-orange-600'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <ShieldCheck className="h-4 w-4" />
            <span>Verified Organisers Desk</span>
            <span className="ml-1 text-[11px] px-1.5 py-0.2 rounded-full bg-slate-100 text-slate-600">
              {organizers.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('settings')}
            className={`flex items-center gap-2 py-3 px-3 text-xs sm:text-sm font-bold border-b-2 transition-all whitespace-nowrap ${
              activeTab === 'settings'
                ? 'border-orange-500 text-orange-600'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Settings className="h-4 w-4" />
            <span>Security & PIN</span>
          </button>
        </div>

        {/* TAB CONTENT BODY */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-50/50">
          
          {/* TAB 1: LIVE ACTIVITY & AUDIT FEED */}
          {activeTab === 'activity' && (
            <div className="space-y-4">
              {/* Controls */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3 rounded-xl border border-slate-200">
                {/* Search */}
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search who, team name, tournament, or action..."
                    className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-orange-500"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  )}
                </div>

                {/* Filter Pills */}
                <div className="flex items-center gap-1.5 overflow-x-auto text-xs pb-1 sm:pb-0">
                  <button
                    onClick={() => setActivityFilter('all')}
                    className={`px-2.5 py-1 rounded-lg font-semibold transition-colors whitespace-nowrap ${
                      activityFilter === 'all'
                        ? 'bg-slate-900 text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    All ({activities.length})
                  </button>
                  <button
                    onClick={() => setActivityFilter('registration')}
                    className={`px-2.5 py-1 rounded-lg font-semibold transition-colors whitespace-nowrap ${
                      activityFilter === 'registration'
                        ? 'bg-emerald-600 text-white'
                        : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
                    }`}
                  >
                    Registrations
                  </button>
                  <button
                    onClick={() => setActivityFilter('event_host')}
                    className={`px-2.5 py-1 rounded-lg font-semibold transition-colors whitespace-nowrap ${
                      activityFilter === 'event_host'
                        ? 'bg-orange-600 text-white'
                        : 'bg-orange-50 text-orange-800 hover:bg-orange-100'
                    }`}
                  >
                    Hosted Events
                  </button>
                  <button
                    onClick={() => setActivityFilter('report_submit')}
                    className={`px-2.5 py-1 rounded-lg font-semibold transition-colors whitespace-nowrap ${
                      activityFilter === 'report_submit'
                        ? 'bg-rose-600 text-white'
                        : 'bg-rose-50 text-rose-800 hover:bg-rose-100'
                    }`}
                  >
                    Reports
                  </button>
                  <button
                    onClick={() => setActivityFilter('pass_download')}
                    className={`px-2.5 py-1 rounded-lg font-semibold transition-colors whitespace-nowrap ${
                      activityFilter === 'pass_download'
                        ? 'bg-blue-600 text-white'
                        : 'bg-blue-50 text-blue-800 hover:bg-blue-100'
                    }`}
                  >
                    Pass Downloads
                  </button>
                </div>

                {/* CSV Download */}
                <button
                  onClick={exportActivityCSV}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shrink-0 shadow-2xs"
                  title="Export Activity Feed to CSV"
                >
                  <Download className="h-3.5 w-3.5" />
                  <span>Export CSV</span>
                </button>
              </div>

              {/* Feed List */}
              <div className="space-y-2.5">
                {filteredActivities.length === 0 ? (
                  <div className="text-center py-12 bg-white rounded-xl border border-slate-200 text-slate-500">
                    <Activity className="h-8 w-8 mx-auto text-slate-300 mb-2" />
                    <p className="font-semibold text-sm">No activity logs found</p>
                    <p className="text-xs text-slate-400">Try changing your search term or filter.</p>
                  </div>
                ) : (
                  filteredActivities.map((act) => {
                    const timeAgo = formatTimeAgo(act.timestamp);
                    let badgeColor = 'bg-slate-100 text-slate-700 border-slate-200';
                    let icon = <Clock className="h-3.5 w-3.5 text-slate-500" />;

                    if (act.type === 'registration') {
                      badgeColor = 'bg-emerald-50 text-emerald-800 border-emerald-200';
                      icon = <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />;
                    } else if (act.type === 'event_host') {
                      badgeColor = 'bg-orange-50 text-orange-800 border-orange-200';
                      icon = <Building2 className="h-3.5 w-3.5 text-orange-600" />;
                    } else if (act.type === 'report_submit') {
                      badgeColor = 'bg-rose-50 text-rose-800 border-rose-200';
                      icon = <AlertTriangle className="h-3.5 w-3.5 text-rose-600" />;
                    } else if (act.type === 'pass_download') {
                      badgeColor = 'bg-blue-50 text-blue-800 border-blue-200';
                      icon = <Download className="h-3.5 w-3.5 text-blue-600" />;
                    } else if (act.type === 'organizer_verify') {
                      badgeColor = 'bg-purple-50 text-purple-800 border-purple-200';
                      icon = <ShieldCheck className="h-3.5 w-3.5 text-purple-600" />;
                    }

                    return (
                      <div
                        key={act.id}
                        className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3.5 bg-white rounded-xl border border-slate-200 shadow-2xs hover:border-slate-300 transition-colors"
                      >
                        <div className="flex items-start gap-3 min-w-0">
                          <div className="p-2 rounded-lg bg-slate-50 border border-slate-100 shrink-0 mt-0.5">
                            {icon}
                          </div>
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="font-bold text-xs sm:text-sm text-slate-900">
                                {act.actor}
                              </span>
                              {act.location && (
                                <span className="text-[10px] text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                                  {act.location}
                                </span>
                              )}
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${badgeColor}`}>
                                {act.type.replace('_', ' ').toUpperCase()}
                              </span>
                            </div>

                            <p className="text-xs text-slate-700 font-medium mt-0.5">
                              {act.action}
                              {act.targetTitle && (
                                <span className="font-bold text-slate-900"> — {act.targetTitle}</span>
                              )}
                            </p>

                            {act.details && (
                              <p className="text-[11px] text-slate-500 mt-1 bg-slate-50 p-1.5 rounded-md border border-slate-100">
                                {act.details}
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="text-right shrink-0 self-end sm:self-center">
                          <span className="text-[11px] text-slate-400 whitespace-nowrap block">
                            {timeAgo}
                          </span>
                          <span className="text-[10px] text-slate-400 block">
                            {new Date(act.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {/* TAB: TOURNAMENTS & EVENTS MANAGEMENT (DELETE EVENTS & CLEAN FINISHED) */}
          {activeTab === 'tournaments' && (() => {
            const today = '2026-09-26';
            const isFinishedEvent = (t: Tournament) => {
              if (t.isReliefFund || t.hasNoSlots || t.id.startsWith('ev-pm-') || t.id.startsWith('ev-redcross-')) {
                return false;
              }
              const d = t.endDate || t.startDate || t.date;
              return Boolean(d && d < today);
            };

            const filteredList = tournaments.filter((t) => {
              const matchesSearch =
                !eventSearchQuery.trim() ||
                t.title.toLowerCase().includes(eventSearchQuery.toLowerCase()) ||
                (t.hostName && t.hostName.toLowerCase().includes(eventSearchQuery.toLowerCase())) ||
                (t.hostOrg && t.hostOrg.toLowerCase().includes(eventSearchQuery.toLowerCase())) ||
                t.category.toLowerCase().includes(eventSearchQuery.toLowerCase()) ||
                t.city.toLowerCase().includes(eventSearchQuery.toLowerCase());

              if (!matchesSearch) return false;

              if (eventFilter === 'active') return !isFinishedEvent(t);
              if (eventFilter === 'finished') return isFinishedEvent(t);
              if (eventFilter === 'relief') return Boolean(t.isCharity || t.category === 'Charity & Relief');
              return true;
            });

            const finishedCount = tournaments.filter(isFinishedEvent).length;
            const activeCount = tournaments.filter((t) => !isFinishedEvent(t)).length;

            return (
              <div className="space-y-4">
                {/* Search, Filter & Quick Purge Actions */}
                <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-white p-3 rounded-xl border border-slate-200">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <input
                      type="text"
                      value={eventSearchQuery}
                      onChange={(e) => setEventSearchQuery(e.target.value)}
                      placeholder="Search tournaments by title, organizer, city, or category..."
                      className="w-full pl-9 pr-8 py-2 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                    {eventSearchQuery && (
                      <button
                        onClick={() => setEventSearchQuery('')}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>

                  {/* Batch actions */}
                  <div className="flex items-center gap-2 flex-wrap">
                    {onPurgeFinishedTournaments && (
                      <button
                        type="button"
                        onClick={() => {
                          if (window.confirm('Delete all concluded tournaments whose end date has passed?')) {
                            onPurgeFinishedTournaments();
                          }
                        }}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-rose-300 bg-rose-50 hover:bg-rose-100 text-rose-700 px-3 py-1.5 text-xs font-bold transition-colors cursor-pointer"
                        title="Delete finished tournaments from the system"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        <span>Purge Finished ({finishedCount})</span>
                      </button>
                    )}

                    {onCleanTestTournaments && (
                      <button
                        type="button"
                        onClick={() => {
                          if (window.confirm('Scan and delete any placeholder or test submissions (such as 3E2, ASDNAJSD)?')) {
                            onCleanTestTournaments();
                          }
                        }}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-amber-300 bg-amber-50 hover:bg-amber-100 text-amber-800 px-3 py-1.5 text-xs font-bold transition-colors cursor-pointer"
                        title="Remove placeholder/test cards"
                      >
                        <ShieldAlert className="h-3.5 w-3.5" />
                        <span>Clean Test Data</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Filter Chips */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
                  <button
                    onClick={() => setEventFilter('all')}
                    className={`px-3 py-1 rounded-lg font-bold transition-colors ${
                      eventFilter === 'all'
                        ? 'bg-slate-900 text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    All Events ({tournaments.length})
                  </button>
                  <button
                    onClick={() => setEventFilter('active')}
                    className={`px-3 py-1 rounded-lg font-bold transition-colors ${
                      eventFilter === 'active'
                        ? 'bg-emerald-600 text-white'
                        : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
                    }`}
                  >
                    Active / Upcoming ({activeCount})
                  </button>
                  <button
                    onClick={() => setEventFilter('finished')}
                    className={`px-3 py-1 rounded-lg font-bold transition-colors ${
                      eventFilter === 'finished'
                        ? 'bg-slate-700 text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    Concluded / Past ({finishedCount})
                  </button>
                  <button
                    onClick={() => setEventFilter('relief')}
                    className={`px-3 py-1 rounded-lg font-bold transition-colors ${
                      eventFilter === 'relief'
                        ? 'bg-rose-600 text-white'
                        : 'bg-rose-50 text-rose-700 hover:bg-rose-100'
                    }`}
                  >
                    Relief Drives ({tournaments.filter((t) => t.isCharity).length})
                  </button>
                </div>

                {/* Events List */}
                <div className="space-y-3">
                  {filteredList.length === 0 ? (
                    <div className="text-center py-10 bg-slate-50 rounded-xl border border-slate-200 text-slate-500 text-xs">
                      No tournaments found matching your filter criteria.
                    </div>
                  ) : (
                    filteredList.map((t) => {
                      const isFinished = isFinishedEvent(t);
                      return (
                        <div
                          key={t.id}
                          className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-xl border border-slate-200 bg-white hover:border-slate-300 transition-all shadow-2xs"
                        >
                          <div className="flex items-start gap-3 min-w-0 flex-1">
                            <img
                              src={t.posterUrl}
                              alt={t.title}
                              referrerPolicy="no-referrer"
                              className="h-14 w-14 rounded-lg object-cover border border-slate-200 shrink-0"
                            />
                            <div className="min-w-0 flex-1 space-y-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="rounded bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-700">
                                  {t.category}
                                </span>
                                {isFinished ? (
                                  <span className="rounded bg-slate-200 px-2 py-0.5 text-[10px] font-bold text-slate-600">
                                    Concluded
                                  </span>
                                ) : t.isCharity ? (
                                  <span className="rounded bg-rose-100 px-2 py-0.5 text-[10px] font-bold text-rose-700">
                                    Relief Drive
                                  </span>
                                ) : (
                                  <span className="rounded bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                                    Live / Active
                                  </span>
                                )}
                                <span className="text-[11px] text-slate-500 font-medium">{t.city}, Nepal</span>
                              </div>
                              <h4 className="font-display text-sm font-bold text-slate-900 truncate">
                                {t.title}
                              </h4>
                              <p className="text-xs text-slate-500 line-clamp-1">
                                Organizer: <strong className="text-slate-700">{t.hostName}</strong> ({t.hostPhone}) • {t.entryFee === 0 ? 'FREE' : `Rs. ${t.entryFee.toLocaleString()}`}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                            {onToggleTournamentVerification && (
                              <button
                                type="button"
                                onClick={() => onToggleTournamentVerification(t.id, !t.isHostVerified)}
                                className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-semibold border transition-colors ${
                                  t.isHostVerified
                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                                    : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                                }`}
                                title="Toggle verified organizer status"
                              >
                                <ShieldCheck className="h-3.5 w-3.5" />
                                <span>{t.isHostVerified ? 'Verified' : 'Verify'}</span>
                              </button>
                            )}

                            {onDeleteTournament && (
                              <button
                                type="button"
                                onClick={() => {
                                  if (window.confirm(`Permanently delete "${t.title}" from KataTira? This action cannot be undone.`)) {
                                    onDeleteTournament(t.id);
                                  }
                                }}
                                className="inline-flex items-center gap-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 px-2.5 py-1.5 text-xs font-bold transition-colors cursor-pointer"
                                title="Permanently delete event"
                              >
                                <Trash2 className="h-3.5 w-3.5 text-rose-600" />
                                <span>Delete Event</span>
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })()}

          {/* TAB 2: REGISTERED TEAMS & PARTICIPANTS DIRECTORY */}
          {activeTab === 'registrations' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3 rounded-xl border border-slate-200">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by team, tournament, phone, or Txn ID..."
                    className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-orange-500"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  )}
                </div>

                <button
                  onClick={exportRegistrationsCSV}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shrink-0 shadow-2xs"
                  title="Export Registered Teams to CSV"
                >
                  <FileSpreadsheet className="h-3.5 w-3.5 text-emerald-600" />
                  <span>Export Teams CSV</span>
                </button>
              </div>

              {filteredRegistrations.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-xl border border-slate-200 text-slate-500">
                  <Users className="h-8 w-8 mx-auto text-slate-300 mb-2" />
                  <p className="font-semibold text-sm">No registered teams found</p>
                  <p className="text-xs text-slate-400">Registrations submitted by players will appear here in real-time.</p>
                </div>
              ) : (
                <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-2xs">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase text-[10px] font-bold tracking-wider">
                      <tr>
                        <th className="px-4 py-3">Team & Captain</th>
                        <th className="px-4 py-3">Tournament</th>
                        <th className="px-4 py-3">Contact</th>
                        <th className="px-4 py-3">Entry Fee</th>
                        <th className="px-4 py-3">Txn ID / Payment</th>
                        <th className="px-4 py-3">Registered At</th>
                        <th className="px-4 py-3 text-right">Pass Code</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredRegistrations.map((reg) => (
                        <tr key={reg.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="px-4 py-3 font-semibold text-slate-900">
                            <div>{reg.teamName}</div>
                            <span className="text-[10px] text-slate-400 font-normal">ID: {reg.id.slice(0, 8)}</span>
                          </td>
                          <td className="px-4 py-3 text-slate-700">
                            <div className="font-medium max-w-[200px] truncate" title={reg.tournamentTitle}>
                              {reg.tournamentTitle}
                            </div>
                            <span className="text-[10px] text-slate-400">{reg.tournamentCity}</span>
                          </td>
                          <td className="px-4 py-3 text-slate-600">
                            <div className="flex items-center gap-1 font-medium text-slate-900">
                              <Phone className="h-3 w-3 text-slate-400" />
                              <a href={`tel:${reg.contactPhone}`} className="hover:text-orange-600">
                                {reg.contactPhone}
                              </a>
                            </div>
                            <div className="text-[10px] text-slate-400 flex items-center gap-1">
                              <Mail className="h-3 w-3 text-slate-400" />
                              <span>{reg.contactEmail}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <span className="font-bold text-slate-900">
                              {reg.entryFee === 0 ? 'FREE' : `Rs. ${reg.entryFee.toLocaleString()}`}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                              <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                              <span>{reg.paymentMethod.replace('_', ' ').toUpperCase()}</span>
                            </div>
                            {reg.transactionId && (
                              <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                                Txn: {reg.transactionId}
                              </div>
                            )}
                          </td>
                          <td className="px-4 py-3 text-slate-500 whitespace-nowrap">
                            {new Date(reg.registeredAt).toLocaleDateString()}
                            <div className="text-[10px] text-slate-400">
                              {new Date(reg.registeredAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <span className="font-mono font-bold text-slate-800 bg-slate-100 px-2 py-1 rounded text-[11px]">
                              {reg.confirmationCode || 'KT-PASS'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: REPORTS & MODERATION DESK (Where reports go to) */}
          {activeTab === 'reports' && (
            <div className="space-y-4">
              {/* Informative Explanation Banner */}
              <div className="rounded-xl border border-amber-200 bg-amber-50/80 p-4 text-xs text-amber-900 flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <div className="font-bold text-sm text-amber-950">
                    Platform Moderation & Dispute Resolution Center
                  </div>
                  <p className="text-amber-800 leading-relaxed">
                    <strong>Where do reports go?</strong> Every time a visitor or player flags a tournament on KataTira (for reasons like fraudulent host, fake venue, incorrect QR code, or prize discrepancy), it is logged directly here for your immediate review.
                  </p>
                  <p className="text-[11px] text-amber-700">
                    As platform administrator, you can review the reporter's statement, contact the organizer directly, or delist/suspend the event with a single click.
                  </p>
                </div>
              </div>

              {/* Reports List */}
              {reports.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-xl border border-slate-200 text-slate-500">
                  <CheckCircle2 className="h-8 w-8 mx-auto text-emerald-400 mb-2" />
                  <p className="font-semibold text-sm">All clear! No reports pending</p>
                  <p className="text-xs text-slate-400">Flagged events will appear here immediately for moderation.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {reports.map((rep) => {
                    const isPending = rep.status === 'pending';
                    const isResolved = rep.status === 'resolved';

                    return (
                      <div
                        key={rep.id}
                        className={`p-4 sm:p-5 rounded-2xl border transition-all bg-white shadow-2xs ${
                          isPending ? 'border-amber-300 ring-1 ring-amber-200' : 'border-slate-200 opacity-90'
                        }`}
                      >
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
                          <div className="flex items-center gap-2">
                            <span
                              className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${
                                isPending
                                  ? 'bg-amber-100 text-amber-900 border border-amber-300'
                                  : isResolved
                                  ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                                  : 'bg-slate-100 text-slate-700'
                              }`}
                            >
                              Status: {rep.status.toUpperCase()}
                            </span>
                            <span className="text-[11px] text-slate-400">
                              Report ID: {rep.id}
                            </span>
                          </div>

                          <div className="text-[11px] text-slate-400 flex items-center gap-1">
                            <Clock className="h-3.5 w-3.5" />
                            <span>{new Date(rep.timestamp).toLocaleString()}</span>
                          </div>
                        </div>

                        {/* Tournament & Reason */}
                        <div className="py-3 space-y-2">
                          <div>
                            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                              Reported Tournament
                            </span>
                            <h4 className="text-sm sm:text-base font-bold text-slate-900">
                              {rep.tournamentTitle}
                            </h4>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-50 p-3 rounded-xl border border-slate-100 text-xs">
                            <div>
                              <span className="text-[10px] uppercase font-bold text-slate-400 block">
                                Reason Flagged
                              </span>
                              <span className="font-bold text-rose-700">{rep.reason}</span>
                            </div>

                            <div>
                              <span className="text-[10px] uppercase font-bold text-slate-400 block">
                                Host Contact
                              </span>
                              <div className="flex items-center gap-2 text-slate-700">
                                <span className="font-medium">{rep.hostName || 'Organizer'}</span>
                                {rep.hostPhone && (
                                  <a
                                    href={`tel:${rep.hostPhone}`}
                                    className="inline-flex items-center gap-1 text-orange-600 hover:underline font-semibold"
                                  >
                                    <Phone className="h-3 w-3" />
                                    <span>{rep.hostPhone}</span>
                                  </a>
                                )}
                              </div>
                            </div>

                            {rep.details && (
                              <div className="sm:col-span-2">
                                <span className="text-[10px] uppercase font-bold text-slate-400 block">
                                  Reporter Statement / Evidence
                                </span>
                                <p className="text-slate-700 italic bg-white p-2 rounded border border-slate-200 mt-1">
                                  "{rep.details}"
                                </p>
                              </div>
                            )}

                            {rep.reporterContact && (
                              <div className="sm:col-span-2 text-[11px] text-slate-500">
                                <strong>Reporter Contact:</strong> {rep.reporterContact}
                              </div>
                            )}

                            {rep.adminNote && (
                              <div className="sm:col-span-2 bg-emerald-50 p-2 rounded border border-emerald-200 text-emerald-900 text-[11px]">
                                <strong>Admin Resolution Note:</strong> {rep.adminNote}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Admin Action Buttons */}
                        {isPending && (
                          <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
                            <div className="flex-1 max-w-sm">
                              <input
                                type="text"
                                placeholder="Optional admin resolution note..."
                                value={adminNoteInput[rep.id] || ''}
                                onChange={(e) =>
                                  setAdminNoteInput({ ...adminNoteInput, [rep.id]: e.target.value })
                                }
                                className="w-full text-xs px-3 py-1.5 rounded-lg border border-slate-200 focus:outline-hidden focus:ring-1 focus:ring-orange-500"
                              />
                            </div>

                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handleDelistFromReport(rep.tournamentId, rep.id)}
                                className="px-3 py-1.5 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-800 text-xs font-bold transition-all shadow-2xs"
                                title="Delist tournament from public board"
                              >
                                Delist Event
                              </button>

                              <button
                                onClick={() => handleSetReportStatus(rep.id, 'dismissed')}
                                className="px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-semibold transition-all"
                              >
                                Dismiss
                              </button>

                              <button
                                onClick={() => handleSetReportStatus(rep.id, 'resolved')}
                                className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-2xs"
                              >
                                Mark Resolved
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 4: VERIFIED ORGANISERS MANAGER (How to check verified organizers) */}
          {activeTab === 'organizers' && (
            <div className="space-y-4">
              {/* How to check verified organizers guide */}
              <div className="rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-50/80 via-white to-slate-50 p-4 sm:p-5 shadow-2xs">
                <div className="flex items-start gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-xs shrink-0">
                    <ShieldCheck className="h-5 w-5" />
                  </div>
                  <div className="space-y-2">
                    <div>
                      <h4 className="text-sm font-bold text-slate-900">
                        How KataTira Verifies Event Organisers (3-Step Protocol)
                      </h4>
                      <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">
                        To protect players and ensure genuine cash prizes, organizers must pass the 3-step verification check before displaying the green <strong>"Verified Organiser"</strong> badge:
                      </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1 text-xs">
                      <div className="p-3 bg-white rounded-xl border border-emerald-100 shadow-2xs">
                        <div className="font-bold text-emerald-950 flex items-center gap-1.5 mb-1">
                          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-600 text-white text-[10px]">1</span>
                          <span>Identity & PAN / KYC</span>
                        </div>
                        <p className="text-[11px] text-slate-500 leading-snug">
                          Organizer confirms phone number, National ID or PAN registration certificate of the club/school/organization.
                        </p>
                      </div>

                      <div className="p-3 bg-white rounded-xl border border-emerald-100 shadow-2xs">
                        <div className="font-bold text-emerald-950 flex items-center gap-1.5 mb-1">
                          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-600 text-white text-[10px]">2</span>
                          <span>Physical Venue Proof</span>
                        </div>
                        <p className="text-[11px] text-slate-500 leading-snug">
                          Signed ground/futsal court lease, university auditorium booking letter, or arena manager confirmation.
                        </p>
                      </div>

                      <div className="p-3 bg-white rounded-xl border border-emerald-100 shadow-2xs">
                        <div className="font-bold text-emerald-950 flex items-center gap-1.5 mb-1">
                          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-600 text-white text-[10px]">3</span>
                          <span>Payment QR Integrity</span>
                        </div>
                        <p className="text-[11px] text-slate-500 leading-snug">
                          eSewa/Khalti merchant account or coordinator bank account strictly matching the verified host identity.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Organizers Directory Table */}
              <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-2xs">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase text-[10px] font-bold tracking-wider">
                    <tr>
                      <th className="px-4 py-3">Organizer / Club</th>
                      <th className="px-4 py-3">Location</th>
                      <th className="px-4 py-3">Contact</th>
                      <th className="px-4 py-3">Events Posted</th>
                      <th className="px-4 py-3">Verification Badge</th>
                      <th className="px-4 py-3 text-right">Admin Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {organizers.map((org) => (
                      <tr key={org.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="px-4 py-3">
                          <div className="font-bold text-slate-900 text-xs sm:text-sm">{org.name}</div>
                          {org.verificationMethod && org.isVerified && (
                            <span className="text-[10px] text-emerald-700 block truncate max-w-xs">
                              {org.verificationMethod}
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-slate-600">
                          {org.location}
                        </td>
                        <td className="px-4 py-3 text-slate-600">
                          <div className="font-medium text-slate-900">{org.phone}</div>
                          <div className="text-[10px] text-slate-400">{org.email}</div>
                        </td>
                        <td className="px-4 py-3 text-slate-700 font-semibold">
                          {org.tournamentsCount} tournaments
                        </td>
                        <td className="px-4 py-3">
                          {org.isVerified ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                              <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
                              <span>Verified Organiser</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-600 border border-slate-200">
                              <span>Unverified Host</span>
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button
                            onClick={() => handleToggleOrganizer(org)}
                            className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold transition-all shadow-2xs ${
                              org.isVerified
                                ? 'border border-slate-200 bg-white hover:bg-rose-50 text-slate-700 hover:text-rose-700'
                                : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                            }`}
                            title={org.isVerified ? 'Revoke verification badge' : 'Grant verified badge'}
                          >
                            {org.isVerified ? (
                              <>
                                <UserX className="h-3.5 w-3.5" />
                                <span>Revoke</span>
                              </>
                            ) : (
                              <>
                                <UserCheck className="h-3.5 w-3.5" />
                                <span>Verify Organiser</span>
                              </>
                            )}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 5: SECURITY & SETTINGS */}
          {activeTab === 'settings' && (
            <div className="space-y-6 max-w-3xl mx-auto">
              {/* Access Control Overview */}
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-500 text-white font-bold shadow-xs">
                    <Lock className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 text-base">Admin Access & Security Controls</h4>
                    <p className="text-xs text-slate-500">
                      Ensures confidential participant details, moderation reports, and organizer controls remain strictly private.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  <div className="rounded-xl border border-slate-100 bg-slate-50 p-3">
                    <span className="text-[11px] font-bold text-slate-700 block mb-1">Public Site Privacy</span>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      Insights & Admin buttons have been removed from the public navigation and sidebar so players and visitors only see the public tournament discovery interface.
                    </p>
                  </div>
                  <div className="rounded-xl border border-slate-100 bg-slate-50 p-3">
                    <span className="text-[11px] font-bold text-slate-700 block mb-1">Passcode Gate</span>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      Anyone accessing the Admin link in the footer must supply the master PIN before any activity logs, squad phone numbers, or actions become accessible.
                    </p>
                  </div>
                </div>
              </div>

              {/* Change Passcode Form */}
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div>
                    <h5 className="font-bold text-slate-900 text-sm">Change Admin Passcode</h5>
                    <p className="text-xs text-slate-500">Update your master PIN required to access this dashboard</p>
                  </div>
                  <span className="text-[11px] font-mono font-bold text-slate-700 bg-slate-100 px-2.5 py-1 rounded-full">
                    Protected with Master PIN
                  </span>
                </div>

                {settingsStatus && (
                  <div className={`p-3 rounded-xl text-xs font-semibold flex items-center justify-between ${
                    settingsStatus.type === 'success'
                      ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                      : 'bg-rose-50 text-rose-800 border border-rose-200'
                  }`}>
                    <span>{settingsStatus.message}</span>
                    <button onClick={() => setSettingsStatus(null)} className="opacity-70 hover:opacity-100">
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                )}

                <form onSubmit={handleChangePin} className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Current Passcode</label>
                      <input
                        type="password"
                        value={oldPin}
                        onChange={(e) => setOldPin(e.target.value)}
                        placeholder="Current PIN"
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold focus:bg-white focus:border-orange-500 focus:outline-none"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">New Passcode</label>
                      <input
                        type="password"
                        value={newPin}
                        onChange={(e) => setNewPin(e.target.value)}
                        placeholder="Min. 4 characters"
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold focus:bg-white focus:border-orange-500 focus:outline-none"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Confirm New Passcode</label>
                      <input
                        type="password"
                        value={confirmPin}
                        onChange={(e) => setConfirmPin(e.target.value)}
                        placeholder="Repeat new PIN"
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold focus:bg-white focus:border-orange-500 focus:outline-none"
                        required
                      />
                    </div>
                  </div>

                  <div className="pt-2 flex justify-end">
                    <button
                      type="submit"
                      className="px-4 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold shadow-xs transition-all active:scale-95"
                    >
                      Update Admin PIN
                    </button>
                  </div>
                </form>
              </div>

              {/* Maintenance & Session Actions */}
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-4">
                <h5 className="font-bold text-slate-900 text-sm">Session & Maintenance Actions</h5>

                <div className="flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-300 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition-all shadow-2xs"
                  >
                    <Lock className="h-4 w-4 text-slate-600" />
                    <span>Lock Session & Log Out</span>
                  </button>

                  <button
                    type="button"
                    onClick={exportActivityCSV}
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition-all shadow-2xs"
                  >
                    <Download className="h-4 w-4 text-emerald-600" />
                    <span>Export Audit Logs CSV</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleClearLogs}
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold transition-all shadow-2xs"
                  >
                    <AlertTriangle className="h-4 w-4 text-rose-600" />
                    <span>Reset Activity Feed</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* FOOTER */}
        <div className="px-6 py-3 border-t border-slate-200 bg-slate-50 flex items-center justify-between text-xs text-slate-500 shrink-0">
          <div className="flex items-center gap-2">
            <span className="flex h-2 w-2 rounded-full bg-emerald-500" />
            <span>KataTira Live System Status: Operational</span>
          </div>

          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 font-bold transition-colors shadow-2xs"
          >
            Close Dashboard
          </button>
        </div>

      </div>
    </div>
  );
};

// Helper for relative timestamps
function formatTimeAgo(isoString: string): string {
  try {
    const diffMs = Date.now() - new Date(isoString).getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  } catch {
    return 'Recently';
  }
}
