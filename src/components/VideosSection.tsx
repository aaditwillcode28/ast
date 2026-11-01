import React, { useState, useEffect } from 'react';
import {
  Youtube,
  Play,
  PlusCircle,
  ExternalLink,
  Film,
  Search,
  X,
  Eye,
  CheckCircle,
  Trash2,
  Tv,
  Sparkles,
  Share2
} from 'lucide-react';
import { CommunityVideo } from '../types';

const STORAGE_KEY = 'katatira_community_videos_v1';

// No demo/fake YouTube videos — real videos are linked directly by organizers and players
const INITIAL_COMMUNITY_VIDEOS: CommunityVideo[] = [];

// Helper to extract YouTube 11-char Video ID
export const extractYoutubeId = (url: string): string | null => {
  if (!url) return null;
  const trimmed = url.trim();
  // Match standard, youtu.be, embed, shorts, and raw IDs
  const regExp = /(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/|v\/))([\w-]{11})/;
  const match = trimmed.match(regExp);
  if (match && match[1]) {
    return match[1];
  }
  // If the user pasted just the 11-char ID
  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) {
    return trimmed;
  }
  return null;
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
          // Purge any demo legacy video items
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
    return INITIAL_COMMUNITY_VIDEOS;
  });

  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [activeVideoModal, setActiveVideoModal] = useState<CommunityVideo | null>(null);

  // Form State for Adding a Video
  const [videoUrlInput, setVideoUrlInput] = useState('');
  const [videoTitle, setVideoTitle] = useState('');
  const [channelName, setChannelName] = useState('');
  const [videoCategory, setVideoCategory] = useState('Football');
  const [contributorName, setContributorName] = useState('');
  const [formError, setFormError] = useState('');
  const [previewYoutubeId, setPreviewYoutubeId] = useState<string | null>(null);

  // Save to localStorage whenever videos change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(videos));
    } catch {}
  }, [videos]);

  // When URL input changes, attempt to parse the YouTube ID for instant cover preview
  useEffect(() => {
    const id = extractYoutubeId(videoUrlInput);
    setPreviewYoutubeId(id);
    if (id && !videoTitle) {
      // Suggest a starter title or let user fill it
      setFormError('');
    }
  }, [videoUrlInput, videoTitle]);

  const handleAddVideo = (e: React.FormEvent) => {
    e.preventDefault();
    const id = extractYoutubeId(videoUrlInput);
    if (!id) {
      setFormError('Please enter a valid YouTube link (e.g. https://www.youtube.com/watch?v=... or https://youtu.be/...)');
      return;
    }
    if (!videoTitle.trim()) {
      setFormError('Please enter the video title.');
      return;
    }
    if (!channelName.trim()) {
      setFormError('Please enter the channel / organizer name.');
      return;
    }

    const newVideo: CommunityVideo = {
      id: `vid-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      youtubeUrl: videoUrlInput.trim(),
      youtubeId: id,
      title: videoTitle.trim(),
      channelName: channelName.trim(),
      thumbnailUrl: `https://img.youtube.com/vi/${id}/hqdefault.jpg`,
      category: videoCategory,
      addedBy: contributorName.trim() || 'Community Member',
      createdAt: new Date().toISOString().split('T')[0],
    };

    setVideos([newVideo, ...videos]);
    setIsAddModalOpen(false);

    // Reset Form
    setVideoUrlInput('');
    setVideoTitle('');
    setChannelName('');
    setContributorName('');
    setFormError('');
    setPreviewYoutubeId(null);
  };

  const handleDeleteVideo = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm('Are you sure you want to remove this video from the list?')) {
      setVideos(videos.filter((v) => v.id !== id));
      if (activeVideoModal?.id === id) {
        setActiveVideoModal(null);
      }
    }
  };

  const filteredVideos = videos.filter((v) => {
    const matchesCat = selectedCategory === 'All' || v.category === selectedCategory;
    const matchesQuery =
      !searchQuery.trim() ||
      v.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.channelName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (v.category && v.category.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCat && matchesQuery;
  });

  const categories = ['All', 'Football', 'Basketball', 'Esports', 'MUN & Debate', 'Quiz', 'Case Competition'];

  return (
    <div className="w-full space-y-6">
      {/* HEADER BANNER */}
      <div className="rounded-2xl border border-slate-200 bg-gradient-to-r from-slate-900 via-slate-800 to-orange-950 p-5 sm:p-7 text-white shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1.5 max-w-2xl">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-red-600/90 border border-red-500/50 px-2.5 py-0.5 text-[11px] font-bold text-white shadow-xs">
                <Youtube className="h-3.5 w-3.5" />
                <span>YouTube Match Highlights & Streams</span>
              </span>
              <span className="text-xs text-slate-300 font-mono">
                {videos.length} Videos Available
              </span>
            </div>
            <h1 className="font-display text-2xl sm:text-3xl font-black text-white tracking-tight">
              Tournament Highlights & Match Replays
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Watch final match replays, event recaps, esports showdowns, and tournament streams across Nepal. Anyone can link YouTube videos to share match moments.
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="flex items-center gap-2 rounded-xl bg-orange-500 hover:bg-orange-600 px-4 py-2.5 text-xs sm:text-sm font-bold text-white shadow-md shadow-orange-500/30 transition-all active:scale-95 cursor-pointer"
            >
              <PlusCircle className="h-4 w-4" />
              <span>Link YouTube Video</span>
            </button>
          </div>
        </div>

        {/* SEARCH & CATEGORY FILTER BAR */}
        <div className="mt-6 pt-5 border-t border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Categories */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none no-scrollbar">
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

          {/* Search Bar */}
          <div className="relative min-w-[240px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search title, channel..."
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
            Be the first to share an official tournament replay, match highlight, or stream by submitting a YouTube link!
          </p>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="inline-flex items-center gap-2 rounded-xl bg-orange-500 hover:bg-orange-600 px-4 py-2 text-xs font-bold text-white shadow-xs transition-all"
          >
            <PlusCircle className="h-4 w-4" />
            <span>Submit First Video</span>
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
              {/* VIDEO COVER / THUMBNAIL */}
              <div className="relative aspect-video w-full overflow-hidden bg-slate-950">
                <img
                  src={video.thumbnailUrl}
                  alt={video.title}
                  className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                  onError={(e) => {
                    const target = e.currentTarget as HTMLImageElement;
                    // Fallback to medium resolution thumbnail if high-res fails
                    target.src = `https://img.youtube.com/vi/${video.youtubeId}/0.jpg`;
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-black/20" />

                {/* PLAY BUTTON OVERLAY */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-600 text-white shadow-xl shadow-red-600/40 group-hover:scale-110 transition-transform">
                    <Play className="h-5 w-5 fill-white ml-0.5" />
                  </div>
                </div>

                {/* Top Badge: Category */}
                <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5">
                  <span className="rounded-lg bg-slate-900/90 backdrop-blur-md border border-white/20 px-2 py-0.5 text-[10px] font-bold text-white">
                    {video.category || 'Tournament'}
                  </span>
                </div>

                {/* Bottom Overlay: YouTube Badge */}
                <div className="absolute bottom-2.5 right-2.5">
                  <span className="inline-flex items-center gap-1 rounded-md bg-black/80 backdrop-blur-md px-2 py-0.5 text-[10px] font-mono font-bold text-white">
                    <Youtube className="h-3 w-3 text-red-500 fill-red-500" />
                    <span>Watch</span>
                  </span>
                </div>
              </div>

              {/* CARD DETAILS: TITLE, CHANNEL NAME & ACTIONS */}
              <div className="flex flex-1 flex-col p-4 justify-between space-y-3">
                <div className="space-y-1.5">
                  {/* Title */}
                  <h3 className="font-display font-bold text-sm text-slate-900 line-clamp-2 leading-snug group-hover:text-orange-600 transition-colors">
                    {video.title}
                  </h3>

                  {/* Channel Name */}
                  <div className="flex items-center gap-1.5 text-xs text-slate-600">
                    <div className="flex h-4 w-4 items-center justify-center rounded-full bg-red-100 text-red-600 font-bold text-[9px]">
                      YT
                    </div>
                    <span className="font-semibold text-slate-800 truncate" title={video.channelName}>
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
                      href={video.youtubeUrl}
                      target="_blank"
                      rel="noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="inline-flex items-center gap-1 font-bold text-slate-600 hover:text-red-600 transition-colors"
                      title="Open on YouTube"
                    >
                      <ExternalLink className="h-3 w-3" />
                      <span>YouTube</span>
                    </a>

                    <button
                      type="button"
                      onClick={(e) => handleDeleteVideo(video.id, e)}
                      className="text-slate-400 hover:text-rose-600 p-1 rounded-md transition-colors"
                      title="Remove video"
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

      {/* MODAL 1: ADD VIDEO MODAL */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-xs">
          <div className="relative w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-2xl animate-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-red-600 text-white shadow-md shadow-red-600/30">
                  <Youtube className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-display font-bold text-base text-slate-900">
                    Link YouTube Video
                  </h3>
                  <p className="text-xs text-slate-500">
                    Add tournament finals, match highlights, or streams.
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
              {/* YouTube Link Input */}
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  YouTube Video Link or URL *
                </label>
                <input
                  type="text"
                  required
                  value={videoUrlInput}
                  onChange={(e) => setVideoUrlInput(e.target.value)}
                  placeholder="https://www.youtube.com/watch?v=... or https://youtu.be/..."
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 focus:border-orange-500 focus:outline-none"
                />
                <span className="text-[10px] text-slate-400 mt-1 block">
                  Accepts standard YouTube links, youtu.be shortlinks, or shorts.
                </span>
              </div>

              {/* Cover Page / Thumbnail Live Preview */}
              {previewYoutubeId && (
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 space-y-2">
                  <span className="text-[11px] font-bold text-slate-700 flex items-center gap-1.5">
                    <CheckCircle className="h-3.5 w-3.5 text-emerald-500" /> Cover Thumbnail Detected
                  </span>
                  <div className="relative aspect-video w-full rounded-lg overflow-hidden bg-slate-900 border border-slate-200 shadow-2xs">
                    <img
                      src={`https://img.youtube.com/vi/${previewYoutubeId}/hqdefault.jpg`}
                      alt="Cover Preview"
                      className="h-full w-full object-cover"
                    />
                    <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                      <div className="h-10 w-10 rounded-full bg-red-600 text-white flex items-center justify-center shadow-md">
                        <Play className="h-4 w-4 fill-white ml-0.5" />
                      </div>
                    </div>
                  </div>
                </div>
              )}

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

              {/* Channel Name */}
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  Channel Name / Creator *
                </label>
                <input
                  type="text"
                  required
                  value={channelName}
                  onChange={(e) => setChannelName(e.target.value)}
                  placeholder="e.g. Action Sports Nepal, NeBA TV, Organizer Channel"
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
                  className="rounded-xl bg-orange-500 hover:bg-orange-600 px-5 py-2 text-xs font-bold text-white shadow-md shadow-orange-500/30 transition-all active:scale-95 cursor-pointer"
                >
                  Publish Video Link
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
                <span className="rounded-md bg-red-600 px-2 py-0.5 text-[10px] font-bold text-white shrink-0">
                  YouTube
                </span>
                <h3 className="font-display font-bold text-sm sm:text-base text-white truncate">
                  {activeVideoModal.title}
                </h3>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <a
                  href={activeVideoModal.youtubeUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 rounded-lg bg-slate-800 hover:bg-slate-700 px-2.5 py-1 text-xs font-bold text-slate-200 transition-colors"
                >
                  <span>Open in App</span>
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

            {/* Embedded Iframe Player */}
            <div className="relative aspect-video w-full rounded-xl overflow-hidden bg-black shadow-lg">
              <iframe
                src={`https://www.youtube-nocookie.com/embed/${activeVideoModal.youtubeId}?autoplay=1&rel=0`}
                title={activeVideoModal.title}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
                className="h-full w-full border-0"
              />
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
                    navigator.clipboard.writeText(activeVideoModal.youtubeUrl);
                    alert('YouTube link copied to clipboard!');
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
