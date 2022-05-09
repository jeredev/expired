import { supabase } from '$lib/supabase'
import type { RequestEvent } from "@sveltejs/kit/types/internal"

export async function post(event: RequestEvent) {
  try {
    const payload = await event.request.json()
    // console.log(payload)
    if (payload.access_token) {
      const { user, error } = await supabase.auth.api.getUser(payload.access_token)
      if (error) {
        console.error('There was a problem:', error)
        return {
          status: 400,
          body: JSON.stringify(error)
        }
      }
      if (user) {
        // console.log('apparent success')
        // // console.log(data) // {}
        // console.log(user)
        return {
          status: 200,
          body: JSON.stringify(user)
        }
      }
    }
    else {
      throw 'No token.'
    }
  }
  catch (e) {
    console.log(e)
    return { 
      status: 400,
      body: JSON.stringify(e)
    }
  }
}