<script lang="ts" context="module">
  export async function load({ url, params, fetch, session, stuff }) {
    const res = await fetch('/api/auth/user', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ access_token: url.hash.slice(14, url.hash.indexOf('&')) })
    })
    if (!res.ok) {
      return {
        status: 200,
        props: {
          access_token: null
        }
      }
    }
    if (res.ok) {
      // console.log(await res.json())
      return {
        status: 200,
        props: {
          access_token: url.hash.slice(14, url.hash.indexOf('&'))
        }
      }
    }
    // console.log(url.searchParams.get('type'))
    // https://juvelylevqqyyokxzkkq.supabase.co/auth/v1/verify?token=jS1Ypf4BuubLH-nZMtHtfA&type=recovery&redirect_to=https://localhost:3000/reset
    // Search for token and type
    // #access_token
    // expires_in
    // refresh_token
    // token_type
    // type
    // https://localhost:3000/reset#access_token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhdWQiOiJhdXRoZW50aWNhdGVkIiwiZXhwIjoxNjQ5NzgzNTM2LCJzdWIiOiJlNDU4YTA1NS0zZGJjLTRmZWMtOTFmNy1lMWM5YzMxZWE5MzAiLCJlbWFpbCI6ImplcmVteUBqZXJlbXl3eW5uLmNvbSIsInBob25lIjoiIiwiYXBwX21ldGFkYXRhIjp7InByb3ZpZGVyIjoiZW1haWwifSwidXNlcl9tZXRhZGF0YSI6e30sInJvbGUiOiJhdXRoZW50aWNhdGVkIn0.Cpkdu7bXx6eK192HPUXvOPKJsbjjJnKvH6xraSPst3o&expires_in=604800&refresh_token=3YaTLJ8xCf4ALqgXCXdiwQ&token_type=bearer&type=recovery
    // console.log(url)
    // // console.log(url.searchParams.get('token')) // null
    // // console.log(url.searchParams.get('type')) // null
    // console.log(url.hash)
    // console.log(url.hash.slice(14, url.hash.indexOf('&')))
    // return {
    //   status: 200,
    //   props: {
    //     access_token: url.hash.slice(14, url.hash.indexOf('&'))
    //   }
    // }
  }
</script>

<script lang="ts">

  export let access_token

  let pwd
  let confirmPwd

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
</script>

<div class="decay mx-auto max-w-50rem p-4 text-white">
  {#if access_token}
    {#if resetSuccess}
      Password successfully reset!
    {:else}
      <h1>Reset your password</h1>
      <form on:submit|preventDefault={resetPwd} class="form form--login">
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
          <button type="submit" class="btn" disabled="{statusProcessing || !resetPwdValid}">
            Continue
          </button>
        </div>
      </form>
    {/if}
  {:else if access_token === null}
    Not valid.
    <!-- Your password reset request couldn't be processed. Make sure cookies are enabled in your browser and try again. -->
  {:else}
    Loading...
  {/if}
</div>

<style>

</style>