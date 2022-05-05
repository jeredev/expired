import { supabase } from '$lib/supabase'
import { serialize, parse } from 'cookie'
import type { RequestEvent } from "@sveltejs/kit/types/internal"

export async function post(event: RequestEvent) {
  try {
    if (event.request.headers.get('Cookie')) {
      const cookie = event.request.headers.get('Cookie')?.toString()
      const sbToken = cookie ? parse(cookie)['supatoken'] : ''
      if (sbToken) {
        await supabase.auth.api.signOut(sbToken)
        const cookieHeader = serialize('supatoken', 'deleted', {
          domain: '',
          path: '/',
          sameSite: 'lax',
          httpOnly: true,
          maxAge: 0
        })
        // await supabase.auth.api.signOut(sbToken)
        return {
          status: 200,
          headers: {
            'set-cookie': cookieHeader
          },
        };
      }
      else {
        return {
          status: 400,
          body: {
            message: 'No auth token.'
          }
        }
      }
    }
    else {
      throw new Error('No cookie.')
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
