<script lang="ts" context="module">
  export async function load({ url, params, fetch, session, stuff, status, error }) {
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
        else {

        }
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
  import { loadStripe } from '@stripe/stripe-js'
  import Icon from '@iconify/svelte'
  import { goto } from '$app/navigation'

  export let subscription
  export let user

  let pwd
  let confirmPwd

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
        goto('/')
        // items = null // Still doesn't work
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

  function goBack() {
    history.back()
  }

  function getDate(time) {
    const date = new Date(time * 1000)
    return date.toString()
  }
</script>

<div class="decay mx-auto max-w-50rem p-4 text-white">
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
  <h1>Profile</h1>
  <div class="grouping my-8 p-4 border-width-$1px border-light-400">
    <h2 class="mb-4">Change password</h2>
    {#if resetSuccess}
      Password successfully reset!
    {:else}
      <form action="on:submit|preventDefault={changePwd}">
        <fieldset>
          <form on:submit|preventDefault={changePwd} class="form form--login">
            <div class="login-form-fields">
              <div class="form-field">
                <label for="password">New password</label>
                <input
                  bind:value="{pwd}"
                  on:input="{validatePwd}"
                  type="password"
                  id="password"
                  required
                  class="bg-black text-white p-2 w-full"
                >
              </div>
              <div class="form-field">
                <label for="confirmPassword">Confirm your password</label>
                <input
                  bind:value="{confirmPwd}"
                  on:input="{validatePwd}"
                  type="password"
                  id="confirmPassword"
                  class="bg-black text-white my-2 p-2 w-full"
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
  <div class="grouping mb-8 p-4 border-width-$1px border-light-400">
    <h2 class="mb-4">Subscription</h2>
    <p>Status: {subscription.status} </p>
    <p>Current Period Start: { getDate(subscription.current_period_start) }</p>
    <p>Current Period End: { getDate(subscription.current_period_end) }</p>
    <div class="my-4">
      <button class="btn" on:click="{manageSub}">Manage Subscription</button>
    </div>
    <!-- {#if subscription.status === 'active'}
      <div class="my-4">
        <button class="btn">Cancel</button>
      </div>
    {/if} -->
  </div>
</div>