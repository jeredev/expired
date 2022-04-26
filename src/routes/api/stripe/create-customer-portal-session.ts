import type { RequestEvent } from "@sveltejs/kit/types/internal"
import stripe from '$lib/stripe'

export async function post(event: RequestEvent) {
  try {
    // Authenticate your user.
    if (event.locals.user && event.locals.user.id && event.locals.user.account.id) {
      const customer = await event.request.json()
      const portalSession = await stripe.billingPortal.sessions.create({
        customer: customer,
        return_url: `${event.url.origin}/profile`, // Destination after a user finishes business with managing in customer portal
      })
      return {
        status: 200,
        body: JSON.stringify(portalSession)
      }
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