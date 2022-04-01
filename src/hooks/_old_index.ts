import type { Handle } from '@sveltejs/kit'
import type { RequestEvent } from "@sveltejs/kit/types/internal"
import type { AuthChangeEvent, AuthSession } from '@supabase/supabase-js'
import { serialize, parse } from 'cookie'
import { API_AUTH, COOKIE_NAME, COOKIE_OPTIONS } from '$lib/constants'
import { auth, supabase } from '$lib/supabase'

// Upcoming :: sveltekit-kratos
// import type { Session } from '@ory/kratos-client';

// Upcoming
// import { authApi } from '$lib/auth'
// import { config } from '$lib/constants'
// import type { GetSession, Handle } from '@sveltejs/kit/types/internal';

// export const handle: Handle = async ({ request, resolve }) => {
// 	try {
// 		const { status, data } = await authApi.toSession(undefined, 'session', {
// 			headers: {
// 				Authorization: `${request.headers.authorization}`,
// 				Cookie: `${request.headers.cookie}`,
// 				Origin: config.auth.publicUrl
// 			},
// 			credentials: 'include'
// 		});

// 		if (status === 401) {
// 			request.locals.session = undefined;
// 			return await resolve(request);
// 		}

// 		request.locals.session = data;

// 		const response = await resolve(request);

// 		return {
// 			...response,
// 			headers: {
// 				...response.headers
// 			}
// 		};
// 	} catch (error) {
// 		return await resolve(request);
// 	}
// };


export const handle: Handle = async ({ event, resolve }: { event: RequestEvent, resolve: (request: RequestEvent) => Promise<Response> }) => {
  const sbToken = event.request.headers.get('Cookie') ? parse(event.request.headers.get('Cookie'))[COOKIE_NAME] : ''
  if (sbToken) {
    // https://supabase.com/docs/reference/javascript/auth-api-getuser
    const { user, error } = await auth.api.getUser(sbToken)
    if (error) {
      // Handle error here
    }
    if (user) {
      // Link the user to their account
      const { data, error } = await supabase
        .from('accounts')
        .select()
        .eq('owner', user.id)
      if (data) {
        user.account = data[0]
      }
      if (error) {
        console.error('Error:', error)
      }
      event.locals.user = user
    }
  }

  const response = await resolve(event);

  // Handle Auth Change events
  if (event.request.method === 'POST' && new URL(event.request.url).pathname === API_AUTH) {
    const { event: authChangeEvent, session } = JSON.parse(await event.request.text()) as { event: AuthChangeEvent, session: AuthSession }

    if (authChangeEvent === 'SIGNED_IN') {
      const cookieHeader = serialize(COOKIE_NAME, session.access_token, {
        ...COOKIE_OPTIONS,
        expires: new Date(session.expires_at),
        maxAge: session.expires_in
      })
      // https://supabase.com/docs/reference/javascript/auth-setauth
      auth.setAuth(session.access_token)
      response.headers.append('Set-Cookie', cookieHeader)
    } else if (authChangeEvent === 'SIGNED_OUT') {
      const cookieHeader = serialize(COOKIE_NAME, 'deleted', { ...COOKIE_OPTIONS, maxAge: 0 })
      // https://supabase.com/docs/reference/javascript/auth-signout
      await auth.api.signOut(sbToken)
      response.headers.append('Set-Cookie', cookieHeader)
    }
    return response
  }

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

// export const getSession = ({ locals }) => locals.session

export const getSession = ({ locals }) => {
  const { user } = locals
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