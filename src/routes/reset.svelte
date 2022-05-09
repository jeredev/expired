<script lang="ts" context="module">
  import { browser } from '$app/env'
  // import type { Load } from "@sveltejs/kit"
  // export const load: Load = async({ url, params, fetch, session, stuff, status, error }) => {

  // }
  export async function load({ url, params, fetch, session, stuff }) {
    if (browser) {
      if (url.hash) {
        console.log('running before supabase call:') // This runs in browser, not on server
        const res = await fetch('/api/auth/user', {
          method: 'POST',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ access_token: url.hash.slice(14, url.hash.indexOf('&')) })
        })
        if (!res.ok) {
          const error = await res.json()
          console.log(error)
          if (error.status === 401) {
            console.log('invalid')
            return {
              status: 200,
              props: {
                access_token: 'invalid'
              }
            }
          }
          else {
            return {
              status: 200,
              props: {
                access_token: null
              }
            }
          }
        }
        if (res.ok) {
          console.log('res.ok')
          // console.log(await res.json())
          // const user = await res.json()
          return {
            status: 200,
            props: {
              access_token: url.hash.slice(14, url.hash.indexOf('&'))
            }
          }
        }
      }
      else {
        // No hash in browser :: Render initiate
        console.log('else hey')
        return {
          status: 200,
          props: {
            access_token: null
          }
        }
      } 
    }
    else {
      return {
        status: 200,
        props: {
          access_token: undefined
        }
      }
    }
  }
</script>

<script lang="ts">
  import { fade } from 'svelte/transition'

  export let access_token: string | null | undefined = undefined

  let pwd: string
  let confirmPwd: string

  let statusProcessing = false
  let resetPwdValid = false

  let resetSuccess = false

  const validatePwd = () => {
    if (access_token && /([^\s])/.test(pwd) && /([^\s])/.test(pwd) && pwd.length >= 6 && pwd === confirmPwd) {
      resetPwdValid = true
    }
    else {
      resetPwdValid = false
    }
  }
  const resetPwd = async() => {
    const formData = new FormData()
    formData.append('access_token', access_token)
    formData.append('pwd', pwd)
    const res = await fetch('/api/auth/reset', {
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

  let initiateResetPwdValid = false
  const checkLoginValidity = () => {
    if (/([^\s])/.test(email)) {
      initiateResetPwdValid = true
    }
    else {
      initiateResetPwdValid = false
    }
  }

  let email: string
  let resetRequestSuccessful = false

  let initiateResetPwdProcessing = false
  const initiatePwdReset = async() => {
    initiateResetPwdProcessing = true
    if (email && /([^\s])/.test(email)) {
      const formData = new FormData()
      formData.append('email', email)
      const res = await fetch('/api/auth/init-reset', {
        method: 'POST',
        body: formData
      })
      if (!res.ok) {
        console.log('!res.ok')
        const error = await res.json()
        // message.set({
        //   text: `Error: ${error.message}`,
        //   timed: true
        // })
        console.log('error initiating reset:', error)
        return
      }
      if (res.ok) {
        resetRequestSuccessful = true
      }
    }
    initiateResetPwdProcessing = false
  }
</script>

<div class="decay mx-auto max-w-2xl p-4 text-white">
  <div class="shell">
    {#if access_token}
      {#if resetSuccess}
        Password successfully reset!
      {:else}
        <h1 class="mb-8">Reset your password</h1>
        {#if access_token === 'invalid'}
          <div class="mb-4 mt-2 validation">
            <p>Invalid token detected so resetting your password cannot resume. Please try again by using the form below and then using the new link you receive shortly thereafter.</p>
          </div>
          <form on:submit|preventDefault={initiatePwdReset} class="form form--login mt-4">
            <div class="login-form-area">
              <div class="login-form-fields">
                <div class="form-field">
                  <label for="login-email">Email</label>
                  <input
                    bind:value="{email}"
                    on:input="{checkLoginValidity}"
                    type="email"
                    id="login-email"
                    autocomplete="email"
                    required
                    class="bg-black text-white p-2 w-full"
                  >
                </div>
              </div>
              <div class="form-actions mt-4">
                <button on:click={initiatePwdReset} type="button" class="btn" disabled={!initiateResetPwdValid || initiateResetPwdProcessing}>
                  Reset
                </button>
              </div>
            </div>
            {#if resetRequestSuccessful}
              <div transition:fade class="mt-2 validation">
                <h2>Check your email for instructions to reset your password.</h2>
                <p>If you haven't received an email in 5 minutes, check your spam or resubmit the form.</p>
              </div>
            {/if}
          </form>
        {:else}
          <form on:submit|preventDefault={resetPwd} class="form form--login mt-4">
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
              <div class="form-field mt-2">
                <label for="confirmPassword">Confirm your password</label>
                <input
                  bind:value="{confirmPwd}"
                  on:input="{validatePwd}"
                  type="password"
                  id="confirmPassword"
                  class="bg-black text-white mb-2 p-2 w-full"
                >
              </div>
              <button type="submit" class="btn mt-2" disabled="{statusProcessing || !resetPwdValid}">
                Continue
              </button>
            </div>
          </form>
        {/if}
      {/if}
    {:else if access_token === null}
      <h1 class="mb-6">Reset your password</h1>
      <p style="font-family: 'Recursive', sans-serif; font-size: 90%;">Enter the email address associated with your account and you'll receive a link to reset your password.</p>
      <form on:submit|preventDefault={initiatePwdReset} class="form form--login mt-8">
        <div class="login-form-area">
          <div class="login-form-fields">
            <div class="form-field">
              <label for="login-email">Email</label>
              <input
                bind:value="{email}"
                on:input="{checkLoginValidity}"
                type="email"
                id="login-email"
                autocomplete="email"
                required
                class="bg-black text-white p-2 w-full"
              >
            </div>
          </div>
          <div class="form-actions mt-4">
            <button on:click={initiatePwdReset} type="button" class="btn" disabled={!initiateResetPwdValid || initiateResetPwdProcessing}>
              Reset Password
            </button>
          </div>
        </div>
        {#if resetRequestSuccessful}
          <div transition:fade class="mt-2 validation">
            <h2>Check your email for instructions to reset your password.</h2>
            <p>If you haven't received an email in 5 minutes, check your spam or resubmit the form.</p>
          </div>
        {/if}
      </form>
      <!-- Your password reset request couldn't be processed. Make sure cookies are enabled in your browser and try again. -->
    {:else}
      Loading...
    {/if}
  </div>
</div>

<style>
  .validation {
    background-color: var(--red);
    font-family: 'Recursive', sans-serif;
    margin-top: 1rem;
    padding: 0.5rem;
  }
  .shell {
    background-color: rgba(16, 16, 16, 1);
    border: 1px solid rgba(255, 255, 255, 0.3);
    box-shadow: 0 15px 35px 0 rgba(255, 255, 255, 0.08), 0 5px 15px 0 rgba(255, 255, 255, 0.12);
    margin-top: 4rem;
    padding: 2rem;
  }
</style>