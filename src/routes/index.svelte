<script>
  import { supabase, user } from "$lib/db";
  import { onDestroy, onMount } from "svelte";
  import { slide } from 'svelte/transition';
  import Icon from '@iconify/svelte'
  import {
    addYears,
    addMonths,
    addWeeks,
    addDays,
    addMinutes,
    addHours,
    differenceInYears,
    differenceInMonths,
    differenceInWeeks,
    differenceInDays,
    differenceInHours,
    differenceInMinutes,
    format,
    getTime,
    startOfDay,
    subYears,
    subMonths,
    subWeeks,
    subDays,
    subHours,
    subMinutes,
  } from 'date-fns'

  // import Layout from "./__layout.svelte";

  import AddItem from "../components/AddItem.svelte"
  import CategorizedItems from "../components/CategorizedItems.svelte"
  import Item from "../components/Item.svelte"
  import Messenger from "../components/Messenger.svelte"
  import { message } from "../stores";

  let allItems = []
  let items = []

  let listings = null

  let time = getTime(new Date())

  let email;
  let password;

  let addMenuActive = true
  let searchMenuActive = false
  let sortingMenuActive = false

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
      // TO DO :: Surgically insert instead of just throwing it at the end
      items = [...items, item]
      generateListings()
    });
  }

  // const barcodeDetector = new BarcodeDetector({
  //   formats: [
  //     'code_39',
  //     'codabar',
  //     'ean_13'
  //   ]
  // })

  const removeItem = (e) => {
    const indexAllItems = items.findIndex((x) => x.id === e.detail.id)
    if ( indexAllItems !== -1) {
      items = [...items.slice(0, indexAllItems), ...items.slice(indexAllItems + 1)]
    }
    const indexItems = items.findIndex((x) => x.id === e.detail.id)
    if ( indexItems !== -1) {
      items = [...items.slice(0, indexItems), ...items.slice(indexItems + 1)]
    }
    const indexListings = listings.findIndex((x) => x.id === e.detail.id)
    if (indexListings !== -1) {
      listings = [...listings.slice(0, indexListings), ...listings.slice(indexListings + 1)]
    }
    generateListings()
  }

  const updateItem = (e) => {
    const updatedItem = e.detail
    allItems.map(() => {
      const item = allItems.find(({ id }) => id === updatedItem.id);
      return item ? item : updatedItem;
    });
    items.map(() => {
      const item = items.find(({ id }) => id === updatedItem.id);
      return item ? item : updatedItem;
    });
    listings.map(() => {
      const item = listings.find(({ id }) => id === updatedItem.id);
      return item ? item : updatedItem;
    });
    generateListings()
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

  const search = {
    name: '',
    endTime: '',
    endRelatively: {
      years: null,
      months: null,
      weeks: null,
      days: null,
      hours: null,
      minutes: null,
    },
    category: ''
  }

  let searchQueryValid = false

  const checkSearchValidity = () => {
    if (/([^\s])/.test(search.name) || /([^\s])/.test(search.endTime) || /([^\s])/.test(search.category)) {
      searchQueryValid = true
    }
    else {
      searchQueryValid = false
    }
  }

  const updateEndTimeRelatively = () => {
    let adjTime = new Date()
    if (search.endRelatively.years)
      adjTime = addYears(adjTime, search.endRelatively.years)
    if (search.endRelatively.months)
      adjTime = addMonths(adjTime, search.endRelatively.months)
    if (search.endRelatively.weeks)
      adjTime = addWeeks(adjTime, search.endRelatively.weeks)
    if (search.endRelatively.days)
      adjTime = addDays(adjTime, search.endRelatively.days)
    if (search.endRelatively.hours)
      adjTime = addHours(adjTime, search.endRelatively.hours)
    if (search.endRelatively.minutes)
      adjTime = addMinutes(adjTime, search.endRelatively.minutes)
      search.endTime = format(new Date(adjTime), 'yyyy-MM-dd\'T\'HH:mm')
    checkSearchValidity()
  }

  const updateEndTimeRelativity = () => {
    const startTime = new Date()
    if (search.endTime) {
      let endTime = new Date(search.endTime)
      search.endRelatively.years = differenceInYears(endTime, startTime)
      endTime = subYears(new Date(endTime), search.endRelatively.years)
      search.endRelatively.months = differenceInMonths(endTime, startTime)
      endTime = subMonths(new Date(endTime), differenceInMonths(endTime, startTime))
      search.endRelatively.weeks = differenceInWeeks(endTime, startTime)
      endTime = subWeeks(new Date(endTime), differenceInWeeks(endTime, startTime))
      search.endRelatively.days = differenceInDays(endTime, startTime)
      endTime = subDays(new Date(endTime), differenceInDays(endTime, startTime))
      search.endRelatively.hours = differenceInHours(endTime, startTime)
      endTime = subHours(new Date(endTime), differenceInHours(endTime, startTime))
      search.endRelatively.minutes = differenceInMinutes(endTime, startTime)
      endTime = subMinutes(new Date(endTime), differenceInMinutes(endTime, startTime))
    }
    else {
      search.endRelatively.years = 0
      search.endRelatively.months = 0
      search.endRelatively.weeks = 0
      search.endRelatively.days = 0
      search.endRelatively.hours = 0
      search.endRelatively.minutes = 0
    }
    checkSearchValidity()
  }

  const searchItems = async() => {
    console.log('searching items!')
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

  const getItems = async(query) => {

    // https://supabase.com/docs/reference/javascript/using-filters
    let fetch = supabase
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

    if (query.name && /([^\s])/.test(query.name)) {
      console.log(`name query detected as ${query.name}`)
      fetch = fetch.ilike('name', `%${query.name}%`)
    }
    if (query.end && /([^\s])/.test(query.end)) {
      console.log(`end query detected as ${query.end}`)
      const endDate = new Date(query.end).toISOString()
      fetch = fetch.lte('endTime', endDate)
    }
    if (query.cat && /([^\s])/.test(query.cat)) {
      console.log(`category query detected as ${query.cat}`)
      const category = categories.find((category) => category.name === query.cat)
      fetch = fetch.eq('category', `${category.id}`)
    }

    const { data, error } = await fetch
    if (data) return data
    if (error) console.log(error)

  }

  const listItems = () => {
    sortItems(items)
    listings = items
  }

  onMount(async() => {
    categories = await getCategories()
    const params = new URLSearchParams(location.search)
    const searchQuery = {}
    // Query building
    if (params.get('name')) {
      searchQuery.name = params.get('name')
      search.name = params.get('name')
    }
    if (params.get('end')) {
      searchQuery.end = params.get('end')
      search.endTime = params.get('end')
    }
    if (params.get('cat')) {
      searchQuery.cat = params.get('cat')
      search.category = params.get('cat')
    }
    clock = window.setInterval(runClock, 1000);
    allItems = await getItems(searchQuery)
    items = allItems
    generateListings()

  });
  onDestroy(() => {
    clearInterval(clock)
  })
</script>

<div class="decay mx-auto max-w-50rem p-4 text-white">
  <Messenger />
  <div class="header">
    {#if !$user}
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
      <div class="panel flex justify-end mb-4">
        <button class={ sortingMenuActive ? 'active btn ml-2' : 'btn ml-2' } on:click={() => { sortingMenuActive = !sortingMenuActive }}>
          <Icon icon="clarity:sort-by-line" />
        </button>
        <button class={ searchMenuActive ? 'active btn ml-2' : 'btn ml-2' } on:click={() => { searchMenuActive = !searchMenuActive }}>
          <Icon icon="clarity:search-line" />
        </button>
        <button class={ addMenuActive ? 'active btn ml-2' : 'btn ml-2' } on:click={() => { addMenuActive = !addMenuActive }}>
          <Icon icon="clarity:add-line" />
        </button>
        <button on:click={logOut} class="btn ml-2">
          <Icon icon="clarity:logout-solid" />
        </button>
      </div>
      <div class="add-item-menu">
        <AddItem on:add={addItems} active={addMenuActive} />
      </div>
      {#if searchMenuActive}
        <div transition:slide class="search-menu">
          <h2 class="py-2 mb-4 text-white" style="border-bottom: 2px solid red; border-top: 2px solid red;">
            Search
          </h2>
          <form on:submit={searchItems} class="search">
            <div class="form-field my-2">
              <label for="search-items--text">Name</label>
              <input
                name="name"
                id="search-items--text"
                class="bg-black p-2 text-white w-full"
                type="text"
                bind:value={search.name}
                on:input="{checkSearchValidity}"
              >
            </div>
            <div class="area area--end-time my-2">
              <div class="form-field relative">
                <label for="expiration-search">Expiration Time</label>
                <input
                  name="end"
                  type="datetime-local"
                  class="p-2"
                  id="expiration-search"
                  pattern="[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}"
                  style="background-color: black; color: white; width: 100%;"
                  bind:value={search.endTime}
                  on:change={updateEndTimeRelativity}
                >
              </div>
              <div class="unit-form-fields mt-2">
                <div class="form-field my-2">
                  <label for="search-items--years">Years</label>
                  <input
                    id="search-items--years"
                    class="bg-black p-2 text-white w-full"
                    type="number"
                    step="1"
                    bind:value={search.endRelatively.years}
                    on:input="{updateEndTimeRelatively}"
                  >
                </div>
                <div class="form-field my-2">
                  <label for="search-items--months">Months</label>
                  <input
                    id="search-items--months"
                    class="bg-black p-2 text-white w-full"
                    type="number"
                    step="1"
                    bind:value={search.endRelatively.months}
                    on:input="{updateEndTimeRelatively}"
                  >
                </div>
                <div class="form-field my-2">
                  <label for="search-items--weeks">Weeks</label>
                  <input
                    id="search-items--weeks"
                    class="bg-black p-2 text-white w-full"
                    type="number"
                    step="1"
                    bind:value={search.endRelatively.weeks}
                    on:input="{updateEndTimeRelatively}"
                  >
                </div>
                <div class="form-field my-2">
                  <label for="search-items--days">Days</label>
                  <input
                    id="search-items--days"
                    class="bg-black p-2 text-white w-full"
                    type="number"
                    step="1"
                    bind:value={search.endRelatively.days}
                    on:input="{updateEndTimeRelatively}"
                  >
                </div>
              </div>
              {#if categories}
                <div class="form-field my-2">
                  <label for="search-items--category">Category</label>
                  <select
                    name="cat"
                    id="new-item--category"
                    class="bg-black p-2 text-white w-full"
                    bind:value="{search.category}"
                    on:change="{checkSearchValidity}"
                  >
                    {#each categories as category}
                      <option value="{category.name}">{category.name}</option>
                    {/each}
                  </select>
                </div>
              {/if}
            </div>
            <button type="submit" class="btn my-2" disabled={!searchQueryValid}>
              <Icon icon="clarity:search-line" />
            </button>
          </form>
        </div>
      {/if}
      {#if sortingMenuActive}
        <div transition:slide class="sector mb-4">
          <h2 class="py-2 mb-4 text-white" style="border-bottom: 2px solid red; border-top: 2px solid red;">
            Sorting and Filtering
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
      {/if}
    </div>
    <div class="items">
      {#if listings && listings.length}
        <div class="items-listing">
          {#if displayMode === 'categories'}
            {#each listings as category}
              <CategorizedItems categories={categories} category={category} time={time} items={category.items} on:remove={removeItem} on:update={updateItem} />
            {/each}
          {:else}
          {#each listings as listing}
            <Item item={listing} time={time} categories={categories} on:remove={removeItem} on:update={updateItem} />
          {/each}
        {/if}
        </div>
      {:else if listings && listings.length < 1}
        <p>No items found</p>
      {:else}
        <p>Loading...</p>
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
  .homebase .btn:disabled {
    border-color: rgba(75, 85, 99, var(--tw-bg-opacity));
    color: white;
  }
</style>