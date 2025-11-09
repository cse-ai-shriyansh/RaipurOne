import { isSupabaseConfigured, supabase, TABLES } from './supabase';

/**
 * userService
 * Simple helpers to create/read/update user profile data in Supabase
 */

const getProfileByEmail = async (email) => {
  if (!isSupabaseConfigured) return null;
  try {
    const { data, error } = await supabase
      .from(TABLES.USERS)
      .select('*')
      .eq('email', email)
      .single();

    if (error) {
      console.error('Error fetching profile:', error);
      console.error('Error details:', JSON.stringify(error, null, 2));
      
      // Check if table doesn't exist or column is missing
      const errorMsg = error.message || '';
      if (errorMsg.includes('does not exist') || errorMsg.includes('relation')) {
        console.error('⚠️ Table "users" does not exist. Run SETUP_USERS_TABLE.sql in Supabase SQL Editor');
      } else if (errorMsg.includes('column') && errorMsg.includes('email')) {
        console.error('⚠️ Column "email" missing in users table. Run SETUP_USERS_TABLE.sql');
      }
      
      return null;
    }
    return data;
  } catch (err) {
    console.error('Exception fetching profile:', err);
    return null;
  }
};

const upsertProfile = async (profile) => {
  if (!isSupabaseConfigured) return { success: false, error: 'Supabase not configured' };
  try {
    // Use upsert; ensure your users table has a unique constraint on email
    const { data, error } = await supabase
      .from(TABLES.USERS)
      .upsert(profile, { onConflict: 'email' });

    if (error) {
      console.error('Error upserting profile:', error);
      console.error('Error details:', JSON.stringify(error, null, 2));
      
      const errorMsg = error.message || '';
      if (errorMsg.includes('does not exist') || errorMsg.includes('relation')) {
        return { 
          success: false, 
          error: error,
          message: 'Table "users" does not exist. Run SETUP_USERS_TABLE.sql in Supabase SQL Editor'
        };
      } else if (errorMsg.includes('column')) {
        return {
          success: false,
          error: error,
          message: `Column missing in users table: ${errorMsg}. Run SETUP_USERS_TABLE.sql`
        };
      }
      
      return { success: false, error, message: errorMsg };
    }

    return { success: true, data };
  } catch (err) {
    console.error('Exception upserting profile:', err);
    return { success: false, error: err, message: err.message };
  }
};

export default {
  getProfileByEmail,
  upsertProfile,
};
