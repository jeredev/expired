<script lang="ts">

  import { loadStripe } from '@stripe/stripe-js'
  import { onMount } from "svelte"

  let stripe

  onMount(async() => {
    // console.log(String(import.meta.env.VITE_STRIPE_PUBLIC_KEY)) // Undefined
    stripe = await loadStripe('pk_test_51KRkeiLQ7xMoFtsZ4kcH2EaR6fijSHMwk3RrOhBqJ29YujRfhb7PutQxU1XwBAKULC149Omq91I1KMqDKHceVfE600rKKbu7Mx')

    // Retrieve the "payment_intent_client_secret" query parameter appended to
    // your return_url by Stripe.js
    const clientSecret = new URLSearchParams(window.location.search).get(
      'payment_intent_client_secret'
    );

    // Retrieve the PaymentIntent
    stripe.retrievePaymentIntent(clientSecret).then(({paymentIntent}) => {
      const message = document.querySelector('#message')

      // Inspect the PaymentIntent `status` to indicate the status of the payment
      // to your customer.
      //
      // Some payment methods will [immediately succeed or fail][0] upon
      // confirmation, while others will first enter a `processing` state.
      //
      // [0]: https://stripe.com/docs/payments/payment-methods#payment-notification
      switch (paymentIntent.status) {
        case 'succeeded':
          message.innerText = 'Success! Payment received.';
          break;

        case 'processing':
          message.innerText = "Payment processing. We'll update you when payment is received.";
          break;

        case 'requires_payment_method':
          message.innerText = 'Payment failed. Please try another payment method.';
          // Redirect your user back to your payment page to attempt collecting
          // payment again
          break;

        default:
          message.innerText = 'Something went wrong.';
          break;
      }
    });
  })
  
  //http://localhost:3000/complete?payment_intent=pi_3KnROzLQ7xMoFtsZ1zBdvFot&payment_intent_client_secret=pi_3KnROzLQ7xMoFtsZ1zBdvFot_secret_shnyUZe5IUq8cUHg4GB9hD0lZ&redirect_status=succeeded

</script>

<div class="decay mx-auto max-w-50rem p-4 text-white">
  <h1>Ascension Complete!</h1>
  <div id="message">

  </div>
</div>