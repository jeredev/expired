import { supabase } from '$lib/supabase'
import { serialize, parse } from 'cookie'

export async function post({ request }) {
  try {
    const sbToken = request.headers.get('Cookie') ? parse(request.headers.get('Cookie'))['supatoken'] : ''
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
        // redirect: '/'
        // body: null
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
  catch (e) {
    console.log(e)
    return { 
      status: 400,
      body: JSON.stringify(e)
    }
  }
}
