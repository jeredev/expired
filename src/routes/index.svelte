<script lang="ts" context="module">
  import type { Load } from "@sveltejs/kit"
  export const load: Load = async({ url, params, fetch, session, stuff, status, error }) => {
    const { user } = session
    if (user && user.id) {
      // if (!user.account) {

      // }
      if (user.account?.subscription_status === 'active') {
        let appendage = '?' + new URLSearchParams(url.searchParams)
        const itemsResponse = await fetch(`/api/items${appendage}`)
        const items = await itemsResponse.json()
        const categoriesResponse = await fetch('/api/categories')
        const categories = await categoriesResponse.json()
        return {
          props: {
            items,
            categories,
            user,
          },
          // stuff: {
          //   categories,
          // }
          // status: response.status,
        }
      }
      return {
        props: {
          user
        }
      }
    }
    else {
      return {
        props: {
          user
        }
      }
    }
  }
</script>
<script lang="ts">
  import { page, session } from "$app/stores"
  import { afterNavigate, goto, invalidate } from '$app/navigation'
  import { onMount } from "svelte"

  import { fade, slide } from 'svelte/transition'
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
    subYears,
    subMonths,
    subWeeks,
    subDays,
    subHours,
    subMinutes,
  } from 'date-fns'

  import AddItem from "../components/AddItem.svelte"
  import CategorizedItems from "../components/CategorizedItems.svelte"
  import CategoryBar from "../components/CategoryBar.svelte"
  import Item from "../components/Item.svelte"
  import Messenger from "../components/Messenger.svelte"
  import { displayMode, sortingMode, timeStatusMode, message, time } from "../stores"

  export let categories: Array<CategoryProps>

  // export let categoriesFetched: Array<CategoryProps> | null = null
  // console.log(categoriesFetched)
  // categories.set(categoriesFetched)

  // categories.subscribe(value => {
  //   console.log('subscribe!')
  //   console.log(value)
  // })
  
  // setContext('categories', categories)
  // export let items: Array<ItemProps> | null = null
  // let items: Array<ItemProps> | null = null
  export let items: Array<ItemProps> = []
  export let user: App.Session['user']

  const isItemsURL = (dep: string) => dep.includes('/api/items')

  let listings: any[] | null = null

  let email: string
  let password: string

  let addMenuActive = false
  let categoriesMenuActive = false
  let searchMenuActive = false
  let sortingMenuActive = false

  let addMenu = {}
  let categoriesMenu = {}
  let searchMenu = {}
  let sortingMenu = {}

  // addMenu.active = false
  // categoriesMenu.active = false
  // searchMenu.active = false
  // sortingMenu.active = false

  // let menus = [addMenu, categoriesMenu, searchMenu, sortingMenu]

  // function openMenu(target) {
  //   menus.forEach((menu) => {
  //     if (target === menu) {
  //       target.active = false
  //     }
  //     else {
  //       target.active = true
  //     }
  //   })
  // }

  let statusProcessing = false

  // let loginProcessing = false
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
      if (!res.ok) {
        const error = await res.json()
        console.log(error)
        message.set({
          text: `Error: ${error.message}`,
          timed: true
        })
      }
      if (res.ok) {
        const data = await res.json()
        if (data && data.role === 'authenticated') {
          session.set({ user: data })
          message.set({
            text: `Login successful.`,
            timed: true
          })
          if ($session && $session.user && $session.user.account?.subscription_status === 'active') {
            categories = await getCategories()
            // clock = window.setInterval(runClock, 1000)
            items = await getItems(searchQuery as URLSearchParams)
            generateListings()
          }
        }
      }
    }
    catch(e) {
      console.log(e)
      message.set({
        text: `Error: ${e}`,
        timed: true
      })
    }
    statusProcessing = false
  };

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
        message.set({
          text: `Error: ${error.message}`,
          timed: true
        })
      }
      if (res.ok) {
        // items = null // Still doesn't work
        listings = null
        session.set({ user: null }),
        message.set({
          text: `Logout successful.`,
          timed: true
        })
      }
    }
    catch(e) {
      console.log(e)
      message.set({
        text: `Error: ${e}`,
        timed: true
      })
    }
    statusProcessing = false
  };

  const addItems = async(e: CustomEvent) => {
    const newItems = e.detail
    categories = await getCategories() // In the case that a new category was created when the item was added
    newItems.forEach(async(item: ItemProps) => {
      items.push(item)
    })
    generateListings()
  }

  const removeItem = (e: CustomEvent) => {
    if (items) {
      items = items.filter((item: ItemProps) => item.id !== e.detail.id)
      generateListings()
    }
  }

  const updateItem = (e: CustomEvent) => {
    const updatedItem = e.detail
    if (items) {
      items.map(() => {
        const item = items.find(({ id }) => id === updatedItem.id);
        return item ? item : updatedItem;
      });
      generateListings()
    }
  }

  const resetPwd = async() => {
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
        message.set({
          text: `Error: ${error.message}`,
          timed: true
        })
        console.log('error initiating reset:', error)
        return
      }
      if (res.ok) {
        resetRequestSuccessful = true
      }
    }
  }

  // let clock: number
  // const runClock = () => {
  //   time = new Date().getTime()
  //   timeClock.set(time)
  // }

  /* Sorting */
  const getLifespan = (startTime: Date, endTime: Date) => {
    return new Date(endTime).getTime() - new Date(startTime).getTime()
  }
  const getTimeElapsed = (startTime: Date) => {
    return $time - new Date(startTime).getTime()
  }
  const filterAll = () => {
    listings = items
  }
  const filterSafe = (payload: Array<ItemProps>) => {
    listings = payload.filter((item: ItemProps) => {
      let timeElapsed = getTimeElapsed(item.startTime)
      let lifespan = getLifespan(item.startTime, item.endTime)
      return timeElapsed < lifespan
    })
  }
  const filterExpired = (payload: Array<ItemProps>) => {
    listings = payload.filter((item: ItemProps) => {
      let timeElapsed = getTimeElapsed(item.startTime)
      let lifespan = getLifespan(item.startTime, item.endTime)
      return timeElapsed > lifespan
    })
  }
  const sortAlphaAsc = (payload: Array<ItemProps>) => {
    return payload.sort((a: ItemProps, b: ItemProps) => a.name.localeCompare(b.name))
  }
  const sortAlphaDesc = (payload: Array<ItemProps>) => {
    return payload.sort((a: ItemProps, b: ItemProps) => b.name.localeCompare(a.name))
  }
  const sortCatsAlphaAsc = (payload: Array<CategoryProps>) => {
    return payload.sort((a: CategoryProps, b: CategoryProps) => a.name.localeCompare(b.name))
  }
  const sortEndtimeAsc = (payload: Array<ItemProps>) => {
    return payload.sort((a: ItemProps, b: ItemProps) => {
      return new Date(b.endTime).getTime() - new Date(a.endTime).getTime()
    })
  }
  const sortEndtimeDesc = (payload: Array<ItemProps>) => {
    return payload.sort((a: ItemProps, b: ItemProps) => {
      return new Date(a.endTime).getTime() - new Date(b.endTime).getTime()
    })
  }

  const search = {
    name: '',
    endTime: '',
    endRelatively: {
      years: 0,
      months: 0,
      weeks: 0,
      days: 0,
      hours: 0,
      minutes: 0,
    },
    category: ''
  }

  let searchQueryValid = true

  const checkSearchValidity = () => {
    if (/([^\s])/.test(search.name) || /([^\s])/.test(search.endTime) || /([^\s])/.test(search.category)) {
      searchQueryValid = true
    }
    else {
      searchQueryValid = false
      // searchQueryValid = true
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

      if (subYears(new Date(endTime), differenceInYears(endTime, startTime)) < startTime) {
        search.endRelatively.years = 0
      }
      else {
        search.endRelatively.years = differenceInYears(endTime, startTime)
        endTime = subYears(new Date(endTime), differenceInYears(endTime, startTime))
      }
      if (subMonths(new Date(endTime), differenceInMonths(endTime, startTime)) < startTime) {
        search.endRelatively.months = 0
      }
      else {
        search.endRelatively.months = differenceInMonths(endTime, startTime)
        endTime = subMonths(new Date(endTime), differenceInMonths(endTime, startTime))
      }
      if (subWeeks(new Date(endTime), differenceInWeeks(endTime, startTime)) < startTime) {
        search.endRelatively.weeks = 0
      }
      else {
        search.endRelatively.weeks = differenceInWeeks(endTime, startTime)
        endTime = subWeeks(new Date(endTime), differenceInWeeks(endTime, startTime))
      }

      // search.endRelatively.years = differenceInYears(endTime, startTime)
      // endTime = subYears(new Date(endTime), search.endRelatively.years)
      // search.endRelatively.months = differenceInMonths(endTime, startTime)
      // endTime = subMonths(new Date(endTime), differenceInMonths(endTime, startTime))
      // search.endRelatively.weeks = differenceInWeeks(endTime, startTime)
      // endTime = subWeeks(new Date(endTime), differenceInWeeks(endTime, startTime))
      // search.endRelatively.days = differenceInDays(endTime, startTime)
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

  let searching = false

  const searchItems = async() => {
    searching = true
    searchQuery.name = search.name
    searchQuery.end = search.endTime
    searchQuery.cat = search.category
    searchMenuActive = false
    listings = null
    await invalidate(isItemsURL)
    const url = $page.url
    const queryString = new URLSearchParams(searchQuery as URLSearchParams).toString()
    goto(`${url.origin}?${queryString}`)
  }

  const sortItems = (payload: Array<ItemProps>) => {
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

  const sortByTimeStatus = (payload: Array<ItemProps>) => {
    switch ($timeStatusMode) {
      case 'all':
        filterAll()
        break
      case 'safe':
        filterSafe(payload)
        break
      case 'expired':
        filterExpired(payload)
        break
    }
  }

  const setDisplayMode = (mode: string) => {
    displayMode.set(mode)
    generateListings()
  }

  const setSortingMode = (mode: string) => {
    sortingMode.set(mode)
    generateListings()
  }

  const setTimeStatusMode = (mode: string) => {
    timeStatusMode.set(mode)
    generateListings()
  }

  const getCategories = async() => {
    const res = await fetch('/api/categories')
    if (!res.ok) {
      const error = await res.json()
      console.log('error with getCategories():')
      console.log(error)
      message.set({
        text: `Error: ${error.message}`,
        timed: true
      })
    }
    if (res.ok) {
      return await res.json()
    } 
  }

  const generateListings = () => {
    // console.log('generating')
    if ($displayMode === 'categories') {
      categorizeItems()
    }
    else {
      listItems()
    }
  }

  const categorizeItems = () => {
    if (items) {
      listings = items
      let categorizedItems: any[] = []
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
      sortByTimeStatus(listings)
      listings.forEach((item: ItemProps) => {
        if (item.category) {
          const found = categorizedItems.find(element => element.id === item.category?.id)
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
  }

  const listItems = () => {
    listings = items
    sortByTimeStatus(items)
    sortItems(listings)
  }

  const getItems = async(query: URLSearchParams) => {
    let appendage = ''
    if (query) {
      appendage = '?' + new URLSearchParams(query)
    }
    const res = await fetch('/api/items' + appendage)
    if (!res.ok) {
      const error = await res.json()
      // console.log('error from getItems():')
      // console.log(error)
      message.set({
        text: `Error: ${error.message}`,
        timed: true
      })
    }
    if (res.ok) {
      return await res.json()
    }
  }

  // DRY and move this
  interface searchQueryProps {
    name?: string,
    end?: string,
    cat?: string
  }
  const searchQuery: searchQueryProps = {}

  let addingCategory = false
  let newCategory: string
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
    const formData = new FormData()
    formData.append('name', newCategory.trim())
    const res = await fetch('/api/categories', {
      method: 'POST',
      body: formData
    })
    if (!res.ok) {
      console.log('!res.ok')
      const error = await res.json()
      console.log(error)
      message.set({
        text: `Error: ${error}`,
        timed: true
      })
      // console.log('error adding new category:', error)
      return
    }
    if (res.ok) {
      const processed = await res.json()
      const returnedCategory = processed[0]

      if (categories) {
        categories = [...categories, returnedCategory]
        categories = sortCatsAlphaAsc(categories)
      }

      generateListings()
      newCategory = ''
      addingCategory = false
    }
  }

  const removeCategory = (e: CustomEvent) => {
    if (categories) {
      categories = categories.filter((category: CategoryProps) => category.id !== e.detail.id)
      generateListings() // Why?
    }
  }

  const updateCategory = (e: CustomEvent) => {
    if (categories) {
      const indexCategories = categories.findIndex((x: CategoryProps) => x.id === e.detail.id)
      if ( indexCategories !== -1) {
        categories[indexCategories].name = e.detail.name
      }
      generateListings()
    }
  }

  if ($page.url.searchParams.get('name')) {
    const name = $page.url.searchParams.get('name')!
    searchQuery.name = name
    search.name = name
  }
  if ($page.url.searchParams.get('end')) {
    const end = $page.url.searchParams.get('end')!
    searchQuery.end = end
    search.endTime = end
  }
  if ($page.url.searchParams.get('cat')) {
    const cat = $page.url.searchParams.get('cat')!
    searchQuery.cat = cat
    search.category = cat
  }
  
  let forgot = false
  let loginValid = false
  let resetPwdValid = false
  let resetRequestSuccessful = false

  const checkLoginValidity = () => {
    if (/([^\s])/.test(email)) {
      resetPwdValid = true
    }
    else {
      resetPwdValid = false
    }
    if (email && password && /([^\s])/.test(email) && /([^\s])/.test(password)) {
      loginValid = true
    }
    else {
      loginValid = false
    }
  }

  function goBack() {
    listings = null
    if (searching === true) {
      history.back()
    }
    else {
      searching === false
      goto('/')
    }
  }

  // Speech Recognition
  let recognition: any = false
  let recognizing = false
  const listenForName = () => { 
    if (recognition) {
      recognition.abort() // Unsure :: InvalidStateError: Failed to execute 'start' on 'SpeechRecognition': recognition has already started.
      recognition.start()
      recognition.addEventListener('result', (e: any) => {
        let text = Array.from(e.results)
          //@ts-ignore
          .map(result => result[0])
          .map(result => result.transcript)
          .join('')
        if (text) {
          search.name = camelize(text)
        }
        recognition.stop()
      })
      recognition.onstart = function () {
        recognizing = true
      }
      recognition.onend = function () {
        recognizing = false
      }
    }
  }

  function camelize(str: string) {
    return str.replace(/[^\s]+/g, function(word) {
      return word.replace(/^./, function(first) {
        return first.toUpperCase();
      });
    });
  }

  function clearSearchExpirationEntry() {
    search.endTime = ''
    updateEndTimeRelativity()
  }

  afterNavigate(async() => {
    listings = null
    if ($page.url.searchParams.get('name') === null) {
      search.name = ''
      searchQuery.name = ''
    }
    if ($page.url.searchParams.get('end') === null) {
      search.endTime = ''
      searchQuery.end = ''
    }
    if ($page.url.searchParams.get('cat') === null) {
      search.category = ''
      searchQuery.cat = ''
    }
    if (items) {
      generateListings()
    }
  })

  onMount(async() => {
    if (items && items.length && listings === null) {
      generateListings()
    }
    const SpeechRecognition = (<any>window).SpeechRecognition || (<any>window).webkitSpeechRecognition
    if (SpeechRecognition) {
      recognition = new SpeechRecognition()
    }
  })
</script>

<div class="decay mx-auto max-w-50rem p-4 text-white">
  <Messenger />
  <div class="header">
    {#if !user}
      <form on:submit|preventDefault={logIn} class="form form--login">
        {#if forgot}
          <div transition:slide class="pb-4">
            <h1 class="mb-4" style="font-family: 'Inter', sans-serif; font-size: 2rem; font-weight: 400;">Reset your password</h1>
            <p style="font-family: 'Recursive', sans-serif; font-size: 90%;">Enter the email address associated with your account and you'll receive a link to reset your password.</p>
          </div>
        {/if}
        <div class="login-form-area">
          <div class="login-form-fields" class:forgot-mode={forgot}>
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
            {#if !forgot}
              <div class="form-field">
                <div class="label-field">
                  <label for="login-password">Password</label>
                  <div class="forgot" on:click={() => { forgot = true }}>Forgot?</div>
                </div>
                <input
                  bind:value="{password}"
                  on:input="{checkLoginValidity}"
                  type="password"
                  id="login-password"
                  autocomplete="current-password" 
                  class="bg-black text-white p-2 w-full"
                > 
              </div>
            {/if}
          </div>
          <div class="form-actions mt-4">
            {#if forgot}
              <button on:click={resetPwd} type="button" class="btn" disabled={!resetPwdValid}>
                Reset
              </button>
              <button on:click={() => { forgot = false }} type="button" class="btn ml-2">
                Cancel
              </button>
            {:else}
              <button type="submit" class="btn" disabled="{statusProcessing || !loginValid}">
                Login
              </button>
            {/if}
          </div>
        </div>
        {#if resetRequestSuccessful}
          <div transition:fade class="mt-2">
            <h2>Check your email for instructions to reset your password.</h2>
            <p>If you haven't received an email in 5 minutes, check your spam or resubmit the form.</p>
          </div>
        {/if}
      </form>
    {/if}
  </div>
  {#if user && user.account}
    <div class="controls mb-2 flex">
      <a href="/profile" class="btn ml-2">
        <Icon icon="clarity:avatar-solid" />
      </a>
      <button on:click={logOut} class="btn ml-2" disabled="{statusProcessing}">
        <Icon icon="clarity:logout-solid" />
      </button>
    </div>
  {/if}
  {#if user && user.account && user.account.subscription_status === 'active'}
    <div class="homebase"> <!-- Necessary? -->
      <div class="controls pb-4 flex">
        {#if $page.url.searchParams.get('name') || $page.url.searchParams.get('end') || $page.url.searchParams.get('cat')}
          <button class="btn" on:click="{goBack}">
            <Icon icon="clarity:arrow-line" style="display: inline; transform: rotate(-90deg);" />
          </button>
        {/if}
        <div class="panel flex justify-end">
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
        </div>
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
            {#if categories}
              {#each categories as category (category.id)}
                <CategoryBar category="{category}" on:updateCategory={updateCategory} on:removeCategory={removeCategory} />
              {/each}
            {/if}
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
          <form on:submit|preventDefault={searchItems} class="search">
            <div class="form-field my-2">
              <label for="search-items--text">Name</label>
              {#if recognition}
                <button type="button" class="btn ml-2 px-2 py-1" class:recognizing = {recognizing} on:click="{listenForName}">
                  <Icon icon="clarity:microphone-line" />
                </button>
              {/if}
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
                {#if search.endTime}
                  <button on:click="{clearSearchExpirationEntry}" class="btn">Clear</button>
                {/if}
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
                <CategorizedItems categories={categories} category={category} items={category.items} on:remove={removeItem} on:update={updateItem} />
              {/if}
            {/each}
          {:else}
          <div class="items-list">
            {#each listings as listing}
              <Item item={listing} categories={categories} on:remove={removeItem} on:update={updateItem} />
            {/each}
          </div>
        {/if}
        </div>
      {:else if listings && listings.length < 1}
        <p>No items found</p>
      {:else}
        <div class="py-8 relative">
          <div class="elapser">
            <div class="indication"><div class="node"></div>
            </div>
          </div>
        </div>
      {/if}
    </div>
  {:else if user && user.account && user.account.subscription_status !== 'active'}
    <p>Account inactive. Please <a href="/profile">reactivate your account</a> here.</p>
  <!-- Can this else if below really occur? -->
  {:else if user && !user.account}
    <p>No account found.</p>
  {:else}
    <div class="py-4 text-center">Authorized users only.</div>
  {/if}
</div>

<style>
  .label-field {
    align-items: flex-end;
    display: flex;
    justify-content: space-between;
  }
  .forgot {
    color: var(--red);
    cursor: pointer;
    font-size: 90%;
  }
  /* .login-form-fields {
    transition: .3s ease;
  } */
  .login-form-fields input:focus-visible {
    /* outline: 5px solid var(--red); */
    filter: drop-shadow(0 0 0.125rem #fff);
  }
  .login-form-fields label {
    font-family: 'Inter', sans-serif;
    font-size: 90%;
  }
  .form-field input:focus-visible, .form-field select:focus-visible {
    filter: drop-shadow(0 0 0.125rem #fff);
    outline: 1px solid #fff;
  }
  @media only all and (min-width: 40em) {
    .login-form-fields {
      align-items: flex-end;
      display: grid;
      grid-gap: 1rem;
      grid-template-columns: 1fr 1fr;
    }
    .login-form-fields.forgot-mode {
      display: grid;
      grid-gap: 1rem;
      grid-template-columns: 1fr;
      margin-top: 0.5rem;
    }
    .login-form-area {
      display: grid;
      grid-gap: 1rem;
      grid-template-columns: 1fr min-content;
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
  .controls {
    justify-content: flex-end;
  }
  .panel {
    flex: 1;
  }
  .unit-form-fields {
    display: grid;
    gap: 0.5rem;
    grid-template-columns: repeat(4, 1fr);
  }
  .unit-form-fields label {
    font-size: 80%;
  }
  .form-actions {
    align-items: flex-end;
    display: flex;
  }
  .form-actions .btn {
    padding-bottom: 0.5rem;
    padding-top: 0.5rem;
  }

  .elapser {
    background-color: var(--gray);
    height: 2px;
    position: absolute;
    width: 40%;
    z-index: -1;
    left: 30%;
    top: 50%;
    transform: translateY(-50%);
  }
  .elapser .indication {
    height: 100%;
    transform-origin: left;
    position: relative;
    width: 100%;
  }
  .elapser .indication .node {
    width: 100%;
    position: absolute;
    height: 100%;
    animation: looped-elapser 1.5s linear infinite;
    transform-origin: left;
  }
  .elapser .indication .node::before {
    background-color: #fff;
    content: '';
    display: block;
    filter: drop-shadow(0 0 0.5rem white);
    width: 20%;
    position: absolute;
    right: 0;
    height: 100%;
  }
  @keyframes looped-elapser {
    50%, 100% {
      transform: scaleX(0);
    }
  }
</style>