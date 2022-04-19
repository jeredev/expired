import { supabase } from '$lib/supabase'
import { serialize } from 'cookie'

export async function post({ request }) {
  try {
    const payload = await request.json()
    const sbToken = request.headers.get('Cookie') ? parse(request.headers.get('Cookie'))['supatoken'] : ''
    if (payload.email && payload.password) {
      const { user, session, error } = await supabase.auth.signIn({
        email: payload.email,
        password: payload.password,
      })
      if (error) {
        console.error('error:', error)
        return { 
          status: 400,
          body: JSON.stringify(error)
        }
      }
      if (user) {
        const { data: userData, error: userError } = await supabase
          .from('accounts')
          .select()
          .eq('owner', user.id)
        if (userError) {
          console.error('userError:', userError)
          return { 
            status: 400,
            body: JSON.stringify(userError)
          }
        }
        if (userData) {
          user.account = userData[0]
        }
      }
      if (session) {
        if (sbToken) {
          await supabase.auth.api.signOut(sbToken)
          const cookieHeader = serialize('supatoken', 'deleted', {
            domain: '',
            path: '/',
            sameSite: 'lax',
            httpOnly: true,
            maxAge: 0
          })
        }
        const cookieHeader = serialize('supatoken', session.access_token, {
          domain: '',
          path: '/',
          sameSite: 'lax',
          httpOnly: true,
          expires: new Date(session.expires_at),
          maxAge: session.expires_in
        })
        // supabase.auth.setAuth(session.access_token)
        return {
          status: 200,
          // Set cookies?
          headers: {
            'set-cookie': cookieHeader
          },
          body: JSON.stringify(user)
        };
      }
    }
  }
  catch(e) {
    console.error('error:', e)
    return {
      status: 200,
      body: JSON.stringify(e)
    }
  }
}
