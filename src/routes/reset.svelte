<script lang="ts">
  import { supabase } from "$lib/supabase"

  // https://juvelylevqqyyokxzkkq.supabase.co/auth/v1/verify?token=J3d5QjjIjKPG1Glxpf3wwA&type=recovery&redirect_to=https://localhost:3000/reset

  // TODO :: Password strength checker!

  let accessToken = null

  let email
  let recoverPasswordValid = false
  const checkEmailValidity = () => {
    if (/([^\s])/.test(email)) recoverPasswordValid = true
    else recoverPasswordValid = false
  }
  const recoverPassword = async() => {
    console.log('resetting!')
    // const { data, error } = supabase.auth.api
    //   .resetPasswordForEmail(email)
  }

  let password
  let passwordConfirmation
  let resetPasswordValid = false
  const checkPasswordValidity = () => {
    if (/([^\s])/.test(password) && /([^\s])/.test(passwordConfirmation) && password === passwordConfirmation) resetPasswordValid = true
    else resetPasswordValid = false
  }
  const resetPassword = async() => {
    console.log('resetting!')
    // const { error, data } = await supabase.auth.api
    //   .updateUser(access_token, { password })
  }
</script>

<div class="decay mx-auto max-w-50rem p-4 text-white">
  <h1 class="mb-4">Reset your password</h1>
  {#if accessToken}
    <div>
      <form on:submit|preventDefault={resetPassword}>
        <fieldset>
          <div class="form-field my-2">
            <label for="password" class="block">New password</label>
            <input
              type="password"
              id="password"
              class="bg-black text-white p-2 w-full"
              bind:value="{password}"
              on:input={checkPasswordValidity}
            >
          </div>
          <div class="form-field my-2">
            <label for="confirm-password" class="block">Confirm your password</label>
            <input
              type="password"
              id="confirm-password"
              class="bg-black text-white p-2 w-full"
              bind:value="{passwordConfirmation}"
              on:input={checkPasswordValidity}
            >
          </div>
        </fieldset>
        <button type="submit" class="btn mt-4" disabled={!resetPasswordValid}>Continue</button>
      </form>
    </div>
  {:else}
    <div>
      <p>Enter the email address associated with your account and we'll send you a link to reset your password.</p>
      <form on:submit|preventDefault={recoverPassword}>
        <fieldset>
          <div class="form-field my-2">
            <label for="email" class="block">Email</label>
            <input
              type="email"
              id="email"
              class="bg-black text-white p-2 w-full"
              bind:value="{email}"
              on:input={checkEmailValidity}
            >
          </div>
        </fieldset>
        <button type="submit" class="btn mt-4" disabled={!recoverPasswordValid}>Continue</button>
      </form>
    </div>
  {/if}
</div>

<style>
  .form-field input:focus-visible {
    /* outline: 5px solid var(--red); */
    filter: drop-shadow(0 0 0.125rem #fff);
  }
</style>