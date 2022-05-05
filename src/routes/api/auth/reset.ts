import { supabase } from '$lib/supabase'
import type { RequestEvent } from "@sveltejs/kit/types/internal"

export async function patch(event: RequestEvent) {
  try {
    const payload = await event.request.formData()
    if (payload.get('access_token') && payload.get('pwd')) {
      const access_token = payload.get('access_token')?.toString()
      const pwd = payload.get('pwd')?.toString()
      if (access_token && pwd && pwd.length >= 6) {
        // Reset password via account/user update
        const { data: user, error } = await supabase.auth.api.updateUser(
          access_token,
          { password: pwd }
        )
        if (error) {
          console.error('There was a problem with updateUser():', error)
          return { 
            status: 400,
            body: JSON.stringify(error)
          }
        }
        if (user) {
          // console.log('success')
          // console.log(user)
          return {
            status: 200,
            body: null
          }
        }
      }
      else {
        return {
          status: 400,
          body: JSON.stringify({
            message: 'Missing credentials.'
          })
        }
      }
      return {
        status: 200,
        body: null
      }
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