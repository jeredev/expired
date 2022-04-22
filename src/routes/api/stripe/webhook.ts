import { supabase } from '$lib/supabase'
import stripe from '$lib/stripe'
import type Stripe from 'stripe'

const ENDPOINT_SECRET = String(import.meta.env.VITE_STRIPE_WEBHOOK_SIGNING_SECRET) // Works

export async function post({ request }) {
  const body = await request.text()
  const sig = request.headers.get('stripe-signature') || ''
  let stripeEvent: Stripe.Event
  try {
    stripeEvent = stripe.webhooks.constructEvent(body, sig, ENDPOINT_SECRET)
  }
  catch (err) {
    return
  }

  // Handle the event
  switch (stripeEvent.type) {
    // ... handle other event types
    case 'customer.subscription.created': // Step 9
      console.log('customer.subscription.created')
      // Verify the subscription status. If it is active then your user has paid for your product.
      // console.log(stripeEvent.data.object)
      console.log(stripeEvent.data.object['status'])
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
        const { data, error } = await supabase
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
        const subscription = await stripe.subscriptions.update(
          subscription_id,
          {
            default_payment_method: payment_intent.payment_method,
          },
        );
      };
      break;
    default:
      console.log(`Default: Unhandled event type ${stripeEvent.type}`);
  }

	// let data;
	// let eventType;
	// if (WEBHOOK_SECRET) {
	// 	let event;

	// 	// SvelteKit may sometimes modify the incoming request body
	// 	// However, Stripe requires the exact body it sends to construct an Event
	// 	// To avoid unintended SvelteKit modifications, we can use this workaround:
	// 	const payload = Buffer.from(req.rawBody);

	// 	const signature = req.headers['stripe-signature'];
	// 	try {
	// 		event = stripe.webhooks.constructEvent(payload, signature, WEBHOOK_SECRET);
	// 		data = event.data;
	// 		eventType = event.type;
	// 	} catch (err) {
	// 		return {
	// 			status: 500,
	// 			headers: {},
	// 			body: JSON.stringify({
	// 				error: err
	// 			})
	// 		};
	// 	}
	// } else {
	// 	data = req.body.data;
	// 	eventType = req.body.type;
	// }

	// switch (eventType) {
	// 	case 'checkout.session.completed':
	// 		// Payment is successful and the subscription is created.
	// 		// You should provision the subscription and save the customer ID to your database.
	// 		console.log('Event: checkout.session.completed');
	// 		break;
	// 	case 'invoice.paid':
	// 		// Continue to provision the subscription as payments continue to be made.
	// 		// Store the status in your database and check when a user accesses your service.
	// 		// This approach helps you avoid hitting rate limits.
	// 		console.log('Event: invoice.paid');
	// 		break;
	// 	case 'invoice.payment_failed':
	// 		// The payment failed or the customer does not have a valid payment method.
	// 		// The subscription becomes past_due. Notify your customer and send them to the
	// 		// customer portal to update their payment information.
	// 		console.log('Event: invoice.payment_failed');
	// 		break;
	// 	default:
	// 	// Unhandled event type
	// }

	return {
		status: 200,
		headers: {},
		body: JSON.stringify({
			message: 'Success'
		})
	};
}
