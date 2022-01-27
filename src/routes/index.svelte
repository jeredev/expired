<script>
  import { supabase, user } from "$lib/db";
  import { onDestroy, onMount } from "svelte";
  import Icon from '@iconify/svelte'
  import {
    getTime,
  } from 'date-fns'

  // import Layout from "./__layout.svelte";

  import AddItem from "../components/AddItem.svelte"
  import CategorizedItems from "../components/CategorizedItems.svelte"
  import Item from "../components/Item.svelte"
  import Messenger from "../components/Messenger.svelte"
  import { message } from "../stores";

  let allItems = []
  let items = []

  let listings = []

  let time = getTime(new Date())

  let email;
  let password;

  let addMenuActive = false

  const logIn = async () => {
    const { user, error } = await supabase.auth.signIn({
      email: email,
      password: password,
    });
    message.set('Successfully logged in.')
  };

  const logOut = async () => {
    const { error } = await supabase.auth.signOut();
    message.set('Successfully logged out.')
  };

  const addItems = (e) => {
    const newItems = e.detail
    newItems.forEach(item => {
      item.time = time
      items = [...items, item]
    });
  }

  const removeItem = (e) => {
    const index = items.findIndex((x) => x.id === e.detail.id)
    if (index !== -1) {
      items = [...items.slice(0, index), ...items.slice(index + 1)]
    }
  }

  const resetPwd = () => {
    console.log('resetting!')
  };

  let clock;

  const runClock = () => {
    time = getTime(new Date())
  };

  /* Sorting */

  // Level One
  let displayMode = 'list'
  // Level Two
  let timeStatusMode = 'all'
  // Level Three
  let sortingMode = 'alpha-ascending'

  const getLifespan = (startTime, endTime) => {
    return getTime(new Date(endTime)) - getTime(new Date(startTime))
  }
  const getTimeElapsed = (startTime) => {
    return time - getTime(new Date(startTime))
  }
  const filterAll = () => {
    timeStatusMode = 'all'
    items = allItems
    generateListings()
  }
  const filterSafe = () => {
    timeStatusMode = 'safe'
    const safe = allItems.filter(item => {
      let timeElapsed = getTimeElapsed(item.startTime)
      let lifespan = getLifespan(item.startTime, item.endTime)
      return timeElapsed < lifespan
    })
    items = safe
    generateListings()
  }
  const filterExpired = () => {
    timeStatusMode = 'expired'
    const expired = allItems.filter(item => {
      let timeElapsed = getTimeElapsed(item.startTime)
      let lifespan = getLifespan(item.startTime, item.endTime)
      return timeElapsed > lifespan
    })
    items = expired
    generateListings()
  }
  const sortAlphaAsc = (payload) => {
    return payload.sort((a, b) => a.name.localeCompare(b.name))
  }
  const sortAlphaDesc = (payload) => {
    return payload.sort((a, b) => b.name.localeCompare(a.name))
  }
  const sortEndtimeAsc = (payload) => {
    return payload.sort((a, b) => {
      return new Date(b.endTime) - new Date(a.endTime)
    })
  }
  const sortEndtimeDesc = (payload) => {
    return payload.sort((a, b) => {
      return new Date(a.endTime) - new Date(b.endTime)
    })
  }

  const sortItems = (payload) => {
    switch (sortingMode) {
      case 'alpha-ascending':
        sortAlphaAsc(payload)
        break
      case 'alpha-descending':
        sortAlphaDesc(payload)
        break
      case 'endtime-ascending':
        sortEndtimeAsc(payload)
        break
      case 'endtime-descending':
        sortEndtimeDesc(payload)
        break
    }
  }

  const setDisplayMode = (mode) => {
    displayMode = mode
    generateListings()
  }

  const setSortingMode = (mode) => {
    sortingMode = mode
    generateListings()
  }

  const generateListings = () => {
    if (displayMode === 'categories') {
      categorizeItems()
    }
    else {
      listItems()
    }
  }

  let categories = []
  const getCategories = async() => {
    const { data, error } = await supabase
      .from('categories')
      .select()
    if (data) return data
  }

  const categorizeItems = () => {
    let categorizedItems = []
    if (categories) {
      categories.forEach((category) => {
        const found = categorizedItems.find(element => element.id === category.id)
        if (!found) {
          category.items = []
          categorizedItems.push(category)
        }
      })
    }
    const uncategorizedCategory = {
      id: null,
      name: 'Uncategorized',
      items: []
    }
    categorizedItems.push(uncategorizedCategory)
    items.forEach((item) => {
      if (item.category) {
        const found = categorizedItems.find(element => element.id === item.category.id)
        if (found) found.items.push(item)
      }
      else {
        const found = categorizedItems.find(element => element.id === null)
        found.items.push(item)
      }
    })
    categorizedItems.forEach((category) => {
      sortItems(category.items)
    })
    listings = categorizedItems
  }

  const listItems = () => {
    sortItems(items)
    listings = items
  }

  onMount(async() => {
    clock = window.setInterval(runClock, 1000);
    const { data, error } = await supabase
      .from('items')
      .select(`
        id,
        name,
        startTime,
        endTime,
        category (
          id,
          name
        ),
        imagePath
      `)
    allItems = data
    items = allItems
    categories = await getCategories()
    generateListings()
  });
  onDestroy(() => {
    clearInterval(clock)
  })
</script>

<div class="decay mx-auto max-w-50rem p-4 text-white">
  <Messenger />
  <div class="header">
    {#if $user}
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
            class="bg-black text-white p-2 w-full"
          >
          <input
            bind:value="{password}"
            type="password" 
            autocomplete="current-password" 
            placeholder="Password"
            class="bg-black text-white my-2 p-2 w-full"
          > 
          <button type="submit" class="btn">
            Login
          </button>
          <!-- <button on:click={resetPwd} type="button" class="btn">
            Reset
          </button> -->
        </div>
      </form>
    {/if}
  </div>
  {#if $user}
    <div class="homebase">
      <div class="panel">
        <button class="btn">Search</button>
        <button class="btn" on:click={() => { addMenuActive = !addMenuActive }}>Add Item</button>
      </div>
      <div class="add-item-menu">
        <AddItem on:add={addItems} active={addMenuActive} />
      </div>
      <div class="search-menu">
        
      </div>
      <div class="sector my-4">
        <h2 class="my-2">
          Sorting
        </h2>
        <div class="grid grid-cols-2 gap-2 my-2">
          <button class="btn" disabled="{ displayMode === 'list' }" on:click="{() => { setDisplayMode('list') }}">List</button>
          <button class="btn" disabled="{ displayMode === 'categories' }" on:click="{() => { setDisplayMode('categories') }}">Categories</button>
        </div>
        <div class="grid grid-cols-3 gap-2 my-2">
          <button class="btn" disabled="{ timeStatusMode === 'all' }" on:click="{filterAll}">
            All
          </button>
          <button class="btn" disabled="{ timeStatusMode === 'safe' }" on:click="{filterSafe}">
            Safe
          </button>
          <button class="btn" disabled="{ timeStatusMode === 'expired' }" on:click="{filterExpired}">
            Expired
          </button>
        </div>
        <div class="grid grid-cols-4 gap-2">
          <button class="btn whitespace-nowrap" disabled="{ sortingMode === "alpha-ascending" }" on:click={() => setSortingMode('alpha-ascending')}>
            A <Icon icon="clarity:arrow-line" inline={true} style="display: inline-block; transform:rotate(90deg);" /> Z
          </button>
          <button class="btn whitespace-nowrap" disabled="{ sortingMode === "alpha-descending" }" on:click={() => setSortingMode('alpha-descending')}>
            Z <Icon icon="clarity:arrow-line" inline={true} style="display: inline-block; transform:rotate(90deg);" /> A
          </button>
          <button class="btn whitespace-nowrap" disabled="{ sortingMode === "endtime-ascending" }" on:click={() => setSortingMode('endtime-ascending')}>
            <Icon icon="clarity:clock-line" inline={true} style="display: inline-block;" />
            <Icon icon="clarity:arrow-line" inline={true} style="display: inline-block;" />
          </button>
          <button class="btn whitespace-nowrap" disabled="{ sortingMode === "endtime-descending" }" on:click={() => setSortingMode('endtime-descending')}>
            <Icon icon="clarity:clock-line" inline={true} style="display: inline-block;" />
            <Icon icon="clarity:arrow-line" inline={true} style="display: inline-block; transform:rotate(180deg);" />
          </button>
        </div>
      </div>
    </div>
    <div class="items">
      {#if listings.length}
        <div class="items-listing">
          {#if displayMode === 'categories'}
            <h1>Categories</h1>
            {#each listings as category}
              <CategorizedItems categories={categories} category={category} time={time} items={category.items} />
            {/each}
          {:else}
          {#each listings as listing}
            <h1>Items listing</h1>
            <Item item={listing} time={time} categories={categories} on:remove={removeItem} />
          {/each}
        {/if}
        </div>
      {:else}
        <p>No items found</p>
      {/if}
    </div>
  {:else}
    <div class="py-4">Authorized users only.</div>
  {/if}
</div>

<style>
  .category {
    align-items: center;
    grid-template-columns: 1fr max-content;
    position: sticky;
    top: 0;
    z-index: 2;
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