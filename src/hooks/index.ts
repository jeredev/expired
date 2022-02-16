import type { RequestEvent } from '@sveltejs/kit'
import type { AuthChangeEvent, AuthSession } from '@supabase/supabase-js'
import { serialize, parse } from 'cookie'
import { API_AUTH, RESP_USER_GUEST, COOKIE_NAME, COOKIE_OPTIONS } from '$lib/constants'
import { auth } from '$lib/supabase'
import type { Handle, GetSession } from '@sveltejs/kit';
// import { session } from "$app/stores"

/** @type {import('@sveltejs/kit').Handle} */
// https://kit.svelte.dev/docs/hooks#handle

export const handle: Handle = async ({ event, resolve }: { event: RequestEvent, resolve: (request: RequestEvent) => Promise<Response> }) => {
  // console.log('handle running')
  // console.log(event.params)
  const sbToken = event.request.headers.get('Cookie') ? parse(event.request.headers.get('Cookie'))[COOKIE_NAME] : ''
  if (sbToken) {
    const { user, error } = await auth.api.getUser(sbToken)
    if (error) {
      // event.locals.user = RESP_USER_GUEST
    }
    if (user && !auth.session()) {
      // console.log('no session for user!')
      // Is this good for security?
      const { user, error } = auth.setAuth(sbToken)
    }
    event.locals.user = user
  } else {
    // console.log('else of sbToken')
    // event.locals.user = {
    //   guest: true
    // }
    // event.locals.user = undefined
    // event.locals.user = RESP_USER_GUEST
  }

  const response = await resolve(event);

  if (event.request.method === 'POST' && new URL(event.request.url).pathname === API_AUTH) {
    const { event: authChangeEvent, session } = JSON.parse(await event.request.text()) as { event: AuthChangeEvent, session: AuthSession }

    if (authChangeEvent === 'SIGNED_IN' && session) {
      // console.log('SESSION!!!')
      const cookieHeader = await serialize(COOKIE_NAME, session.access_token, {
        ...COOKIE_OPTIONS,
        expires: new Date(session.expires_at),
        maxAge: session.expires_in
      })
      await auth.setAuth(session.access_token)
      response.headers.append('Set-Cookie', cookieHeader)
    } 
    else if (authChangeEvent === 'SIGNED_IN' && !session) {
      // Why does this exist?
      // console.log('NO SESSION!!!')
    }
    else if (authChangeEvent === 'SIGNED_OUT') {
      const cookieHeader = await serialize(COOKIE_NAME, 'deleted', { ...COOKIE_OPTIONS, maxAge: 0 })
      await auth.api.signOut(sbToken)
      response.headers.append('Set-Cookie', cookieHeader)
    }
    return response
  }

  return response
}

/** @type {import('@sveltejs/kit').GetSession} */
// https://kit.svelte.dev/docs/hooks#getsession
export const getSession: GetSession = async (event: RequestEvent) => {
  // console.log('getSession()')
  // console.log(event.locals)
  const { user } = event.locals
  // only include the properties that are needed client-side — exclude anything else attached to the user like access tokens etc
  // we know that the `user` object won't have anything sensitive so we're making the entire `user` object available
  // Note: `getSession` runs only when SvelteKit server-renders a page, not for the API handlers.
  // if (user) {
  //   console.log('YES user detected')
  // }
  // else {
  //   console.log('NO user detected')
  // }
  return {
    user
  };
}