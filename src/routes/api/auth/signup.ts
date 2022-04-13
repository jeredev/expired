import { supabase } from '$lib/supabase'
import type { RequestEvent } from "@sveltejs/kit/types/internal"

import stripe from '$lib/stripe'

// const stripe = new Stripe('sk_test_51KRkeiLQ7xMoFtsZjqP7VJG0oW7hl8Lyb8NcOH1mFERqpNWWchOORNGY5BLGOmk8dC8iUmY7SCrh0LdnLjVuQaz700PQBweYDm', {
//   apiVersion: '2020-08-27'
// })

export async function post(event: RequestEvent) {
  try {
    // console.log()
    // console.log(stripe)
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      line_items: [
        {
          price: 'price_1KRkh8LQ7xMoFtsZPuDNRObl',
          // For metered billing, do not pass quantity
          quantity: 1,
        },
      ],
      // {CHECKOUT_SESSION_ID} is a string literal; do not change it!
      // the actual Session ID is returned in the query parameter when your customer
      // is redirected to the success page.
      success_url: `https://${event.url.host}/success.html?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `https://${event.url.host}/canceled.html`,
    })
    console.log(session)
    return {
      status: 303,
      headers: {
        location: session.url
      }
    }
    /*
    const payload = await event.request.formData()
    const { user, session, error } = await supabase.auth.signUp({
      email: payload.get('email'),
      password: 'bbbnhtkm111',
    })
    if (error) {
      console.log(error)
      return {
        status: error.status,
        body: JSON.stringify(error)
      }
    }
    if (user) {
      console.log(user)
      // Do something with user
      // Setup billing with Stripe --> https://stripe.com/docs/billing/quickstart
      const priceId = 'price_1KRkh8LQ7xMoFtsZPuDNRObl'
      // Create new account
      // const session = await stripe.checkout.sessions.create({
      //   mode: 'subscription',
      //   line_items: [
      //     {
      //       price: priceId,
      //       // For metered billing, do not pass quantity
      //       quantity: 1,
      //     },
      //   ],
      //   // {CHECKOUT_SESSION_ID} is a string literal; do not change it!
      //   // the actual Session ID is returned in the query parameter when your customer
      //   // is redirected to the success page.
      //   success_url: 'https://example.com/success.html?session_id={CHECKOUT_SESSION_ID}',
      //   cancel_url: 'https://example.com/canceled.html',
      // })
    }
    if (session) {
      console.log(session)
      // Do something with session
    }
    */
  }
  catch (e) {
    console.log(e)
    return { 
      status: 400,
      body: JSON.stringify(e)
    }
  }
}