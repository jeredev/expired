import Stripe from 'stripe'

const stripe = new Stripe(String(process.env.STRIPE_SECRET_KEY), {
  apiVersion: '2020-08-27'
})

export default stripe