<script context="module">
  // export async function load({ session }) {
  //   const { user } = session
  //   return {
  //     props: {
  //       user
  //     }
  //   };
  // }
  export async function load({fetch}) {
    // console.log('load')
    const responseCategories = await fetch('/api/categories')
    // const responseItems = await fetch('/api/items')
    // console.log(response)
    // const data = await response.json()
    // console.log(data)
    return {
      // status: response.status,
      props: {
        categories: responseCategories.ok && (await responseCategories.json())
      }
    }
  }
</script>
<script>
  import { supabase } from "$lib/supabase";
  import { page, session } from "$app/stores";
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
    subYears,
    subMonths,
    subWeeks,
    subDays,
    subHours,
    subMinutes,
  } from 'date-fns'

  import AddItem from "../components/AddItem.svelte"
  import CategorizedItems from "../components/CategorizedItems.svelte"
  import Category from "../components/CategoryBar.svelte"
  import Item from "../components/Item.svelte"
  import Messenger from "../components/Messenger.svelte"
  import { displayMode, sortingMode, timeStatusMode, message } from "../stores";

  export let categories

  let allItems = []
  let items = []

  let listings = null

  let time = getTime(new Date())

  let email;
  let password;

  let addMenuActive = false
  let categoriesMenuActive = false
  let searchMenuActive = false
  let sortingMenuActive = false

  // const sendMsg = () => {
  //   message.set({
  //     text: 'Message',
  //     timed: true
  //   })
  // }

  let statusProcessing = false

  const logIn = async () => {
    statusProcessing = true
    const { user, error } = await supabase.auth.signIn({
      email: email,
      password: password,
    });
    if (user) {
      statusProcessing = false
      message.set({
        text: 'Successfully logged in.',
        timed: true
      })
      // Perform mount operations
      categories = await getCategories()
      const params = new URLSearchParams(location.search)
      // const searchQuery = {}
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
      allItems.forEach(async(item) => {
        if (item.imagePath) {
          const imagePath = user.id + "/" + item.imagePath
          item.image = await getItemImage(imagePath)
        }
      })
      items = allItems
      generateListings()
    }
    if (error) {
      statusProcessing = false
      message.set({
        text: `Error: ${error.message}`,
        timed: true
      })
      console.error('There was a problem:', error)
      return
    }
  };

  const logOut = async () => {
    statusProcessing = true
    const { error } = await supabase.auth.signOut();
    statusProcessing = false
    if (error) {
      message.set({
        text: `Error: ${error.message}`,
        timed: true
      })
      console.error('There was a problem:', error)
      return
    }
    else {
      message.set({
        text: 'Successfully logged out.',
        timed: true
      })
    }
  };

  const addItems = async(e) => {
    const newItems = e.detail
    categories = await getCategories()
    newItems.forEach(async(item) => {
      // Find appropriate category
      const found = categories.find(element => element.id === item.category)
      if (!found) {
        item.category = {}
      } else {
        item.category = {}
        item.category.id = found.id
        item.category.name = found.name
        // item.edits.category = {}
        item.edits.category.id = found.id
        item.edits.category.name = found.name
      }
      if (item.imagePath) {
        const imagePath = $session.user.id + "/" + item.imagePath
        item.image = await getItemImage(imagePath)
      }
      item.time = time
      allItems.push(item)
      // items = [...items, item]
      generateListings()
    });
  }

  const removeItem = (e) => {
    const indexAllItems = allItems.findIndex((x) => x.id === e.detail.id)
    // console.log(`indexAllItems = ${indexAllItems}`)
    if ( indexAllItems !== -1) {
      allItems = [...allItems.slice(0, indexAllItems), ...allItems.slice(indexAllItems + 1)]
    }
    const indexItems = items.findIndex((x) => x.id === e.detail.id)
    // console.log(`indexItems = ${indexItems}`)
    if ( indexItems !== -1) {
      items = [...items.slice(0, indexItems), ...items.slice(indexItems + 1)]
    }
    // Is this part even needed?
    // const indexListings = listings.findIndex((x) => x.id === e.detail.id)
    // console.log(`indexListings = ${indexListings}`)
    // if (indexListings !== -1) {
    //   listings = [...listings.slice(0, indexListings), ...listings.slice(indexListings + 1)]
    // }
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

  const getLifespan = (startTime, endTime) => {
    return getTime(new Date(endTime)) - getTime(new Date(startTime))
  }
  const getTimeElapsed = (startTime) => {
    return time - getTime(new Date(startTime))
  }
  const filterAll = () => {
    items = allItems
  }
  const filterSafe = () => {
    const safe = allItems.filter(item => {
      let timeElapsed = getTimeElapsed(item.startTime)
      let lifespan = getLifespan(item.startTime, item.endTime)
      return timeElapsed < lifespan
    })
    items = safe
  }
  const filterExpired = () => {
    const expired = allItems.filter(item => {
      let timeElapsed = getTimeElapsed(item.startTime)
      let lifespan = getLifespan(item.startTime, item.endTime)
      return timeElapsed > lifespan
    })
    items = expired
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
    // console.log('searching items!')
  }

  const sortItems = (payload) => {
    switch ($sortingMode) {
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

  const sortByTimeStatus = () => {
    switch ($timeStatusMode) {
      case 'all':
        filterAll()
        break
      case 'safe':
        filterSafe()
        break
      case 'expired':
        filterExpired()
        break
    }
  }

  const setDisplayMode = (mode) => {
    displayMode.set(mode)
    generateListings()
  }

  const setSortingMode = (mode) => {
    sortingMode.set(mode)
    generateListings()
  }

  const setTimeStatusMode = (mode) => {
    timeStatusMode.set(mode)
    generateListings()
  }

  // let categories = []
  const getCategories = async() => {
    const res = await fetch('/api/categories')
    return await res.json()
  }

  const generateListings = () => {
    if ($displayMode === 'categories') {
      categorizeItems()
    }
    else {
      listItems()
    }
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
    sortByTimeStatus()
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
    sortByTimeStatus()
    sortItems(items)
    listings = items
  }

  const getItems = async(query) => {

    let appendage = ''
    if (query) {
      appendage = '?' + new URLSearchParams(query)
    }
    const res = await fetch('/api/items' + appendage)
    return await res.json()
    // Error handling needed here
    // if (data) return data
    // if (error) {
    //   message.set({
    //     text: `Error: ${error.message}`,
    //     timed: true
    //   })
    //   console.error('Error:', error)
    //   return
    // }

  }

  const getItemImage = async (path) => {
    const { data, error } = await supabase
      .storage
      .from('expired')
      .download(path)
    if (data) return URL.createObjectURL(data)
    if (error) {
      message.set({
        text: `Error: ${error.message}`,
        timed: true
      })
      console.error('Error:', error)
      return
    }
  }

  const searchQuery = {}

  let addingCategory = false
  let newCategory
  let newCategoryValid = false
  const checkNewCategoryValidity = () => {
    if (newCategory && /([^\s])/.test(newCategory)) {
      newCategoryValid = true
      return true
    }
    else {
      newCategoryValid = false
      return false
    }
  }
  const addNewCategory = async() => {
    addingCategory = true
    const { data, error } = await supabase
      .from('categories')
      .insert([
        {
          name: newCategory.trim(),
        },
      ])
    if (error) {
      message.set({
        text: `Error: ${error.message}`,
        timed: true
      })
      console.log('error adding new category:', error)
      return
    }
    if (data) {
      categories = await getCategories()
      generateListings()
      newCategory = null
      addingCategory = false
    }
  }

  const removeCategory = (e) => {
    const indexCategories = categories.findIndex((x) => x.id === e.detail.id)
    if ( indexCategories !== -1) {
      categories = [...categories.slice(0, indexCategories), ...categories.slice(indexCategories + 1)]
    }
    generateListings()
  }

  const updateCategory = (e) => {
    const indexCategories = categories.findIndex((x) => x.id === e.detail.id)
    if ( indexCategories !== -1) {
      categories[indexCategories].name = e.detail.name
    }
    generateListings()
  }

  if ($page.url.searchParams.get('name')) {
    searchQuery.name = $page.url.searchParams.get('name')
    search.name = $page.url.searchParams.get('name')
  }
  if ($page.url.searchParams.get('end')) {
    searchQuery.end = $page.url.searchParams.get('end')
    search.endTime = $page.url.searchParams.get('end')
  }
  if ($page.url.searchParams.get('cat')) {
    searchQuery.cat = $page.url.searchParams.get('cat')
    search.category = $page.url.searchParams.get('cat')
  }

  // Invitation :: New Users
  // https://juvelylevqqyyokxzkkq.supabase.co/auth/v1/verify?token=CAspA-OBu4inFJdKu30D-g&type=invite&redirect_to=http://localhost:3000
  // http://localhost:3000/#error_code=410&error_description=Confirmation+token+expired
  // const type = $page.url.searchParams.get('type')
  // beforeNavigate(() => {
  //   const type = $page.url.searchParams.get('type')
  //   console.log(`type is ${type}`)
  // })

  // export async function load({ session }) {
  //   const { user } = session
  //   return {
  //     props: {
  //       user
  //     }
  //   };
  // }

  onMount(async() => {
    categories = await getCategories()
    clock = window.setInterval(runClock, 1000);
    allItems = await getItems(searchQuery)
    allItems.forEach(async(item) => {
      if (item.imagePath) {
        const imagePath = $session.user.id + "/" + item.imagePath
        item.image = await getItemImage(imagePath)
      }
    })
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
    <!-- <button type="button" class="btn" on:click="{sendMsg}">Message</button> -->
    {#if !$session}
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
    {/if}
  </div>
  {#if $session}
    <div class="homebase">
      {#if Object.keys(searchQuery).length}
        <a href="/" class="btn">
          <Icon icon="clarity:arrow-line" style="display: inline; transform: rotate(-90deg);" />
        </a>
      {/if}
      <div class="panel flex justify-end mb-4">
        <button class={ categoriesMenuActive ? 'active btn ml-2' : 'btn ml-2' } on:click={() => { categoriesMenuActive = !categoriesMenuActive }}>
          <Icon icon="clarity:blocks-group-line" />
        </button>
        <button class={ sortingMenuActive ? 'active btn ml-2' : 'btn ml-2' } on:click={() => { sortingMenuActive = !sortingMenuActive }}>
          <Icon icon="clarity:sort-by-line" />
        </button>
        <button class={ searchMenuActive ? 'active btn ml-2' : 'btn ml-2' } on:click={() => { searchMenuActive = !searchMenuActive }}>
          <Icon icon="clarity:search-line" />
        </button>
        <button class={ addMenuActive ? 'active btn ml-2' : 'btn ml-2' } on:click={() => { addMenuActive = !addMenuActive }}>
          <Icon icon="clarity:add-line" />
        </button>
        <button on:click={logOut} class="btn ml-2" disabled="{statusProcessing}">
          <Icon icon="clarity:logout-solid" />
        </button>
      </div>
      {#if categoriesMenuActive}
        <div transition:slide class="sector mb-4">
          <h2 class="py-2 mb-4 text-white" style="border-bottom: 2px solid red; border-top: 2px solid red;">
            Categories
          </h2>
          <div>
            <div class="form-field">
              <label for="new-category-name" style="font-size: 80%;">Add New Category</label>
              <div class="entry flex">
                <input
                  type="text"
                  id="new-category-name"
                  class="bg-black p-1 text-white w-full"
                  placeholder="Category Name"
                  bind:value="{newCategory}"
                  on:input="{checkNewCategoryValidity}"
                >
                <button type="button" class="btn ml-2" disabled="{!newCategoryValid || addingCategory}" on:click="{addNewCategory}">Add</button>
              </div>   
            </div>
          </div>
          <div class="categories-list mt-2">
            {#each categories as category}
              <Category category="{category}" on:updateCategory={updateCategory} on:removeCategory={removeCategory} />
            {/each}
          </div>
        </div>
      {/if}
      {#if sortingMenuActive}
        <div transition:slide class="sector mb-4">
          <h2 class="py-2 mb-4 text-white" style="border-bottom: 2px solid red; border-top: 2px solid red;">
            Sorting and Filtering
          </h2>
          <div class="grid grid-cols-2 gap-2 my-2">
            <button class="btn" disabled="{ $displayMode === 'list' }" on:click="{() => { setDisplayMode('list') }}">List</button>
            <button class="btn" disabled="{ $displayMode === 'categories' }" on:click="{() => { setDisplayMode('categories') }}">Categories</button>
          </div>
          <div class="grid grid-cols-3 gap-2 my-2">
            <button class="btn" disabled="{ $timeStatusMode === 'all' }" on:click="{() => setTimeStatusMode('all')}">
              All
            </button>
            <button class="btn" disabled="{ $timeStatusMode === 'safe' }" on:click="{() => setTimeStatusMode('safe')}">
              Safe
            </button>
            <button class="btn" disabled="{ $timeStatusMode === 'expired' }" on:click="{() => setTimeStatusMode('expired')}">
              Expired
            </button>
          </div>
          <div class="grid grid-cols-4 gap-2">
            <button class="btn whitespace-nowrap" disabled="{ $sortingMode === "alpha-ascending" }" on:click={() => setSortingMode('alpha-ascending')}>
              A <Icon icon="clarity:arrow-line" inline={true} style="display: inline-block; transform:rotate(90deg);" /> Z
            </button>
            <button class="btn whitespace-nowrap" disabled="{ $sortingMode === "alpha-descending" }" on:click={() => setSortingMode('alpha-descending')}>
              Z <Icon icon="clarity:arrow-line" inline={true} style="display: inline-block; transform:rotate(90deg);" /> A
            </button>
            <button class="btn whitespace-nowrap" disabled="{ $sortingMode === "endtime-ascending" }" on:click={() => setSortingMode('endtime-ascending')}>
              <Icon icon="clarity:clock-line" inline={true} style="display: inline-block;" />
              <Icon icon="clarity:arrow-line" inline={true} style="display: inline-block;" />
            </button>
            <button class="btn whitespace-nowrap" disabled="{ $sortingMode === "endtime-descending" }" on:click={() => setSortingMode('endtime-descending')}>
              <Icon icon="clarity:clock-line" inline={true} style="display: inline-block;" />
              <Icon icon="clarity:arrow-line" inline={true} style="display: inline-block; transform:rotate(180deg);" />
            </button>
          </div>
        </div>
      {/if}
      {#if searchMenuActive}
        <div transition:slide class="search-menu pb-4">
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
      <div class="add-item-menu">
        <AddItem on:add={addItems} active={addMenuActive} />
      </div>
    </div>
    <div class="items">
      {#if listings && listings.length}
        <div class="items-listing">
          {#if $displayMode === 'categories'}
            {#each listings as category}
              {#if category.items.length > 0}
                <CategorizedItems categories={categories} category={category} time={time} items={category.items} on:remove={removeItem} on:update={updateItem} />
              {/if}
            {/each}
          {:else}
          <div class="items-list">
            {#each listings as listing}
              <Item item={listing} time={time} categories={categories} on:remove={removeItem} on:update={updateItem} />
            {/each}
          </div>
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
  .items-list {
    border-top: 2px solid var(--gray);
  }
</style>