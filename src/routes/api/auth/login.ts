import { supabase } from '$lib/supabase'
import { serialize, parse } from 'cookie'

export async function post({ request }) {

  const payload = await request.json()

  if (payload.email && payload.password) {
    // console.log(`full payload: ${payload.email} ${payload.password}`) // Works!
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
      // console.log('user found:')
      // console.log(user)
      // console.log('session found:')
      // console.log(session)
      // supabase.auth.setAuth(session.access_token)
      const cookieHeader = serialize('supatoken', session.access_token, {
        domain: '',
        path: '/',
        sameSite: 'lax',
        httpOnly: true,
        expires: new Date(session.expires_at),
        maxAge: session.expires_in
      })
      supabase.auth.setAuth(session.access_token)
      return {
        status: 200,
        // Set cookies?
        headers: {
          'set-cookie': cookieHeader
        },
        body: JSON.stringify(user)
      };
      // return {
      //   status: 200,
      //   body: JSON.stringify(user)
      // }
    }
  }

  // console.log('login hit')

  // const data = await request.formData();
  // console.log(data)

  // const [errors, item] = await db.create(request);
 
  // if (errors) {
  //   // return validation errors
  //   return {
  //     status: 400,
  //     body: { errors }
  //   };
  // }
 
  // return {
  //   status: 200,
  //   // headers: {
  //   //   location: `/items/${item.id}`
  //   // }
  // };
}