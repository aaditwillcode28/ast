import React, { useState, useEffect, useCallback } from 'react';
import {
  Youtube,
  Facebook,
  Instagram,
  Play,
  PlusCircle,
  ExternalLink,
  Search,
  X,
  CheckCircle,
  Trash2,
  Tv,
  Share2,
  RefreshCw,
  Globe,
  Film,
  Camera,
  Radio,
  CloudCheck,
  Check
} from 'lucide-react';
import { CommunityVideo, VideoPlatform } from '../types';
import { fetchCloudVideos, publishCloudVideo, deleteCloudVideo } from '../lib/supabase';

const STORAGE_KEY = 'katatira_community_videos_v1';

// Preset high-visibility match cover posters for non-YouTube platforms (when custom thumbnail isn't provided)
const DEFAULT_COVERS: Record<string, string> = {
  football: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=800&q=80',
  futsal: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&w=800&q=80',
  basketball: 'https://images.unsplash.com/photo-1546519638-68e109498ffc?auto=format&fit=crop&w=800&q=80',
  esports: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=800&q=80',
  general: 'https://images.unsplash.com/photo-1517649763962-0c623266ddc0?auto=format&fit=crop&w=800&q=80',
};

// Helper to extract YouTube 11-char Video ID
export const extractYoutubeId = (url: string): string | null => {
  if (!url) return null;
  const trimmed = url.trim();
  const regExp = /(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/|v\/))([\w-]{11})/;
  const match = trimmed.match(regExp);
  if (match && match[1]) {
    return match[1];
  }
  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) {
    return trimmed;
  }
  return null;
};

// Helper to detect platform
export const detectPlatform = (url: string): VideoPlatform => {
  if (!url) return 'other';
  const lower = url.toLowerCase().trim();
  if (lower.includes('youtube.com') || lower.includes('youtu.be')) return 'youtube';
  if (lower.includes('facebook.com') || lower.includes('fb.watch') || lower.includes('fb.com')) return 'facebook';
  if (lower.includes('instagram.com') || lower.includes('instagr.am')) return 'instagram';
  if (lower.includes('tiktok.com')) return 'tiktok';
  return 'other';
};

interface VideosSectionProps {
  onBackToExplore?: () => void;
}

export const VideosSection: React.FC<VideosSectionProps> = ({ onBackToExplore }) => {
  const [videos, setVideos] = useState<CommunityVideo[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed.filter(
            (v) =>
              v.id &&
              !v.id.startsWith('vid-futsal-final') &&
              !v.id.startsWith('vid-esports-nepal') &&
              !v.id.startsWith('vid-basketball-3v3') &&
              !v.id.startsWith('vid-debate-mun')
          );
        }
      }
    } catch {}
    return [];
  });

  const [isLoadingSync, setIsLoadingSync] = useState(false);
  const [justSynced, setJustSynced] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedPlatform, setSelectedPlatform] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [activeVideoModal, setActiveVideoModal] = useState<CommunityVideo | null>(null);

  // Form State for Adding a Video
  const [videoUrlInput, setVideoUrlInput] = useState('');
  const [videoTitle, setVideoTitle] = useState('');
  const [channelName, setChannelName] = useState('');
  const [customThumbnailUrl, setCustomThumbnailUrl] = useState('');
  const [videoCategory, setVideoCategory] = useState('Football');
  const [contributorName, setContributorName] = useState('');
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Sync from Global Supabase Cloud + Server API for Guaranteed Cross-Device Visibility (Device A ⇄ Device B)
  const fetchAllVideos = useCallback(async (silent = false) => {
    if (!silent) setIsLoadingSync(true);
    try {
      // 1. Primary: Direct Supabase Cloud Database (works across separate containers, devices, and networks)
      const cloudVideos = await fetchCloudVideos();

      // 2. Secondary: Server API Endpoint
      let serverVideos: CommunityVideo[] = [];
      try {
        const res = await fetch('/api/videos');
        if (res.ok) {
          const data = await res.json();
          if (data.success && Array.isArray(data.videos)) {
            serverVideos = data.videos;
          }
        }
      } catch (err) {
        // Offline / serverless fallback
      }

      // Merge cloud and server items, deduplicating by ID
      const mergedMap = new Map<string, CommunityVideo>();
      [...cloudVideos, ...serverVideos].forEach((v) => {
        if (
          v &&
          v.id &&
          v.title &&
          v.videoUrl &&
          !v.id.startsWith('vid-futsal-final') &&
          !v.id.startsWith('vid-esports-nepal') &&
          !v.id.startsWith('vid-basketball-3v3') &&
          !v.id.startsWith('vid-debate-mun')
        ) {
          mergedMap.set(v.id, v);
        }
      });

      const mergedList = Array.from(mergedMap.values());
      setVideos(mergedList);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(mergedList));
      } catch {}

      if (!silent) {
        setJustSynced(true);
        setTimeout(() => setJustSynced(false), 2000);
      }
    } catch (err) {
      console.warn('Could not sync community videos:', err);
    } finally {
      if (!silent) setIsLoadingSync(false);
    }
  }, []);

  // Fetch on mount and set up 6-second polling so Device B immediately sees videos added from Device A
  useEffect(() => {
    fetchAllVideos();

    const interval = setInterval(() => {
      fetchAllVideos(true);
    }, 6000);

    return () => clearInterval(interval);
  }, [fetchAllVideos]);

  // Derived current platform from input
  const detectedInputPlatform = detectPlatform(videoUrlInput);
  const currentYoutubeId = extractYoutubeId(videoUrlInput);

  // Auto-fill thumbnail preview
  const livePreviewThumbnail = React.useMemo(() => {
    if (customThumbnailUrl.trim()) {
      return customThumbnailUrl.trim();
    }
    if (currentYoutubeId) {
      return `https://img.youtube.com/vi/${currentYoutubeId}/hqdefault.jpg`;
    }
    if (videoCategory.toLowerCase().includes('football') || videoCategory.toLowerCase().includes('futsal')) {
      return DEFAULT_COVERS.football;
    }
    if (videoCategory.toLowerCase().includes('basketball')) {
      return DEFAULT_COVERS.basketball;
    }
    if (videoCategory.toLowerCase().includes('esports')) {
      return DEFAULT_COVERS.esports;
    }
    return DEFAULT_COVERS.general;
  }, [customThumbnailUrl, currentYoutubeId, videoCategory]);

  const handleAddVideo = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedUrl = videoUrlInput.trim();
    if (!trimmedUrl) {
      setFormError('Please enter a video or stream link.');
      return;
    }
    if (!trimmedUrl.startsWith('http://') && !trimmedUrl.startsWith('https://')) {
      setFormError('Please enter a complete URL starting with https://');
      return;
    }
    if (!videoTitle.trim()) {
      setFormError('Please enter the video title.');
      return;
    }
    if (!channelName.trim()) {
      setFormError('Please enter the channel, page, or creator name.');
      return;
    }

    const platform = detectPlatform(trimmedUrl);
    const ytId = extractYoutubeId(trimmedUrl);

    let finalThumbnail = customThumbnailUrl.trim();
    if (!finalThumbnail) {
      if (ytId) {
        finalThumbnail = `https://img.youtube.com/vi/${ytId}/hqdefault.jpg`;
      } else if (videoCategory === 'Football' || videoCategory === 'Futsal') {
        finalThumbnail = DEFAULT_COVERS.football;
      } else if (videoCategory === 'Basketball') {
        finalThumbnail = DEFAULT_COVERS.basketball;
      } else if (videoCategory === 'Esports') {
        finalThumbnail = DEFAULT_COVERS.esports;
      } else {
        finalThumbnail = DEFAULT_COVERS.general;
      }
    }

    const newVideo: CommunityVideo = {
      id: `vid-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      videoUrl: trimmedUrl,
      youtubeUrl: ytId ? trimmedUrl : undefined,
      youtubeId: ytId || undefined,
      platform,
      title: videoTitle.trim(),
      channelName: channelName.trim(),
      thumbnailUrl: finalThumbnail,
      category: videoCategory,
      addedBy: contributorName.trim() || 'Community Member',
      createdAt: new Date().toISOString().split('T')[0],
    };

    setIsSubmitting(true);
    try {
      // 1. Publish to Supabase Cloud Database (Guaranteed Cross-Device Storage)
      const cloudRes = await publishCloudVideo(newVideo);
      if (!cloudRes.success) {
        console.warn('Cloud video notice:', cloudRes.error);
      }

      // 2. Also post to Server API endpoint
      try {
        await fetch('/api/videos', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newVideo),
        });
      } catch (err) {
        console.warn('Server endpoint notice:', err);
      }

      // 3. Immediately update local state
      setVideos((prev) => [newVideo, ...prev.filter((v) => v.id !== newVideo.id)]);

      // 4. Trigger cloud re-sync
      fetchAllVideos(true);
    } catch (err) {
      console.warn('Video addition error:', err);
      setVideos((prev) => [newVideo, ...prev]);
    } finally {
      setIsSubmitting(false);
      setIsAddModalOpen(false);

      // Reset Form
      setVideoUrlInput('');
      setVideoTitle('');
      setChannelName('');
      setCustomThumbnailUrl('');
      setContributorName('');
      setFormError('');
    }
  };

  const handleDeleteVideo = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm('Are you sure you want to remove this video from all devices?')) {
      // Optimistic delete
      setVideos((prev) => prev.filter((v) => v.id !== id));
      if (activeVideoModal?.id === id) {
        setActiveVideoModal(null);
      }

      // 1. Delete from Supabase Cloud
      try {
        await deleteCloudVideo(id);
      } catch (err) {
        console.warn('Cloud delete notice:', err);
      }

      // 2. Delete from Server endpoint
      try {
        await fetch(`/api/videos/${id}`, { method: 'DELETE' });
      } catch (err) {
        console.warn('Server delete notice:', err);
      }

      // 3. Re-sync
      fetchAllVideos(true);
    }
  };

  const filteredVideos = videos.filter((v) => {
    const matchesCat = selectedCategory === 'All' || v.category === selectedCategory;
    const matchesPlatform = selectedPlatform === 'All' || v.platform === selectedPlatform;
    const matchesQuery =
      !searchQuery.trim() ||
      v.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.channelName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (v.category && v.category.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCat && matchesPlatform && matchesQuery;
  });

  const categories = ['All', 'Football', 'Basketball', 'Esports', 'MUN & Debate', 'Quiz', 'Case Competition'];
  const platforms = [
    { id: 'All', label: 'All Platforms' },
    { id: 'youtube', label: 'YouTube' },
    { id: 'facebook', label: 'Facebook' },
    { id: 'instagram', label: 'Instagram' },
    { id: 'tiktok', label: 'TikTok' },
    { id: 'other', label: 'Streams & Other' },
  ];

  const renderPlatformBadge = (platform: VideoPlatform) => {
    switch (platform) {
      case 'youtube':
        return (
          <span className="inline-flex items-center gap-1 rounded-md bg-red-600 px-2 py-0.5 text-[10px] font-bold text-white shadow-xs">
            <Youtube className="h-3 w-3 fill-white" />
            <span>YouTube</span>
          </span>
        );
      case 'facebook':
        return (
          <span className="inline-flex items-center gap-1 rounded-md bg-blue-600 px-2 py-0.5 text-[10px] font-bold text-white shadow-xs">
            <Facebook className="h-3 w-3 fill-white" />
            <span>Facebook</span>
          </span>
        );
      case 'instagram':
        return (
          <span className="inline-flex items-center gap-1 rounded-md bg-gradient-to-r from-pink-600 to-purple-600 px-2 py-0.5 text-[10px] font-bold text-white shadow-xs">
            <Instagram className="h-3 w-3" />
            <span>Instagram</span>
          </span>
        );
      case 'tiktok':
        return (
          <span className="inline-flex items-center gap-1 rounded-md bg-black px-2 py-0.5 text-[10px] font-bold text-white border border-slate-700 shadow-xs">
            <Radio className="h-3 w-3 text-cyan-400" />
            <span>TikTok</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 rounded-md bg-slate-800 px-2 py-0.5 text-[10px] font-bold text-white shadow-xs">
            <Globe className="h-3 w-3 text-orange-400" />
            <span>Stream</span>
          </span>
        );
    }
  };

  return (
    <div className="w-full space-y-6">
      {/* HEADER BANNER */}
      <div className="rounded-2xl border border-slate-200 bg-gradient-to-r from-slate-900 via-slate-800 to-orange-950 p-5 sm:p-7 text-white shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1.5 max-w-2xl">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-orange-600/90 border border-orange-500/50 px-2.5 py-0.5 text-[11px] font-bold text-white shadow-xs">
                <Film className="h-3.5 w-3.5" />
                <span>YouTube, Facebook, Instagram & Streams</span>
              </span>
              <span className="inline-flex items-center gap-1.5 text-xs text-emerald-400 font-mono bg-emerald-950/60 border border-emerald-500/30 px-2.5 py-0.5 rounded-full">
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>Live Cloud Sync Active</span>
              </span>
            </div>
            <h1 className="font-display text-2xl sm:text-3xl font-black text-white tracking-tight">
              Tournament Highlights & Match Replays
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Watch match replays, event recaps, championship finals, and tournament streams across Nepal. Anyone can link YouTube, Facebook, Instagram Reels, TikTok, or live stream links — instantly synced across all devices!
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
            <button
              onClick={() => fetchAllVideos(false)}
              disabled={isLoadingSync}
              className="flex items-center gap-1.5 rounded-xl border border-white/20 bg-white/10 hover:bg-white/20 px-3.5 py-2 text-xs font-semibold text-white transition-colors cursor-pointer active:scale-95"
              title="Sync latest videos from cloud"
            >
              {justSynced ? (
                <>
                  <Check className="h-3.5 w-3.5 text-emerald-400" />
                  <span>Synced!</span>
                </>
              ) : (
                <>
                  <RefreshCw className={`h-3.5 w-3.5 ${isLoadingSync ? 'animate-spin' : ''}`} />
                  <span>Sync Cloud</span>
                </>
              )}
            </button>

            <button
              onClick={() => setIsAddModalOpen(true)}
              className="flex items-center gap-2 rounded-xl bg-orange-500 hover:bg-orange-600 px-4 py-2.5 text-xs sm:text-sm font-bold text-white shadow-md shadow-orange-500/30 transition-all active:scale-95 cursor-pointer"
            >
              <PlusCircle className="h-4 w-4" />
              <span>Link Video / Stream</span>
            </button>
          </div>
        </div>

        {/* SEARCH & FILTER BAR */}
        <div className="mt-6 pt-5 border-t border-white/10 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {/* Categories & Platforms */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 overflow-x-auto pb-1 scrollbar-none no-scrollbar">
            {/* Category selector */}
            <div className="flex items-center gap-1.5">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                    selectedCategory === cat
                      ? 'bg-orange-500 text-white shadow-xs'
                      : 'bg-white/10 hover:bg-white/20 text-slate-200'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Platform pills */}
            <div className="flex items-center gap-1 border-t sm:border-t-0 sm:border-l border-white/10 pt-2 sm:pt-0 sm:pl-2">
              {platforms.map((p) => (
                <button
                  key={p.id}
                  onClick={() => setSelectedPlatform(p.id)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold whitespace-nowrap transition-all cursor-pointer ${
                    selectedPlatform === p.id
                      ? 'bg-white text-slate-900 font-bold'
                      : 'text-slate-300 hover:text-white hover:bg-white/10'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Search Bar */}
          <div className="relative min-w-[220px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search title, channel, creator..."
              className="w-full rounded-xl border border-white/10 bg-white/10 pl-8 pr-7 py-1.5 text-xs text-white placeholder-slate-400 focus:bg-white/20 focus:outline-none focus:border-orange-500"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* VIDEOS GRID */}
      {filteredVideos.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center space-y-3">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-orange-100 text-orange-600">
            <Tv className="h-7 w-7" />
          </div>
          <h3 className="font-display text-lg font-bold text-slate-900">
            No Videos Found in This Category
          </h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Be the first to share an official tournament replay, match highlight, or stream by submitting a link from YouTube, Facebook, Instagram, or TikTok! It will be instantly viewable across all devices via live cloud sync.
          </p>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="inline-flex items-center gap-2 rounded-xl bg-orange-500 hover:bg-orange-600 px-4 py-2 text-xs font-bold text-white shadow-xs transition-all cursor-pointer"
          >
            <PlusCircle className="h-4 w-4" />
            <span>Link Video Now</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredVideos.map((video) => (
            <div
              key={video.id}
              onClick={() => setActiveVideoModal(video)}
              className="group flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs hover:shadow-md hover:border-orange-300 transition-all cursor-pointer"
            >
              {/* VIDEO COVER / THUMBNAIL (As requested: see cover page, title and channel name) */}
              <div className="relative aspect-video w-full overflow-hidden bg-slate-950">
                <img
                  src={video.thumbnailUrl}
                  alt={video.title}
                  className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                  onError={(e) => {
                    const target = e.currentTarget as HTMLImageElement;
                    if (video.youtubeId) {
                      target.src = `https://img.youtube.com/vi/${video.youtubeId}/0.jpg`;
                    } else {
                      target.src = DEFAULT_COVERS.football;
                    }
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-black/20" />

                {/* PLAY BUTTON OVERLAY */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className={`flex h-12 w-12 items-center justify-center rounded-full text-white shadow-xl group-hover:scale-110 transition-transform ${
                    video.platform === 'facebook'
                      ? 'bg-blue-600 shadow-blue-600/40'
                      : video.platform === 'instagram'
                      ? 'bg-gradient-to-tr from-pink-600 to-purple-600 shadow-purple-600/40'
                      : 'bg-red-600 shadow-red-600/40'
                  }`}>
                    <Play className="h-5 w-5 fill-white ml-0.5" />
                  </div>
                </div>

                {/* Top Badge: Category */}
                <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5">
                  <span className="rounded-lg bg-slate-900/90 backdrop-blur-md border border-white/20 px-2 py-0.5 text-[10px] font-bold text-white">
                    {video.category || 'Tournament'}
                  </span>
                </div>

                {/* Bottom Overlay: Platform Badge */}
                <div className="absolute bottom-2.5 right-2.5">
                  {renderPlatformBadge(video.platform)}
                </div>
              </div>

              {/* CARD DETAILS: TITLE, CHANNEL NAME & ACTIONS */}
              <div className="flex flex-1 flex-col p-4 justify-between space-y-3">
                <div className="space-y-1.5">
                  {/* Title (dominant & clear) */}
                  <h3 className="font-display font-bold text-sm text-slate-900 line-clamp-2 leading-snug group-hover:text-orange-600 transition-colors">
                    {video.title}
                  </h3>

                  {/* Channel Name / Creator Name */}
                  <div className="flex items-center gap-1.5 text-xs text-slate-600">
                    <span className="font-bold text-slate-900 truncate" title={video.channelName}>
                      {video.channelName}
                    </span>
                  </div>
                </div>

                {/* Bottom Row */}
                <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-[11px] text-slate-400">
                  <span className="truncate">
                    Added: {video.createdAt || 'Recent'}
                  </span>

                  <div className="flex items-center gap-2">
                    <a
                      href={video.videoUrl || video.youtubeUrl}
                      target="_blank"
                      rel="noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="inline-flex items-center gap-1 font-bold text-slate-600 hover:text-orange-600 transition-colors"
                      title="Open Original Source"
                    >
                      <ExternalLink className="h-3 w-3" />
                      <span>Watch</span>
                    </a>

                    <button
                      type="button"
                      onClick={(e) => handleDeleteVideo(video.id, e)}
                      className="text-slate-400 hover:text-rose-600 p-1 rounded-md transition-colors"
                      title="Remove video from all devices"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* MODAL 1: ADD VIDEO MODAL (MULTI-PLATFORM) */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-xs">
          <div className="relative w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-2xl animate-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-orange-500 text-white shadow-md shadow-orange-500/30">
                  <Film className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-display font-bold text-base text-slate-900">
                    Link Community Video / Match Highlight
                  </h3>
                  <p className="text-xs text-slate-500">
                    Supports YouTube, Facebook, Instagram Reels, TikTok, and streams.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  setIsAddModalOpen(false);
                  setFormError('');
                }}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Error banner */}
            {formError && (
              <div className="mb-4 rounded-xl bg-rose-50 border border-rose-200 p-2.5 text-xs font-semibold text-rose-700">
                {formError}
              </div>
            )}

            <form onSubmit={handleAddVideo} className="space-y-4">
              {/* Video Link Input */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-slate-800">
                    Video URL or Stream Link *
                  </label>
                  {videoUrlInput && (
                    <span className="text-[11px] font-bold">
                      {renderPlatformBadge(detectedInputPlatform)}
                    </span>
                  )}
                </div>
                <input
                  type="text"
                  required
                  value={videoUrlInput}
                  onChange={(e) => setVideoUrlInput(e.target.value)}
                  placeholder="Paste YouTube, Facebook watch, Instagram Reel, TikTok, or stream link"
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 focus:border-orange-500 focus:outline-none"
                />
                <span className="text-[10px] text-slate-400 mt-1 block">
                  e.g. YouTube URL, Facebook video link, Instagram Reel link, TikTok, or live stream URL.
                </span>
              </div>

              {/* Cover Page / Thumbnail Live Preview (As requested by user!) */}
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-700 flex items-center gap-1.5">
                    <CheckCircle className="h-3.5 w-3.5 text-emerald-500" />
                    Cover Page Preview
                  </span>
                  <span className="text-[10px] text-slate-400">
                    {currentYoutubeId ? 'Auto-extracted from YouTube' : 'Default / Custom thumbnail'}
                  </span>
                </div>

                <div className="relative aspect-video w-full rounded-lg overflow-hidden bg-slate-900 border border-slate-200 shadow-2xs">
                  <img
                    src={livePreviewThumbnail}
                    alt="Cover Preview"
                    className="h-full w-full object-cover"
                  />
                  <div className="absolute inset-0 flex items-center justify-center bg-black/25">
                    <div className="h-10 w-10 rounded-full bg-orange-500 text-white flex items-center justify-center shadow-md">
                      <Play className="h-4 w-4 fill-white ml-0.5" />
                    </div>
                  </div>
                </div>

                {/* Optional Custom Thumbnail URL for Facebook/Insta/Streams */}
                {!currentYoutubeId && (
                  <div className="pt-1">
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Custom Cover / Thumbnail Image URL (Optional)
                    </label>
                    <input
                      type="url"
                      value={customThumbnailUrl}
                      onChange={(e) => setCustomThumbnailUrl(e.target.value)}
                      placeholder="https://... (or leave empty to use category cover)"
                      className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-900 focus:border-orange-500 focus:outline-none"
                    />
                  </div>
                )}
              </div>

              {/* Video Title */}
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  Video Title *
                </label>
                <input
                  type="text"
                  required
                  value={videoTitle}
                  onChange={(e) => setVideoTitle(e.target.value)}
                  placeholder="e.g. Nepal Futsal Championship 2026 - Semi-Final 1"
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 focus:border-orange-500 focus:outline-none"
                />
              </div>

              {/* Channel / Page / Creator Name */}
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  Channel / Page Name / Creator *
                </label>
                <input
                  type="text"
                  required
                  value={channelName}
                  onChange={(e) => setChannelName(e.target.value)}
                  placeholder="e.g. Action Sports Nepal, Kathmandu Futsal Live, Organizer FB Page"
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 focus:border-orange-500 focus:outline-none"
                />
              </div>

              {/* Category & Contributor */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    Sport / Competition Category
                  </label>
                  <select
                    value={videoCategory}
                    onChange={(e) => setVideoCategory(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-800 focus:border-orange-500 focus:outline-none"
                  >
                    <option value="Football">Football & Futsal</option>
                    <option value="Basketball">Basketball</option>
                    <option value="Esports">Esports & Gaming</option>
                    <option value="MUN & Debate">MUN & Debate</option>
                    <option value="Quiz">Quiz & Trivia</option>
                    <option value="Case Competition">Case Competition</option>
                    <option value="Cultural">Arts & Cultural</option>
                    <option value="Other">Other Competition</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    Added By (Optional)
                  </label>
                  <input
                    type="text"
                    value={contributorName}
                    onChange={(e) => setContributorName(e.target.value)}
                    placeholder="Your Name or Club"
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 focus:border-orange-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 px-4 py-2 text-xs font-bold text-slate-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="rounded-xl bg-orange-500 hover:bg-orange-600 px-5 py-2 text-xs font-bold text-white shadow-md shadow-orange-500/30 transition-all active:scale-95 cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? 'Syncing to Cloud...' : 'Publish Video Link'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: WATCH VIDEO IN-APP PLAYER */}
      {activeVideoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/90 p-4 backdrop-blur-md">
          <div className="relative w-full max-w-4xl rounded-2xl border border-slate-800 bg-slate-900 p-4 sm:p-6 shadow-2xl text-white">
            {/* Top Bar */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-3">
              <div className="flex items-center gap-2 min-w-0 pr-4">
                {renderPlatformBadge(activeVideoModal.platform)}
                <h3 className="font-display font-bold text-sm sm:text-base text-white truncate">
                  {activeVideoModal.title}
                </h3>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <a
                  href={activeVideoModal.videoUrl || activeVideoModal.youtubeUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 rounded-lg bg-slate-800 hover:bg-slate-700 px-2.5 py-1 text-xs font-bold text-slate-200 transition-colors"
                >
                  <span>Open in {activeVideoModal.platform === 'facebook' ? 'Facebook' : activeVideoModal.platform === 'instagram' ? 'Instagram' : 'App'}</span>
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>

                <button
                  onClick={() => setActiveVideoModal(null)}
                  className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Embedded Player or Direct Presentation */}
            <div className="relative aspect-video w-full rounded-xl overflow-hidden bg-black shadow-lg">
              {activeVideoModal.youtubeId ? (
                <iframe
                  src={`https://www.youtube-nocookie.com/embed/${activeVideoModal.youtubeId}?autoplay=1&rel=0`}
                  title={activeVideoModal.title}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                  className="h-full w-full border-0"
                />
              ) : activeVideoModal.platform === 'facebook' ? (
                <div className="h-full w-full flex flex-col items-center justify-center p-6 text-center space-y-4 bg-gradient-to-br from-blue-950 to-slate-900">
                  <div className="h-16 w-16 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-lg">
                    <Facebook className="h-8 w-8" />
                  </div>
                  <div className="max-w-md">
                    <h4 className="font-display font-bold text-lg text-white">
                      Facebook Match Stream / Reel
                    </h4>
                    <p className="text-xs text-slate-300 mt-1">
                      {activeVideoModal.title}
                    </p>
                  </div>
                  <a
                    href={activeVideoModal.videoUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-700 px-6 py-2.5 text-xs font-bold text-white shadow-md transition-all active:scale-95"
                  >
                    <span>Watch Directly on Facebook</span>
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </div>
              ) : (
                <div className="h-full w-full flex flex-col items-center justify-center p-6 text-center space-y-4 bg-gradient-to-br from-slate-950 to-slate-900">
                  <div className="h-16 w-16 rounded-2xl bg-orange-500 text-white flex items-center justify-center shadow-lg">
                    <Radio className="h-8 w-8" />
                  </div>
                  <div className="max-w-md">
                    <h4 className="font-display font-bold text-lg text-white">
                      {activeVideoModal.platform === 'instagram' ? 'Instagram Reel' : 'Live Tournament Stream'}
                    </h4>
                    <p className="text-xs text-slate-300 mt-1">
                      {activeVideoModal.title}
                    </p>
                  </div>
                  <a
                    href={activeVideoModal.videoUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 rounded-xl bg-orange-500 hover:bg-orange-600 px-6 py-2.5 text-xs font-bold text-white shadow-md transition-all active:scale-95"
                  >
                    <span>Open External Video Stream</span>
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </div>
              )}
            </div>

            {/* Bottom Info */}
            <div className="mt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-300">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-bold text-white text-sm">
                  {activeVideoModal.channelName}
                </span>
                <span className="text-slate-500">•</span>
                <span className="rounded-full bg-slate-800 px-2.5 py-0.5 text-[11px] font-semibold text-slate-300 border border-slate-700">
                  {activeVideoModal.category || 'Tournament'}
                </span>
                {activeVideoModal.addedBy && (
                  <>
                    <span className="text-slate-500">•</span>
                    <span className="text-slate-400">
                      Shared by {activeVideoModal.addedBy}
                    </span>
                  </>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const targetUrl = activeVideoModal.videoUrl || activeVideoModal.youtubeUrl || '';
                    navigator.clipboard.writeText(targetUrl);
                    alert('Video link copied to clipboard!');
                  }}
                  className="flex items-center gap-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 px-3 py-1.5 text-xs font-semibold text-slate-200 transition-colors"
                >
                  <Share2 className="h-3.5 w-3.5" />
                  <span>Copy Link</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
