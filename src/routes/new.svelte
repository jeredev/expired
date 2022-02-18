<script lang="ts">
  import { supabase } from "$lib/supabase"
  import { goto } from '$app/navigation'

  // TODO :: Password strength checker!

  let email
  let message
  let password
  let newUserValid = false
  const checkUserValidity = () => {
    if (/([^\s])/.test(email) && /([^\s])/.test(password)) newUserValid = true
    else newUserValid = false
  }
  const createNewUser = async() => {
    console.log('creating new user!')
    const { user, session, error } = await supabase.auth.signUp({
      email,
      password
    })
    if (error) {
      message = error
      return
    }
    if (user && session) {
      // Redirect to home
      goto('/')
    }
  }

</script>

<div class="decay mx-auto max-w-50rem p-4 text-white">
  <h1 class="mb-4">Welcome!</h1>
  <div>
    <p>Sign up using the form below.</p>
    <form on:submit|preventDefault={createNewUser}>
      <fieldset>
        <div class="form-field my-2">
          <label for="email" class="block">Email</label>
          <input
            type="email"
            id="email"
            class="bg-black text-white p-2 w-full"
            bind:value="{email}"
            on:input={checkUserValidity}
          >
        </div>
        <div class="form-field my-2">
          <label for="password" class="block">Password</label>
          <input
            type="password"
            id="password"
            class="bg-black text-white p-2 w-full"
            bind:value="{password}"
            on:input={checkUserValidity}
          >
        </div>
      </fieldset>
      {#if message}
        <div>
          <p>Error: { message.message }</p>
          <p>A user of this email address is already registered. If this is your account and you forgot your password, you can <a href="/reset">reset your password</a>.</p>
        </div>
      {/if}
      <button type="submit" class="btn mt-4" disabled={!newUserValid}>Submit</button>
    </form>
  </div>
</div>

<style>
  .form-field input:focus-visible {
    /* outline: 5px solid var(--red); */
    filter: drop-shadow(0 0 0.125rem #fff);
  }
</style>