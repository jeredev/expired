import { supabase } from '$lib/supabase'
import stripe from '$lib/stripe'
import type Stripe from 'stripe'
import type { RequestEvent } from "@sveltejs/kit/types/internal"

const ENDPOINT_SECRET = String(process.env.STRIPE_WEBHOOK_SIGNING_SECRET) // Works

export async function post(event: RequestEvent) {
  const body = await event.request.text()
  const sig = event.request.headers.get('stripe-signature') || ''
  let stripeEvent: Stripe.Event
  try {
    stripeEvent = stripe.webhooks.constructEvent(body, sig, ENDPOINT_SECRET)
  }
  catch (err) {
    return {
      status: 500,
      headers: {},
      body: JSON.stringify({
        error: err
      })
    };
  }

  // stripe listen --forward-to https://localhost:3000/api/stripe/webhook --skip-verify

  // Handle the event
  switch (stripeEvent.type) {
    // ... handle other event types
    case 'customer.subscription.created': // Step 9
      console.log('customer.subscription.created')
      // Verify the subscription status. If it is active then your user has paid for your product.
      // console.log(stripeEvent.data.object['status']) // 'active'
      // Check the product the customer subscribed to and grant access to your service.
      // Store the product.id, subscription.id and subscription.status in your database along with the customer.id you already saved.
      break;
    case 'customer.subscription.updated':
      console.log('customer.subscription.updated')
      // Verify the subscription status. If it is active then your user has paid for your product.
      // console.log(stripeEvent.data.object)
      // Check the product the customer subscribed to and grant access to your service.
      // if (stripeEvent.data.object['status'] === 'active' && stripeEvent.data.object['plan']['id'] === 'price_1KRkh8LQ7xMoFtsZPuDNRObl') {
      if (stripeEvent.data.object['status'] === 'active') {
        // Store the product.id, subscription.id and subscription.status in your database along with the customer.id you already saved.
        await supabase
          .from('accounts')
          .update({ 
            product_id: `${stripeEvent.data.object['plan']['product']}`,
            subscription_id: `${stripeEvent.data.object['id']}`,
            subscription_status: `${stripeEvent.data.object['status']}`
          })
          .match({ customer_id: `${stripeEvent.data.object['customer']}` })
      }
      break;
    case 'customer.subscription.deleted':
      console.log('customer.subscription.deleted')
      console.log(stripeEvent.data.object)
      // Update your database to remove the Stripe subscription ID you previously stored, and limit access to your service.
      // const { data, error } = await supabase
      await supabase
        .from('accounts')
        .update({ 
          product_id: `${stripeEvent.data.object['plan']['product']}`,
          subscription_id: null,
          subscription_status: `${stripeEvent.data.object['status']}`
        })
        .match({ customer_id: `${stripeEvent.data.object['customer']}` })
      break;
    case 'invoice.payment_succeeded':
      // Set the default payment method (step #8 of https://stripe.com/docs/billing/subscriptions/build-subscriptions?ui=elements)
      if (stripeEvent.data.object['billing_reason'] == 'subscription_create') {
        const subscription_id = stripeEvent.data.object['subscription']
        const payment_intent_id = stripeEvent.data.object['payment_intent']
      
        // Retrieve the payment intent used to pay the subscription
        const payment_intent = await stripe.paymentIntents.retrieve(payment_intent_id);
        if (payment_intent && payment_intent.payment_method) {
          await stripe.subscriptions.update(
            subscription_id,
            {
              default_payment_method: payment_intent.payment_method,
            },
          );
        }
      };
      break;
    default:
      console.log(`Default: Unhandled event type ${stripeEvent.type}`);
  }
}
