import { supabase } from "$lib/supabase"
import type { RequestEvent } from "@sveltejs/kit/types/internal"

export async function patch(event: RequestEvent) {
  try {
    if (event.locals.user && event.locals.user.id) {
      const user = await event.request.formData()
      const email = user.get('email')?.toString()
      const pwd = user.get('pwd')?.toString()
      if (pwd) {
        const { user: userData, error } = await supabase.auth.update({password: pwd})
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
      if (email) {
        const { user: userData, error } = await supabase.auth.update({email: email})
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
