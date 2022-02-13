import { createClient } from '@supabase/supabase-js'

// type SupaTable = 'profiles'
// type SupaStorageBucket = 'avatars'

export const supabase = createClient(
  String(import.meta.env.VITE_SUPABASE_URL),
  String(import.meta.env.VITE_SUPABASE_ANON_KEY)
)

/**
 * Convenience re-exports for typed selections
 *
 */
 export const auth = supabase.auth
 export const storage = supabase.storage
 /**
  *
  * @param table The Supabase table to act upon
  * @returns
  */
 export const from = (table: SupaTable) => supabase.from(table)
 /**
  *
  * @param bucket The Supabase storage bucket to act upon
  * @returns
  */
 export const fromBucket = (bucket: SupaStorageBucket) => supabase.storage.from(bucket)