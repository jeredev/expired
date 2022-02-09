// import { supabase, user } from "$lib/db"

export const onRequest = () => {
  return new Response(new Date().toISOString())
}
