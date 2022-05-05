import stripe from '$lib/stripe'
// import { supabase } from '$lib/supabase'

import type { RequestEvent } from "@sveltejs/kit/types/internal"

export async function post(event: RequestEvent) {
  try {
    // console.log('trying') // Works
    if (event.locals.user && event.locals.user.id && event.locals.user.account.id) {
      // const payload = await event.request.formData()
      // const customer = payload.get('customer')
      const payload = await event.request.json()
      // console.log(payload)
      // const customer = payload.customer
      // Look up in supabase if a user/account already exists
      // Or just signup the user in supabase?
      // const { user, session, error } = await supabase.auth.signUp({
      //   email: payload.get('email'),
      //   password: payload.get('pwd'),
      // })
      // Not sure if a new customer needs to be created or not
      // const customer = await stripe.customers.create({
      //   email: event.locals.user.email
      // })
      if (payload) {
        const customerId = payload
        const subscription = await stripe.subscriptions.create({
          customer: customerId,
          items: [{
            price: 'price_1KRkh8LQ7xMoFtsZPuDNRObl',
          }],
          payment_behavior: 'default_incomplete',
          expand: ['latest_invoice.payment_intent'],
        });
        if (subscription) {
          return {
            status: 200,
            body: JSON.stringify({
              subscriptionId: subscription.id,
              clientSecret: subscription.latest_invoice?.payment_intent.client_secret
            })
          }
        }
        else {
          throw 'No subscription'
        }
      }
      else {
        throw 'No customer'
      }
    }
    else {
      throw 'Unauthorized'
    }
  }
  catch(err) {
    console.log(err)
    return {
      status: 400,
      body: JSON.stringify(err)
    }
  }
}