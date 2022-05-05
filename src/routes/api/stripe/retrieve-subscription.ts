import type { RequestEvent } from "@sveltejs/kit/types/internal"

import stripe from '$lib/stripe'

export async function post(event: RequestEvent) {
  try {
    const subscriptionId = await event.request.json()
    const subscription = await stripe.subscriptions.retrieve(subscriptionId)
    return {
      status: 200,
      body: JSON.stringify(subscription)
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