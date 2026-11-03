import { createClient } from '@supabase/supabase-js';
import { Tournament, Registration, CommunityVideo } from '../types';
import { DEFAULT_POSTER_FALLBACK } from '../data/mockTournaments';

// Supabase configuration
export const SUPABASE_URL = 'https://tevzpqfoaumgzpljimrc.supabase.co';
export const SUPABASE_ANON_KEY = 'sb_publishable_C6EM7jUC3LIFWUKqYOyP5Q_NM4Ik2pv';

export const isSupabaseConfigured = Boolean(
  SUPABASE_URL && 
  SUPABASE_ANON_KEY && 
  !SUPABASE_URL.includes('your-project')
);

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

export interface CloudSyncResult {
  activeTournaments: Tournament[];
  deletedIds: string[];
}

// 1. Fetch both active tournaments and deleted IDs from Supabase cloud
export const fetchCloudTournamentsWithDeleted = async (): Promise<CloudSyncResult> => {
  try {
    const fetchPromise = supabase
      .from('tournaments')
      .select('*')
      .order('created_at', { ascending: false });

    const timeoutPromise = new Promise<{ data: null; error: { message: string } }>((resolve) =>
      setTimeout(() => resolve({ data: null, error: { message: 'Cloud fetch timeout' } }), 4000)
    );

    const { data, error } = (await Promise.race([fetchPromise, timeoutPromise])) as any;

    if (error) {
      console.warn('Supabase fetch notice:', error.message);
      return { activeTournaments: [], deletedIds: [] };
    }

    if (!data || data.length === 0) {
      return { activeTournaments: [], deletedIds: [] };
    }

    const deletedIds: string[] = [];
    const activeTournaments: Tournament[] = [];

    for (const row of data) {
      const isVideoRow =
        row.category === 'COMMUNITY_VIDEO' ||
        row.category?.toLowerCase() === 'community_video' ||
        (typeof row.id === 'string' && row.id.startsWith('vid-')) ||
        row.format === 'youtube' ||
        row.format === 'facebook' ||
        row.format === 'instagram' ||
        row.format === 'tiktok';

      if (row.status === 'deleted' || isVideoRow) {
        if (row.status === 'deleted' || isVideoRow) {
          deletedIds.push(row.id);
        }
        continue;
      }

      // Parse extra rich metadata packed in rules column
      let extra: Partial<Tournament> = {};
      if (row.rules && typeof row.rules === 'string' && row.rules.startsWith('{')) {
        try {
          extra = JSON.parse(row.rules);
        } catch {}
      }

      const tournament: Tournament = {
        id: row.id,
        title: row.title || 'Untitled Opportunity',
        category: row.category || 'Other',
        posterUrl: row.banner_url || extra.posterUrl || DEFAULT_POSTER_FALLBACK,
        startDate: row.start_date || '',
        endDate: row.end_date || row.start_date || '',
        calendarType: extra.calendarType || 'AD',
        bsStartDate: extra.bsStartDate,
        bsEndDate: extra.bsEndDate,
        time: row.time || extra.time || 'TBD',
        location: row.venue || extra.location || `${row.city || 'Kathmandu'}, Nepal`,
        city: row.city || 'Kathmandu',
        province: row.province || 'Bagmati',
        stateCountry: `${row.province || 'Bagmati'}, Nepal`,
        type: row.format || extra.type || 'Open',
        entryFee: Number(row.entry_fee) || 0,
        ageGroup: extra.ageGroup || 'Open',
        prizePool: row.prize_pool || extra.prizePool || 'Trophy & Medals',
        totalTeams: Number(row.max_participants) || 16,
        registeredTeamsCount: Number(row.current_participants) || 0,
        hostName: row.organizer || extra.hostName || 'Event Host',
        hostEmail: row.contact_email || extra.hostEmail || '',
        hostPhone: row.contact_phone || extra.hostPhone || '',
        hostOrg: extra.hostOrg,
        description: row.description || '',
        audienceAdmission: extra.audienceAdmission,
        isFeatured: Boolean(extra.isFeatured),
        officialLink: extra.officialLink,
        isCharity: Boolean(row.is_relief || extra.isCharity),
        isReliefFund: Boolean(row.is_relief || extra.isReliefFund),
        donationLink: extra.donationLink,
        causeTitle: extra.causeTitle || row.relief_beneficiary,
        reliefBankDetails: extra.reliefBankDetails,
        hostPaymentQrUrl: extra.hostPaymentQrUrl,
        hostPaymentMethod: extra.hostPaymentMethod,
        hostPaymentNumber: extra.hostPaymentNumber,
        hostPaymentInstructions: extra.hostPaymentInstructions,
        socialLinks: extra.socialLinks,
        whatsappGroupLink: extra.whatsappGroupLink,
        isHostVerified: Boolean(row.is_verified || extra.isHostVerified),
        hostVerificationType: extra.hostVerificationType,
        transparencyNote: extra.transparencyNote,
        registrationDeadline: row.registration_deadline || extra.registrationDeadline,
        createdAt: row.created_at || new Date().toISOString(),
      };

      activeTournaments.push(tournament);
    }

    return { activeTournaments, deletedIds };
  } catch (err) {
    console.error('Failed to query cloud tournaments:', err);
    return { activeTournaments: [], deletedIds: [] };
  }
};

// Backward-compatible wrapper
export const fetchCloudTournaments = async (): Promise<Tournament[]> => {
  const result = await fetchCloudTournamentsWithDeleted();
  return result.activeTournaments;
};

// 2. Publish a new tournament to Supabase (exact schema alignment)
export const publishCloudTournament = async (tournament: Tournament): Promise<{ success: boolean; error?: string }> => {
  try {
    // Pack rich frontend attributes into the rules JSON column so no information is lost
    const extraMetadata = {
      posterUrl: tournament.posterUrl,
      calendarType: tournament.calendarType,
      bsStartDate: tournament.bsStartDate,
      bsEndDate: tournament.bsEndDate,
      time: tournament.time,
      location: tournament.location,
      type: tournament.type,
      ageGroup: tournament.ageGroup,
      prizePool: tournament.prizePool,
      hostOrg: tournament.hostOrg,
      audienceAdmission: tournament.audienceAdmission,
      isFeatured: tournament.isFeatured,
      officialLink: tournament.officialLink,
      isCharity: tournament.isCharity,
      isReliefFund: tournament.isReliefFund,
      donationLink: tournament.donationLink,
      causeTitle: tournament.causeTitle,
      reliefBankDetails: tournament.reliefBankDetails,
      hostPaymentQrUrl: tournament.hostPaymentQrUrl,
      hostPaymentMethod: tournament.hostPaymentMethod,
      hostPaymentNumber: tournament.hostPaymentNumber,
      hostPaymentInstructions: tournament.hostPaymentInstructions,
      socialLinks: tournament.socialLinks,
      whatsappGroupLink: tournament.whatsappGroupLink,
      hostVerificationType: tournament.hostVerificationType,
      transparencyNote: tournament.transparencyNote,
      registrationDeadline: tournament.registrationDeadline,
    };

    // Format safe date strings (YYYY-MM-DD)
    const startDate = tournament.startDate ? tournament.startDate.split('T')[0] : new Date().toISOString().split('T')[0];
    const regDeadline = tournament.registrationDeadline
      ? tournament.registrationDeadline.split('T')[0]
      : startDate;

    const row = {
      id: tournament.id,
      title: tournament.title || 'Untitled Event',
      category: tournament.category || 'Other',
      format: tournament.type || tournament.teamSize || 'Open',
      status: 'upcoming',
      start_date: startDate,
      end_date: tournament.endDate ? tournament.endDate.split('T')[0] : startDate,
      time: tournament.time || 'TBD',
      city: tournament.city || 'Kathmandu',
      province: tournament.province || 'Bagmati',
      venue: tournament.location || tournament.city || 'Kathmandu, Nepal',
      registration_deadline: regDeadline,
      entry_fee: Number(tournament.entryFee) || 0,
      prize_pool: tournament.prizePool || 'Trophy & Medals',
      max_participants: Number(tournament.totalTeams) || 16,
      current_participants: Number(tournament.registeredTeamsCount) || 0,
      banner_url: tournament.posterUrl || null,
      description: tournament.description || '',
      rules: JSON.stringify(extraMetadata),
      contact_email: tournament.hostEmail || '',
      contact_phone: tournament.hostPhone || '',
      organizer: tournament.hostName || tournament.hostOrg || 'Event Host',
      is_verified: Boolean(tournament.isHostVerified),
      is_relief: Boolean(tournament.isReliefFund || tournament.isCharity),
      relief_beneficiary: tournament.causeTitle || null,
    };

    const { error } = await supabase
      .from('tournaments')
      .upsert(row, { onConflict: 'id' });

    if (error) {
      console.error('Supabase insert tournament error:', error.message);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err: any) {
    console.error('Exception inserting tournament to cloud:', err);
    return { success: false, error: err?.message || 'Network error' };
  }
};

// 3. Increment registration count on cloud
export const incrementCloudRegistrationCount = async (tournamentId: string): Promise<void> => {
  try {
    const { data } = await supabase
      .from('tournaments')
      .select('current_participants')
      .eq('id', tournamentId)
      .single();

    if (data) {
      const nextCount = (Number(data.current_participants) || 0) + 1;
      await supabase
        .from('tournaments')
        .update({ current_participants: nextCount })
        .eq('id', tournamentId);
    }
  } catch (err) {
    console.warn('Could not increment cloud registration count:', err);
  }
};

// 4. Save a new registration pass to Supabase
export const saveCloudRegistration = async (reg: Registration): Promise<{ success: boolean; error?: string }> => {
  try {
    const row = {
      id: reg.id,
      tournament_id: reg.tournamentId || null,
      participant_name: reg.teamName || 'Participant',
      team_name: reg.teamName || null,
      contact_email: reg.contactEmail || 'participant@katatira.np',
      contact_phone: reg.contactPhone || '9800000000',
      status: 'confirmed',
      pass_code: reg.confirmationCode || `KT-${Date.now().toString().slice(-4)}`,
      payment_method: reg.paymentMethod || 'host_qr',
      payment_reference: reg.transactionId || null,
      amount: Number(reg.entryFee) || 0,
    };

    const { error } = await supabase
      .from('registrations')
      .upsert(row, { onConflict: 'id' });

    if (error) {
      console.error('Supabase registration error:', error.message);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err: any) {
    console.error('Exception saving registration to cloud:', err);
    return { success: false, error: err?.message || 'Network error' };
  }
};

// 5. Delete an event from Supabase cloud (uses update status='deleted' to reliably satisfy RLS policies)
export const deleteCloudTournament = async (tournamentId: string): Promise<boolean> => {
  try {
    // 1. Mark status as 'deleted' (this update works reliably with Supabase anon RLS)
    const { error: updateError } = await supabase
      .from('tournaments')
      .update({ status: 'deleted' })
      .eq('id', tournamentId);

    // 2. Also attempt hard delete in case RLS allows
    await supabase.from('tournaments').delete().eq('id', tournamentId);

    if (updateError) {
      console.warn('Failed to soft-delete tournament from cloud:', updateError.message);
      return false;
    }
    return true;
  } catch (err) {
    console.error('Error deleting tournament from cloud:', err);
    return false;
  }
};

// 6. Fetch all cloud registrations for multi-device sync
export const fetchCloudRegistrations = async (): Promise<Registration[]> => {
  try {
    const { data, error } = await supabase
      .from('registrations')
      .select('*')
      .neq('id', 'test-reg-1')
      .order('created_at', { ascending: false });

    if (error || !data) return [];

    return data.map((row: any) => ({
      id: row.id,
      tournamentId: row.tournament_id || '',
      tournamentTitle: 'Opportunity Registration',
      tournamentPoster: '',
      tournamentStartDate: '',
      tournamentEndDate: '',
      tournamentTime: '',
      tournamentLocation: '',
      tournamentCity: '',
      tournamentType: 'Open',
      teamName: row.team_name || row.participant_name || 'Participant',
      contactEmail: row.contact_email || '',
      contactPhone: row.contact_phone || '',
      entryFee: Number(row.amount) || 0,
      totalAmount: Number(row.amount) || 0,
      paymentMethod: (row.payment_method as any) || 'fonepay',
      transactionId: row.payment_reference || '',
      paymentStatus: (row.status === 'confirmed' ? 'confirmed' : 'pending') as any,
      registeredAt: row.created_at || new Date().toISOString(),
      confirmationCode: row.pass_code || row.id,
      ticketQrCode: row.pass_code || row.id,
    }));
  } catch (err) {
    console.error('Failed to query cloud registrations:', err);
    return [];
  }
};

// 7. Update verification status of a tournament in Supabase
export const updateCloudTournamentVerification = async (
  tournamentId: string,
  isVerified: boolean
): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('tournaments')
      .update({ is_verified: isVerified })
      .eq('id', tournamentId);

    if (error) {
      console.warn('Error updating verification status in cloud:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.error('Exception updating tournament verification in cloud:', err);
    return false;
  }
};

const DELETED_VIDEOS_STORAGE_KEY = 'katatira_deleted_video_ids_v1';

export const getLocalDeletedVideoIds = (): Set<string> => {
  try {
    const raw = localStorage.getItem(DELETED_VIDEOS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return new Set(parsed);
    }
  } catch {}
  return new Set();
};

export const markVideoAsDeletedLocally = (id: string): void => {
  try {
    const set = getLocalDeletedVideoIds();
    set.add(id);
    localStorage.setItem(DELETED_VIDEOS_STORAGE_KEY, JSON.stringify(Array.from(set)));
  } catch {}
};

// 8. Fetch community videos from global cloud database (True Cross-Device Sync)
export const fetchCloudVideos = async (): Promise<CommunityVideo[]> => {
  try {
    const localDeleted = getLocalDeletedVideoIds();

    const { data, error } = await supabase
      .from('tournaments')
      .select('*')
      .eq('category', 'COMMUNITY_VIDEO')
      .neq('status', 'deleted')
      .order('created_at', { ascending: false });

    if (error || !data) {
      console.warn('Could not fetch cloud videos:', error?.message);
      return [];
    }

    const videos: CommunityVideo[] = [];
    for (const row of data) {
      // Exclude any deleted rows or locally confirmed deletions
      if (localDeleted.has(row.id)) continue;
      if (row.status === 'deleted' || row.title === '[DELETED]') continue;

      if (row.rules && typeof row.rules === 'string') {
        try {
          const parsed = JSON.parse(row.rules);
          if (parsed && parsed.title && parsed.videoUrl) {
            videos.push({
              id: row.id,
              videoUrl: parsed.videoUrl,
              youtubeUrl: parsed.youtubeUrl || parsed.videoUrl,
              youtubeId: parsed.youtubeId,
              platform: parsed.platform || row.format || 'youtube',
              title: row.title || parsed.title,
              channelName: row.organizer || parsed.channelName || 'Community Creator',
              thumbnailUrl: row.banner_url || parsed.thumbnailUrl || '',
              category: parsed.category || 'Football',
              addedBy: parsed.addedBy || 'Community Member',
              createdAt: row.created_at ? row.created_at.split('T')[0] : (parsed.createdAt || ''),
            });
          }
        } catch {}
      }
    }
    return videos;
  } catch (err) {
    console.warn('Exception querying cloud videos:', err);
    return [];
  }
};

// 9. Save community video to global cloud database (Accessible across all devices)
export const publishCloudVideo = async (
  video: CommunityVideo
): Promise<{ success: boolean; error?: string }> => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const row = {
      id: video.id,
      title: video.title,
      category: 'COMMUNITY_VIDEO',
      format: video.platform || 'youtube',
      status: 'active',
      start_date: today,
      end_date: today,
      time: 'Replay',
      city: 'Kathmandu',
      province: 'Bagmati',
      venue: 'Online / Multi-Platform',
      registration_deadline: `${today}T23:59:59`,
      entry_fee: 0,
      prize_pool: 'N/A',
      max_participants: 0,
      current_participants: 0,
      banner_url: video.thumbnailUrl || null,
      description: video.title,
      rules: JSON.stringify(video),
      contact_email: '',
      contact_phone: '',
      organizer: video.channelName || 'Community Creator',
      is_verified: true,
      is_relief: false,
    };

    const { error } = await supabase.from('tournaments').upsert(row, { onConflict: 'id' });
    if (error) {
      console.error('Supabase video save error:', error.message);
      return { success: false, error: error.message };
    }
    return { success: true };
  } catch (err: any) {
    console.error('Exception publishing video to cloud:', err);
    return { success: false, error: err?.message || 'Network error' };
  }
};

// 10. Delete community video from global cloud database
export const deleteCloudVideo = async (videoId: string): Promise<boolean> => {
  try {
    // 1. Mark in client-side persistent deleted set
    markVideoAsDeletedLocally(videoId);

    // 2. Mark status as deleted and clear title in Supabase Cloud
    await supabase
      .from('tournaments')
      .update({ status: 'deleted', title: '[DELETED]' })
      .eq('id', videoId);

    // 3. Attempt hard delete in Supabase Cloud
    await supabase
      .from('tournaments')
      .delete()
      .eq('id', videoId);

    // 4. Also call server endpoint to persist in server mirror
    try {
      await fetch(`/api/videos/${videoId}`, { method: 'DELETE' });
    } catch {}

    return true;
  } catch (err) {
    console.error('Exception deleting cloud video:', err);
    return true; // Still marked deleted locally
  }
};
