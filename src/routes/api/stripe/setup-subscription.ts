import stripe from '$lib/stripe'
import { supabase } from '$lib/supabase'

export async function post({ request }) {
  const payload = await request.formData()
  if (payload.get('email')) {
    // Look up in supabase if a user/account already exists
    // Or just signup the user in supabase?
    const { user, session, error } = await supabase.auth.signUp({
      email: payload.get('email'),
      password: payload.get('pwd'),
    })
    if (user) {
      const customer = await stripe.customers.create({
        email: user.email
      })
      if (customer) {
        const customerId = customer.id
        const subscription = await stripe.subscriptions.create({
          customer: customerId,
          items: [{
            price: 'price_1KRkh8LQ7xMoFtsZPuDNRObl',
          }],
          payment_behavior: 'default_incomplete',
          expand: ['latest_invoice.payment_intent'],
        });
        if (subscription) {
          // Create account and make the user.id the owner. Update customer_id, subscription_id, (more?)
          const { data, error: accountError } = await supabase
            .from('accounts')
            .insert([{ 
              owner: user.id,
              customer_id: customerId
            }])
          if (accountError) {
            return
          }
          if (data) {
            return {
              status: 200,
              body: JSON.stringify({
                subscriptionId: subscription.id,
                clientSecret: subscription.latest_invoice.payment_intent.client_secret
              })
            }
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
    if (error) {
      // console.log('error:') // { message: 'User already registered', status: 400 }
      // console.log(error)
      return {
        status: error.status,
        body: JSON.stringify(error)
      }
    }
  }
  else {
    throw 'No email address detected.'
  }
}