<script lang="ts">

  import { loadStripe, type Stripe } from '@stripe/stripe-js'
  import { onMount } from "svelte"

  let email: string
  let pwd: string
  let confirmPwd: string

  let form: HTMLFormElement
  let stripe: Stripe | null

  let paymentReady = false

  let statusProcessing: boolean
  let signupValid: boolean

  let messageContainer: HTMLDivElement

  let signupError: string | null = null

  const validateSignup = () => {
    if (email && pwd && /([^\s])/.test(email) && /([^\s])/.test(pwd) && /([^\s])/.test(pwd) && pwd.length >= 6 && pwd === confirmPwd) {
      signupValid = true
    }
    else {
      signupValid = false
    }
  }
  const setupStripe = async() => {
    const formData = new FormData()
    formData.append('email', email)
    formData.append('pwd', pwd)
    const res = await fetch('/api/stripe/setup-subscription', {
      method: 'POST',
      body: formData
    })
    if (!res.ok) {
      // console.log(await res.json())
      const error = await res.json()
      console.log(error)
      if (error.status === 400 && error.message === 'User already registered') {
        signupError = 'User already registered'
      }
    }
    if (res.ok) {
      const { clientSecret, userUID } = await res.json()
      if (stripe && clientSecret) {
        const elements = stripe.elements({
          clientSecret: clientSecret,
          appearance: {
            theme: 'flat', // or 'none'
            // variables: {
            //   colorPrimary: '#0570de',
            //   colorBackground: '#ffffff',
            //   colorText: '#30313d',
            //   colorDanger: '#df1b41',
            //   fontFamily: 'Ideal Sans, system-ui, sans-serif',
            //   spacingUnit: '2px',
            //   borderRadius: '4px',
            //   // See all possible variables below
            // },
            // rules: {
            //   '.Tab': {
            //     border: '1px solid #E0E6EB',
            //     boxShadow: '0px 1px 1px rgba(0, 0, 0, 0.03), 0px 3px 6px rgba(18, 42, 66, 0.02)',
            //   },

            //   '.Tab:hover': {
            //     color: 'var(--colorText)',
            //   },

            //   '.Tab--selected': {
            //     borderColor: '#E0E6EB',
            //     boxShadow: '0px 1px 1px rgba(0, 0, 0, 0.03), 0px 3px 6px rgba(18, 42, 66, 0.02), 0 0 0 2px var(--colorPrimary)',
            //   },

            //   '.Input--invalid': {
            //     boxShadow: '0 1px 1px 0 rgba(0, 0, 0, 0.07), 0 0 0 2px var(--colorDanger)',
            //   },

            //   // See all supported class names and selector syntax below
            // }
            labels: 'floating', // or 'above'
          },
        })
        const paymentElement = elements.create('payment')
        paymentElement.mount('#payment-element')
        paymentReady = true

        if (form) {
          form.addEventListener('submit', async (event) => {
            // Complete payment
            event.preventDefault();
            if (stripe) {
              const {error} = await stripe.confirmPayment({
                //`Elements` instance that was used to create the Payment Element
                elements,
                confirmParams: {
                  return_url: `http://localhost:3000/complete?uid=${userUID}`,
                }
              });

              if (error) {
                // This point will only be reached if there is an immediate error when
                // confirming the payment. Show error to your customer (for example, payment
                // details incomplete)
                // const messageContainer = document.querySelector('#error-message');
                if (error.message) {
                  messageContainer.textContent = error.message
                }
              } else {
                // Your customer will be redirected to your `return_url`. For some payment
                // methods like iDEAL, your customer will be redirected to an intermediate
                // site first to authorize the payment, then redirected to the `return_url`.
                // http://localhost:3000/complete?uid=6ff73653-d81e-44c1-bd83-30649cefc261&payment_intent=pi_3KnTkkLQ7xMoFtsZ1JenM1gm&payment_intent_client_secret=pi_3KnTkkLQ7xMoFtsZ1JenM1gm_secret_1nh3FG4MXfIJnmhQiHRbPu0Ce&redirect_status=succeeded
                // 6ff73653-d81e-44c1-bd83-30649cefc261
              }
            }
          });
        }
      }
      // resetSuccess = true
      // console.log('res.ok')
      // const response = await res.json()
    }
  }
  // const signUp = async() => {
  //   const formData = new FormData()
  //   formData.append('email', email)
  //   // formData.append('pwd', pwd)
  //   const res = await fetch('/api/auth/signup', {
  //     method: 'POST',
  //     body: formData
  //   })
  //   if (!res.ok) {
  //     // console.log(await res.json())
  //     const error = await res.json()
  //     console.log(error)
  //   }
  //   if (res.ok) {
  //     const response = await res.json()
  //     // resetSuccess = true
  //     // console.log('res.ok')
  //     // const response = await res.json()
  //   }
  // }

  validateSignup()

  onMount(async() => {
    // console.log(String(import.meta.env.VITE_STRIPE_PUBLIC_KEY)) // Undefined
    stripe = await loadStripe('pk_test_51KRkeiLQ7xMoFtsZ4kcH2EaR6fijSHMwk3RrOhBqJ29YujRfhb7PutQxU1XwBAKULC149Omq91I1KMqDKHceVfE600rKKbu7Mx')
  })
  
</script>

<div class="decay mx-auto max-w-2xl p-4 text-white">
  <!-- <h1>Your life begins now!</h1>
  <ul>
    <li>Benefits</li>
    <li>Payment plan</li>
  </ul> -->
  <div class="shell">
    <form on:submit|preventDefault={setupStripe} bind:this={form}>
      <fieldset>
        <h1>Create an account</h1>
        <div class="form-field mt-2">
          <label for="signup-email">Email address</label>
          <input type="email" id="signup-email" bind:value="{email}" on:input="{validateSignup}" class="bg-black text-white p-2 w-full">
        </div>
        <div class="form-field mt-2">
          <label for="signup-password">Password</label>
          <input
            bind:value="{pwd}"
            on:input="{validateSignup}"
            type="password"
            id="signup-password"
            required
            class="bg-black text-white p-2 w-full"
          >
        </div>
        <div class="form-field mt-2">
          <label for="signup-confirmPassword">Confirm your password</label>
          <input
            bind:value="{confirmPwd}"
            on:input="{validateSignup}"
            type="password"
            id="signup-confirmPassword"
            class="bg-black text-white mb-2 p-2 w-full"
          >
        </div>
        {#if signupError}
          <div class="signup-error my-4 p-2">
            {#if signupError === 'User already registered'}
              <p>This email address has already been registered. Please either <a href="login">sign in</a> or <a href="reset">reset your password</a>.</p>
            {/if}
          </div>
        {/if}
        {#if !paymentReady}
          <button type="submit" class="btn mt-2" disabled="{statusProcessing || !signupValid}">
            Sign Up
          </button>
        {/if}
      </fieldset>
    </form>
    
    <form id="payment-form" class="mt-4">
      <div id="payment-element">
        <!-- Elements will create form elements here -->
      </div>
      {#if paymentReady}
        <button id="submit" class="btn">Subscribe</button>
        <div id="error-message" bind:this={messageContainer}>
          <!-- Display error message to your customers here -->
        </div>
      {/if}
    </form>
  </div>
</div>

<style>
  .signup-error {
    background-color: var(--red);
    color: white;
    font-family: 'Recursive', sans-serif;
  }
  .signup-error a {
    color: inherit;
  }
  h1 {
    font-size: 2rem;
    font-weight: 800;
    margin-bottom: 2rem;
  }
  /* form h2 {
    font-size: 1.5rem;
    font-weight: 600;
    margin-bottom: 1rem;
  } */
</style>