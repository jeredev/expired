import { supabase } from '$lib/supabase'
import type { RequestEvent } from "@sveltejs/kit/types/internal"

export async function post(event: RequestEvent) {
  try {
    const payload = await event.request.formData()
    if (payload.get('email')) {
      const { data, error } = await supabase.auth.api
        .resetPasswordForEmail(payload.get('email'))
      if (error) {
        console.error('There was a problem:', error)
        return {
          status: 400,
          body: JSON.stringify(error)
        }
      }
      if (data) {
        // console.log('apparent success')
        return {
          status: 200,
          body: null
        }
      }
    }
    else {
      console.log('else')
    }
    return {
      status: 200,
      body: null
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