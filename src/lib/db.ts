import { createClient } from '@supabase/supabase-js'
// import { Session, Provider } from '@supabase/gotrue-js/dist/main/lib/types'

export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
)
