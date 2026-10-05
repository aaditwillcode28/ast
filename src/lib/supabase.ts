import { createClient } from '@supabase/supabase-js';
import { Tournament, Registration } from '../types';

// Supabase configuration
// Using the project URL (without /rest/v1/) and anon/publishable key
export const SUPABASE_URL = 'https://tevzpqfoaumgzpljimrc.supabase.co';
export const SUPABASE_ANON_KEY = 'sb_publishable_C6EM7jUC3LIFWUKqYOyP5Q_NM4Ik2pv';

export const isSupabaseConfigured = Boolean(
  SUPABASE_URL && 
  SUPABASE_ANON_KEY && 
  !SUPABASE_URL.includes('your-project')
);

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});

// Database record type definitions (JSON column stores the full rich tournament object)
export interface DbTournamentRow {
  id: string;
  title: string;
  category: string;
  city: string;
  province?: string;
  entry_fee: number;
  start_date: string;
  host_name?: string;
  is_verified?: boolean;
  is_relief?: boolean;
  data: Tournament;
  created_at?: string;
  updated_at?: string;
}

export interface DbRegistrationRow {
  id: string;
  tournament_id: string;
  team_name: string;
  contact_phone: string;
  contact_email: string;
  confirmation_code: string;
  payment_method: string;
  amount: number;
  data: Registration;
  created_at?: string;
}

// 1. Fetch all cloud tournaments
export const fetchCloudTournaments = async (): Promise<Tournament[]> => {
  try {
    const { data, error } = await supabase
      .from('tournaments')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('Supabase fetch error (table may not be created yet):', error.message);
      return [];
    }

    if (!data || data.length === 0) return [];

    return data.map((row: any) => {
      // If row has JSON 'data' payload, merge it
      if (row.data && typeof row.data === 'object') {
        return {
          ...row.data,
          id: row.id || row.data.id,
          title: row.title || row.data.title,
          category: row.category || row.data.category,
          city: row.city || row.data.city,
          entryFee: row.entry_fee ?? row.data.entryFee,
          startDate: row.start_date || row.data.startDate,
        };
      }
      // Or construct from flattened columns
      return {
        id: row.id,
        title: row.title,
        category: row.category,
        posterUrl: row.poster_url || row.banner_url || 'https://images.unsplash.com/photo-1547683905-f686c993aae5?auto=format&fit=crop&w=1200&q=80',
        startDate: row.start_date || '',
        endDate: row.end_date || row.start_date || '',
        time: row.time || 'TBD',
        location: row.venue || row.location || 'Nepal',
        city: row.city || 'Kathmandu',
        province: row.province || 'Bagmati',
        stateCountry: `${row.province || 'Bagmati'}, Nepal`,
        type: row.format || row.type || 'Open',
        entryFee: Number(row.entry_fee) || 0,
        ageGroup: row.age_group || 'Open',
        prizePool: row.prize_pool || 'Trophy & Medals',
        totalTeams: Number(row.max_participants) || 16,
        registeredTeamsCount: Number(row.current_participants) || 0,
        hostName: row.organizer || row.host_name || 'Event Host',
        hostEmail: row.contact_email || row.host_email || '',
        hostPhone: row.contact_phone || row.host_phone || '',
        description: row.description || '',
        createdAt: row.created_at || new Date().toISOString(),
      } as Tournament;
    });
  } catch (err) {
    console.error('Failed to query cloud tournaments:', err);
    return [];
  }
};

// 2. Publish a new tournament to Supabase
export const publishCloudTournament = async (tournament: Tournament): Promise<{ success: boolean; error?: string }> => {
  try {
    const row = {
      id: tournament.id,
      title: tournament.title,
      category: tournament.category,
      city: tournament.city || 'Kathmandu',
      province: tournament.province || 'Bagmati',
      entry_fee: tournament.entryFee || 0,
      start_date: tournament.startDate || '',
      host_name: tournament.hostName || '',
      is_verified: Boolean(tournament.isHostVerified),
      is_relief: Boolean(tournament.isReliefFund),
      data: tournament, // Store full tournament structure
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
    // Fetch current tournament data
    const { data } = await supabase
      .from('tournaments')
      .select('data')
      .eq('id', tournamentId)
      .single();

    if (data?.data) {
      const currentData = data.data;
      currentData.registeredTeamsCount = (currentData.registeredTeamsCount || 0) + 1;
      await supabase
        .from('tournaments')
        .update({ data: currentData })
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
      tournament_id: reg.tournamentId,
      team_name: reg.teamName,
      contact_phone: reg.contactPhone,
      contact_email: reg.contactEmail,
      confirmation_code: reg.confirmationCode,
      payment_method: reg.paymentMethod,
      amount: reg.entryFee || 0,
      data: reg,
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

// 5. Delete an event from Supabase cloud
export const deleteCloudTournament = async (tournamentId: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('tournaments')
      .delete()
      .eq('id', tournamentId);

    if (error) {
      console.warn('Failed to delete tournament from cloud:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.error('Error deleting tournament from cloud:', err);
    return false;
  }
};
