<script lang="ts" context="module">
  import type { Load } from "@sveltejs/kit"
  export const load: Load = async({ url, params, fetch, session, stuff, status, error }) => {
    const { user } = session
    if (user && user.id) {
      if (user.account?.subscription_id && user.account?.subscription_status === 'active') {
        const subscriptionQuery = await fetch('/api/stripe/retrieve-subscription', {
          method: 'POST',
          body: JSON.stringify(user.account.subscription_id)
        })
        if (subscriptionQuery.ok) {
          const subscription = await subscriptionQuery.json()
          return {
            status: 200,
            props: {
              subscription,
              user
            }
          }
        }
        // else {

        // }
      }
      return {
        status: 200,
        props: {
          user
        }
      }
    }
    else {
      return {
        status: 200,
        props: {
          user
        }
      }
    }
  }
</script>
<script lang="ts">
  import { loadStripe, type Stripe } from '@stripe/stripe-js'
  import type { Stripe as StripeNode } from 'stripe'
  import { onMount } from "svelte"
  import Icon from '@iconify/svelte'
  import { goto } from '$app/navigation'
  import { session } from "$app/stores"

  export let subscription: StripeNode.Subscription
  export let user: App.Session['user']

  let messageContainer: HTMLDivElement
  let paymentForm: HTMLFormElement
  let stripe: Stripe | null

  let paymentReady = false

  let pwd: string
  let confirmPwd: string

  let statusProcessing = false
  let resetPwdValid = false

  let resetSuccess = false

  const validatePwd = () => {
    if (/([^\s])/.test(pwd) && /([^\s])/.test(pwd) && pwd.length >= 6 && pwd === confirmPwd) {
      resetPwdValid = true
    }
    else {
      resetPwdValid = false
    }
  }
  const changePwd = async() => {
    const formData = new FormData()
    // formData.append('access_token', access_token)
    formData.append('pwd', pwd)
    const res = await fetch('/api/user', {
      method: 'PATCH',
      body: formData
    })
    if (!res.ok) {
      console.log(await res.json())
    }
    if (res.ok) {
      resetSuccess = true
      // console.log(await res.json())
    }
  }

  const logOut = async () => {
    statusProcessing = true
    try {
      const res = await fetch('/api/auth/logout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      })
      if (!res.ok) {
        const error = await res.json()
      }
      if (res.ok) {
        session.set({ user: null }),
        goto('/')
      }
    }
    catch(e) {
      console.log(e)
    }
    statusProcessing = false
  }

  const manageSub = async () => {
    try {
      const res = await fetch('/api/stripe/create-customer-portal-session', {
        method: 'POST',
        body: JSON.stringify(subscription.customer),
        redirect: 'follow'
      })
      if (!res.ok) {
        const error = await res.json()
      }
      if (res.ok) {
        const portalSession = await res.json()
        if (portalSession.url) {
          goto(portalSession.url)
          // res.redirect(portalSession.url)
        }
        // items = null // Still doesn't work
      }
    }
    catch(e) {
      console.log(e)
    }
  }

  const renewSub = async () => {
    try {
      const res = await fetch('/api/stripe/new-subscription', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(user.account.customer_id)
      })
      if (!res.ok) {
        console.log('!res.ok')
        const error = await res.json()
        console.log(error)
      }
      if (res.ok) {
        console.log('res.ok')
        // console.log(await res.json())
        const { clientSecret, userUID } = await res.json()
        console.log(clientSecret)
        if (stripe && clientSecret) {
          // console.log('if:')
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

          paymentForm.addEventListener('submit', async (event) => {

            if (stripe) {
              // Complete payment
              event.preventDefault();

              const {error} = await stripe.confirmPayment({
                //`Elements` instance that was used to create the Payment Element
                elements,
                confirmParams: {
                  return_url: `https://localhost:3000/complete?uid=${userUID}`,
                }
              });

              if (error) {
                // This point will only be reached if there is an immediate error when
                // confirming the payment. Show error to your customer (for example, payment
                // details incomplete)
                // Do I need to do anything with error itself?
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
    }
    catch(e) {
      console.log(e)
    }
  }

  function goBack() {
    history.back()
  }

  function getDate(time: number) {
    const date = new Date(time * 1000)
    return date.toString()
  }

  onMount(async() => {
    // console.log(String(import.meta.env.VITE_STRIPE_PUBLIC_KEY)) // Undefined
    stripe = await loadStripe('pk_test_51KRkeiLQ7xMoFtsZ4kcH2EaR6fijSHMwk3RrOhBqJ29YujRfhb7PutQxU1XwBAKULC149Omq91I1KMqDKHceVfE600rKKbu7Mx')
  })
</script>

<div class="decay mx-auto max-w-4xl p-4 text-white">
  {#if user && user.account}
    <div class="controls pb-4 flex justify-between">
      <button class="btn" on:click="{goBack}">
        <Icon icon="clarity:arrow-line" style="display: inline; transform: rotate(-90deg);" />
      </button>
      <button on:click={logOut} class="btn ml-2" disabled="{statusProcessing}">
        <Icon icon="clarity:logout-solid" />
      </button>
    </div>
  {/if}
  <h1 style="font-size: 2.5rem; font-weight: 900;">Profile</h1>
  <div class="grouping my-8 p-4 border-width-$1px border-light-400" style="font-size: 0.875rem;">
    <h2 class="mb-6" style="font-size: 1.4rem; font-weight: 600;">Change password</h2>
    {#if resetSuccess}
      Password successfully reset!
    {:else}
      <form action="on:submit|preventDefault={changePwd}">
        <fieldset>
          <form on:submit|preventDefault={changePwd} class="form form--login">
            <div class="login-form-fields">
              <div class="form-field">
                <label for="password" style="font-weight: 400;">New password</label>
                <input
                  bind:value="{pwd}"
                  on:input="{validatePwd}"
                  type="password"
                  id="password"
                  required
                  class="bg-black text-white p-2 w-full"
                >
              </div>
              <div class="form-field mt-2">
                <label for="confirmPassword">Confirm your password</label>
                <input
                  bind:value="{confirmPwd}"
                  on:input="{validatePwd}"
                  type="password"
                  id="confirmPassword"
                  class="bg-black text-white mb-4 p-2 w-full"
                >
              </div>
              <button type="block mt-4 submit" class="btn" disabled="{statusProcessing || !resetPwdValid}">
                Continue
              </button>
            </div>
          </form>
        </fieldset>
      </form>
    {/if}
  </div>
  <div class="grouping mb-8 p-4 border-width-$1px border-light-400" style="font-size: 0.875rem;">
    <h2 class="mb-6" style="font-size: 1.4rem; font-weight: 600;">Subscription</h2>
    {#if subscription}
      <p>Status: {subscription.status} </p>
      {#if subscription.status === 'active'}
        <p>Current Period Start: { getDate(subscription.current_period_start) }</p>
        <p>Current Period End: { getDate(subscription.current_period_end) }</p>
      {/if}
      {#if subscription.cancel_at_period_end}
        <p class="my-2">Your subscription will automatically renew at the current period end.</p>
      {/if}
      {#if subscription.cancel_at_period_end}
        <p class="my-2">Your subscription will expire at the current period end. To renew, use the Manage Subscription button below.</p>
      {/if}
      {#if subscription.status === 'canceled'}
        <p class="my-2">Wish to reactivate your subscription? Use the Renew button below.</p>
        <button class="btn">Renew Subscription</button>
      {/if}
      {#if subscription.status !== 'canceled'}
        <div class="my-4">
          <button class="btn" on:click="{manageSub}">Manage Subscription</button>
        </div>
      {/if}
    {:else}
      <p>Wish to purchase a subscription? Use the Renew button below.</p>
      <button class="btn block mt-4" on:click="{renewSub}">Renew Subscription</button>
      <form id="payment-form" class="mt-4" bind:this="{paymentForm}">
        <div id="payment-element">
          <!-- Elements will create form elements here -->
        </div>
        {#if paymentReady}
          <button id="submit" class="btn block mt-4">Subscribe</button>
          <div id="error-message" bind:this={messageContainer}>
            <!-- Display error message to your customers here -->
          </div>
        {/if}
      </form>
    {/if}
  </div>
  <div class="grouping mb-8 p-4 border-width-$1px border-light-400" style="font-size: 0.875rem;">
    <h2 class="mb-6" style="font-size: 1.4rem; font-weight: 600;">App Options</h2>
    <p>Display mode: (Light or Dark)</p>
    <p>Notifications: (When? How often?)</p>
    <ul>
      <li>Push?</li>
      <li>Email?</li>
    </ul>
  </div>
</div>

<style>
  .text-white {
    color: white;
  }
  .p-4 {
    padding: 1rem;
  }
  .grouping {
    /* border: 1px solid var(--gray); */
    background-color: rgba(16, 16, 16, 1);
    border: 1px solid rgba(102, 102, 102, 0.6);
    /* box-shadow: 0 5px 12px 0 rgba(255, 255, 255, 0.08), 0 2px 5px 0 rgba(255, 255, 255, 0.12); */
    
  }
</style>