<script lang="ts">
  let email: string
  let password: string
  let statusProcessing = false

  const logIn = async () => {
    statusProcessing = true
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          email,
          password
        }),
        headers: {
          'Content-Type': 'application/json'
        }
      })
      const data = await res.json()
      console.log('data below:')
      console.log(data)
    }
    catch(e) {
      console.log('e below:')
      console.log(e)
    }
    statusProcessing = false
  };
</script>

<form on:submit|preventDefault={logIn} class="form form--login">
  <div class="login-form-fields">
    <input
      bind:value="{email}"
      type="email"
      autocomplete="email"
      placeholder="Email address"
      required
      class="bg-black text-white p-2 w-full"
    >
    <input
      bind:value="{password}"
      type="password" 
      autocomplete="current-password" 
      placeholder="Password"
      class="bg-black text-white my-2 p-2 w-full"
    > 
    <button type="submit" class="btn" disabled="{statusProcessing}">
      Login
    </button>
    <!-- <button on:click={resetPwd} type="button" class="btn">
      Reset
    </button> -->
  </div>
</form>

<style>
  .login-form-fields input:focus-visible {
    /* outline: 5px solid var(--red); */
    filter: drop-shadow(0 0 0.125rem #fff);
  }
  .form-field input:focus-visible, .form-field select:focus-visible {
    filter: drop-shadow(0 0 0.125rem #fff);
    outline: 1px solid #fff;
  }
  @media only all and (min-width: 40em) {
    .login-form-fields {
      display: grid;
      grid-gap: 1rem;
      grid-template-columns: 1fr 1fr min-content;
    }
    .login-form-fields input[type="password"] {
      margin: 0;
    }
  }
</style>