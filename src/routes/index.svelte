<script>
  import { supabase, user } from "$lib/db";
  import { onDestroy, onMount } from "svelte";
  import {
    getTime,
  } from 'date-fns'

// import Layout from "./__layout.svelte";

  // import Messenger from "$lib/Messenger.svelte"
  import Item from "$lib/Item.svelte"

  let items = [];

  let time = getTime(new Date())
  // $: time = getTime(new Date())
  // console.log(time)
  // $: console.log(`the time is ${time}`)

  let email;
  let password;

  const logIn = async () => {
    const { user, error } = await supabase.auth.signIn({
      email: email,
      password: password,
    });
  };

  const logOut = async () => {
    const { error } = await supabase.auth.signOut();
  };

  const resetPwd = () => {
    console.log('resetting!')
  };

  let clock;

  const runClock = () => {
    time = getTime(new Date())
  };

  onMount(async() => {
    clock = window.setInterval(runClock, 1000);
    const { data, error } = await supabase
      .from('items')
      .select()   
    items = data
  });
  onDestroy(() => {
    clearInterval(clock)
  })
</script>

<div class="decay mx-auto max-w-50rem text-white">
  <!-- <Messenger /> -->
  <div class="header">
    {#if $user}
      Logged In {$user.id}!
      <button on:click={logOut} class="btn">Log Out</button>
    {:else}
      <form on:submit|preventDefault={logIn} class="form form--login">
        <div class="login-form-fields">
          <input
            bind:value="{email}"
            type="email"
            autocomplete="email"
            placeholder="Email address"
            required
            class="bg-black text-white p-2"
          >
          <input
            bind:value="{password}"
            type="password" 
            autocomplete="current-password" 
            placeholder="Password"
            class="bg-black text-white p-2"
          >
          <button on:click={resetPwd} type="button" class="btn">
            Reset
          </button>
          <button type="submit" class="btn">
            Login
          </button>
        </div>
      </form>
    {/if}
  </div>
  {#if $user}
    {#each items as item}
      <Item item={item} time={time} />
    {:else}
      <p>No items found</p>
    {/each}
  {:else}
    Please log in.
  {/if}
</div>
