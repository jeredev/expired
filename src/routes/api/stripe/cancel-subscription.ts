import type { RequestEvent } from "@sveltejs/kit/types/internal"

import stripe from '$lib/stripe'

// const stripe = new Stripe('sk_test_51KRkeiLQ7xMoFtsZjqP7VJG0oW7hl8Lyb8NcOH1mFERqpNWWchOORNGY5BLGOmk8dC8iUmY7SCrh0LdnLjVuQaz700PQBweYDm', {
//   apiVersion: '2020-08-27'
// })

export async function post(event: RequestEvent) {
  try {
    const deletedSubscription = await stripe.subscriptions.del(
      // event.request.body.get()
      req.body.subscriptionId
    );
    return {
      status: 200,
      body: JSON.stringify(deletedSubscription)
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