import { supabase } from "$lib/supabase"
import type { RequestEvent } from "@sveltejs/kit/types/internal"

export async function patch(event: RequestEvent) {
  try {
    if (event.locals.user && event.locals.user.id) {
      const user = await event.request.formData()
      if (user.get('pwd')) {
        const { user: userData, error } = await supabase.auth.update({password: user.get('pwd')})
        if (userData) {
          return {
            status: 200,
            body: JSON.stringify(userData)
          }
        }
        if (error) {
          console.error('Error:', error)
          return {
            status: 400,
            body: JSON.stringify(error)
          }
        }
      }
      if (user.get('email')) {
        const { user: userData, error } = await supabase.auth.update({email: user.get('email')})
        if (userData) {
          return {
            status: 200,
            body: JSON.stringify(userData)
          }
        }
        if (error) {
          console.error('Error:', error)
          return {
            status: 400,
            body: JSON.stringify(error)
          }
        }
      }
    }
    else {
      throw 'No user detected'
    }
  }
  catch (e) {
    console.log(e);
    return { 
      status: 400,
      body: JSON.stringify(e)
    }
  }
}
