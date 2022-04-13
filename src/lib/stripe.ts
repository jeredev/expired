import Stripe from 'stripe'

const stripe = new Stripe(String(import.meta.env.VITE_STRIPE_SECRET_KEY), {
  apiVersion: '2020-08-27'
})

export default stripe