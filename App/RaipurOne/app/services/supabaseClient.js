import { createClient } from '@supabase/supabase-js';

// Get these from your Supabase project settings
// Go to: Project Settings -> API -> Project URL and anon/public key
const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://your-project-id.supabase.co';
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'your-anon-key-here';

// Create Supabase client
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
  storage: {
    // Storage bucket configuration
    buckets: {
      complaintImages: 'complaint-images',
      cctvScreenshots: 'cctv-screenshots',
      profileImages: 'profile-images',
    },
  },
});

// Storage helper functions
export const storage = {
  // Get public URL for a file
  getPublicUrl: (bucket, path) => {
    const { data } = supabase.storage.from(bucket).getPublicUrl(path);
    return data.publicUrl;
  },

  // Upload file
  upload: async (bucket, path, file, options = {}) => {
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(path, file, {
        cacheControl: '3600',
        upsert: false,
        ...options,
      });

    if (error) throw error;
    return data;
  },

  // Delete file
  remove: async (bucket, paths) => {
    const { data, error } = await supabase.storage.from(bucket).remove(paths);
    if (error) throw error;
    return data;
  },

  // List files
  list: async (bucket, path = '', options = {}) => {
    const { data, error } = await supabase.storage.from(bucket).list(path, options);
    if (error) throw error;
    return data;
  },
};

// Export default client
export default supabase;
