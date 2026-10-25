import { createClient } from '@supabase/supabase-js';
import { Tournament, Registration } from '../types';
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

// 1. Fetch all cloud tournaments
export const fetchCloudTournaments = async (): Promise<Tournament[]> => {
  try {
    const fetchPromise = supabase
      .from('tournaments')
      .select('*')
      .neq('status', 'deleted')
      .order('created_at', { ascending: false });

    const timeoutPromise = new Promise<{ data: null; error: { message: string } }>((resolve) =>
      setTimeout(() => resolve({ data: null, error: { message: 'Cloud fetch timeout' } }), 4000)
    );

    const { data, error } = (await Promise.race([fetchPromise, timeoutPromise])) as any;

    if (error) {
      console.warn('Supabase fetch notice:', error.message);
      return [];
    }

    if (!data || data.length === 0) return [];

    return data
      .filter((row: any) => row.status !== 'deleted')
      .map((row: any) => {
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

      return tournament;
    });
  } catch (err) {
    console.error('Failed to query cloud tournaments:', err);
    return [];
  }
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
