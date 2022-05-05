import { supabase } from '$lib/supabase'
import { serialize } from 'cookie'
import type { RequestEvent } from "@sveltejs/kit/types/internal"
import type { User } from '@supabase/supabase-js'

interface appUser extends User {
  account?: {
    created_at: string,
    id: string,
    customer_id: string,
    owner: string,
    product_id: string,
    subscription_id: string,
    subscription_status: string,
    updated_at: string
  }
}

export async function post(event: RequestEvent) {
  try {
    const payload = await event.request.json()
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
        let appUser: appUser
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
          appUser = user
          appUser.account = userData[0]
          if (session && session.expires_at) {
            const cookieHeader = serialize('supatoken', session.access_token, {
              domain: '',
              path: '/',
              sameSite: 'lax',
              httpOnly: true,
              expires: new Date(session.expires_at),
              maxAge: session.expires_in
            })
            return {
              status: 200,
              // Set cookies?
              headers: {
                'set-cookie': cookieHeader
              },
              body: JSON.stringify(appUser)
            };
          }
        }
      }
      else {
        throw new Error('No user found')
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
