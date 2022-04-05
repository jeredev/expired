import type { Handle } from '@sveltejs/kit'
import type { RequestEvent } from "@sveltejs/kit/types/internal"
import { parse } from 'cookie'
import { supabase } from '$lib/supabase'

// Upcoming :: sveltekit-kratos
// import type { Session } from '@ory/kratos-client';

export const handle: Handle = async ({ event, resolve }: { event: RequestEvent, resolve: (request: RequestEvent) => Promise<Response> }) => {
  // console.log('handle')
  // console.log(event.request.headers)
  const sbToken = event.request.headers.get('Cookie') ? parse(event.request.headers.get('Cookie'))['supatoken'] : ''
  if (sbToken) {
    // https://supabase.com/docs/reference/javascript/auth-api-getuser
    const { user, error } = await supabase.auth.api.getUser(sbToken)
    if (error) {
      // Handle error here
      throw error
    }
    if (user) {
      // Link the user to their account
      supabase.auth.setAuth(sbToken)
      const { data: accountData, error: accountError } = await supabase
        .from('accounts')
        .select()
        .eq('owner', user.id)
      if (accountError) {
        throw accountError
      }
      if (accountData) {
        user.account = accountData[0]
      }   
      event.locals.user = user
    }
    else {
      event.locals.user = undefined
    }
  }
  else {
    event.locals.user = undefined
  }

  const response = await resolve(event);

  // Handle Auth Change events
  // if (event.request.method === 'POST' && new URL(event.request.url).pathname === API_AUTH) {
  //   const { event: authChangeEvent, session } = JSON.parse(await event.request.text()) as { event: AuthChangeEvent, session: AuthSession }

  //   if (authChangeEvent === 'SIGNED_IN') {
  //     const cookieHeader = serialize(COOKIE_NAME, session.access_token, {
  //       ...COOKIE_OPTIONS,
  //       expires: new Date(session.expires_at),
  //       maxAge: session.expires_in
  //     })
  //     // https://supabase.com/docs/reference/javascript/auth-setauth
  //     auth.setAuth(session.access_token)
  //     response.headers.append('Set-Cookie', cookieHeader)
  //   } else if (authChangeEvent === 'SIGNED_OUT') {
  //     const cookieHeader = serialize(COOKIE_NAME, 'deleted', { ...COOKIE_OPTIONS, maxAge: 0 })
  //     // https://supabase.com/docs/reference/javascript/auth-signout
  //     await auth.api.signOut(sbToken)
  //     response.headers.append('Set-Cookie', cookieHeader)
  //   }
  //   return response
  // }

  return response
}


// Upcoming
// export const getSession: GetSession = (request) => ({
// 	user: request.locals.session && {
// 		id: request.locals.session.identity.id,
// 		email: request.locals.session?.identity?.traits.email,
// 		verified: request.locals.session?.identity?.verifiable_addresses[0].verified || false
// 	}
// });

export const getSession = ({ locals }) => {
  // console.log('getSession')
  const { user } = locals
  console.log(user)
  // only include the properties that are needed client-side — exclude anything else attached to the user like access tokens etc
  // we know that the `user` object won't have anything sensitive so we're making the entire `user` object available
  // Note: `getSession` runs only when SvelteKit server-renders a page, not for the API handlers.
  return {
    user
  };
  
  // return {
  //   user: locals.user && {
  //     name: locals.user.name,
  //     avatar: locals.user.avatar
  //   }
  // };
  
}