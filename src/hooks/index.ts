import type { Handle, GetSession, RequestEvent } from '@sveltejs/kit'
import type { AuthChangeEvent, AuthSession } from '@supabase/supabase-js'
import { serialize, parse } from 'cookie'
import { API_AUTH, COOKIE_NAME, COOKIE_OPTIONS } from '$lib/constants'
import { auth, supabase } from '$lib/supabase'

export const handle: Handle = async ({ event, resolve }: { event: RequestEvent, resolve: (request: RequestEvent) => Promise<Response> }) => {
  // console.log('handle hit!')
  const sbToken = event.request.headers.get('Cookie') ? parse(event.request.headers.get('Cookie'))[COOKIE_NAME] : ''
  if (sbToken) {
    const { user, error } = await auth.api.getUser(sbToken)
    if (error) {
      // Handle error here
    }
    if (user) {
      // event.locals.user = user
      const { data, error } = await supabase
        .from('accounts')
        .select()
        .eq('owner', user.id)
      if (data) {
        // console.log(`data from account below: (looking up ${user.id})`)
        // console.log(data)
        user.account = data[0]
        // console.log(event.locals.user) // Works but doesn't seem to have any effect on $session
      }
      if (error) {
        console.error('Error:', error)
        // return
      }
      // console.log(user) // Same and working
      event.locals.user = user
      // console.log(event.locals.user) // Same and working
    }
  }

  const response = await resolve(event);

  if (event.request.method === 'POST' && new URL(event.request.url).pathname === API_AUTH) {
    const { event: authChangeEvent, session } = JSON.parse(await event.request.text()) as { event: AuthChangeEvent, session: AuthSession }

    if (authChangeEvent === 'SIGNED_IN') {
      const cookieHeader = await serialize(COOKIE_NAME, session.access_token, {
        ...COOKIE_OPTIONS,
        expires: new Date(session.expires_at),
        maxAge: session.expires_in
      })
      auth.setAuth(session.access_token)
      response.headers.append('Set-Cookie', cookieHeader)
    } else if (authChangeEvent === 'SIGNED_OUT') {
      const cookieHeader = await serialize(COOKIE_NAME, 'deleted', { ...COOKIE_OPTIONS, maxAge: 0 })
      await auth.api.signOut(sbToken)
      response.headers.append('Set-Cookie', cookieHeader)
    }
    return response
  }

  return response
}
/*
export async function handle({ event, resolve }: { event: RequestEvent, resolve: (request: RequestEvent) => Promise<Response> }) {
  const sbToken = event.request.headers.get('Cookie') ? parse(event.request.headers.get('Cookie'))[COOKIE_NAME] : ''
  if (sbToken) {
    const { user, error } = await auth.api.getUser(sbToken)
    if (error) {
      // Handle error here
    }
    event.locals.user = user
  }

  const response = await resolve(event);

  if (event.request.method === 'POST' && new URL(event.request.url).pathname === API_AUTH) {
    const { event: authChangeEvent, session } = JSON.parse(await event.request.text()) as { event: AuthChangeEvent, session: AuthSession }

    if (authChangeEvent === 'SIGNED_IN') {
      const cookieHeader = await serialize(COOKIE_NAME, session.access_token, {
        ...COOKIE_OPTIONS,
        expires: new Date(session.expires_at),
        maxAge: session.expires_in
      })
      await auth.setAuth(session.access_token)
      response.headers.append('Set-Cookie', cookieHeader)
    } else if (authChangeEvent === 'SIGNED_OUT') {
      const cookieHeader = await serialize(COOKIE_NAME, 'deleted', { ...COOKIE_OPTIONS, maxAge: 0 })
      await auth.api.signOut(sbToken)
      response.headers.append('Set-Cookie', cookieHeader)
    }
    return response
  }

  return response
}
*/

export const getSession: GetSession = ({ locals }) => {
  // console.log('getSession')
  // console.log(locals)
  const { user } = locals
  // only include the properties that are needed client-side — exclude anything else attached to the user like access tokens etc
  // we know that the `user` object won't have anything sensitive so we're making the entire `user` object available
  // Note: `getSession` runs only when SvelteKit server-renders a page, not for the API handlers.
  return {
    user
  };
}
/*
export async function getSession(event: RequestEvent) {
  const { user } = event.locals
  // only include the properties that are needed client-side — exclude anything else attached to the user like access tokens etc
  // we know that the `user` object won't have anything sensitive so we're making the entire `user` object available
  // Note: `getSession` runs only when SvelteKit server-renders a page, not for the API handlers.
  return {
    user
  };
}
*/