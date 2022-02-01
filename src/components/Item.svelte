<script lang="ts">
  import { supabase, user } from "$lib/db";
  import { afterUpdate, createEventDispatcher, onDestroy, onMount } from "svelte";
  import { slide } from 'svelte/transition';
  import Icon from '@iconify/svelte'
  import { message } from "../stores";
  import {
    formatDistanceToNowStrict,
    getTime,
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

  export let categories
  export let item
  export let time

  item.image = null

  item.edits = {
    name: item.name,
    category: {},
    startTime: format(new Date(item.startTime), 'yyyy-MM-dd\'T\'HH:mm'),
    endTime: format(new Date(item.endTime), 'yyyy-MM-dd\'T\'HH:mm'), 
    endRelatively: {
      years: null,
      months: null,
      weeks: null,
      days: null,
      hours: null,
      minutes: null,
    }
  }

  if (item.category) {
    item.edits.category = item.category
  }
  else {
    item.edits.category = {}
    item.edits.category.id = null
  }

  let itemElement
  let menuVisible = false

  const dispatch = createEventDispatcher();

  const getLifespan = (startTime, endTime) => {
    return getTime(new Date(endTime)) - getTime(new Date(startTime))
  }
  const getTimeElapsed = (startTime) => {
    return time - getTime(new Date(startTime))
  }
  const removeItem = async() => {
    const { data, error } = await supabase
      .from('items')
      .delete()
      .match({ id: item.id })
    if (error) {
      // console.log('error', error)
      return
    }
    if (data) {
      if (data[0] && data[0].imagePath) {
        const fromPath = `${$user.id}/${data[0].imagePath}`
        // Ideally, this should be done behind the scenes or in a housekeeping like fashion // Worked
        await supabase
          .storage
          .from('Decay')
          .remove([fromPath])
      }
      menuVisible = false
      dispatch('remove', item)
      message.set('Item successfully deleted.')
    }
  }
  const getTimeBar = () => {
    let timeElapsed = getTimeElapsed(item.startTime)
    let lifespan = getLifespan(item.startTime, item.endTime)
    let timeLeft = lifespan - timeElapsed
    if (timeLeft < 0) {
      return 'transform: translateX(-100%)'
    }
    else {
      let percentLeft = `-${(timeElapsed / lifespan) * 100}%`
      let percentLeftCSS = `transform: translateX(${percentLeft})`
      return percentLeftCSS
    }
  }
  const getTimeRemainder = () => {
    let timeElapsed = getTimeElapsed(item.startTime)
    let lifespan = getLifespan(item.startTime, item.endTime)
    if (timeElapsed > lifespan) {
      return 'Expired'
    }
    else {
      // console.log(`running timeRemainder :: time is ${time}`)
      let timeRemaining = lifespan - timeElapsed + time
      let timeReported = formatDistanceToNowStrict(timeRemaining)
      return timeReported
    }
  }
  let timeBar = getTimeBar()
  let timeRemainder = getTimeRemainder()
  const getItemImage = async (path) => {
    // console.log('getItemImage :: fetching from supabase')
    const { data, error } = await supabase
      .storage
      .from('Decay')
      .download(path)
    if (data) return URL.createObjectURL(data)
    if (error) {
      console.log(error)
      console.log(path)
    }
  }
  const buildItemImage = async (path) => {
    const imagePath = $user.id + "/" + item.imagePath
    item.image = await getItemImage(imagePath)
  }
  const io = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.intersectionRatio > 0) {
        entry.target.classList.remove('unset')
        io.unobserve(entry.target)
      }
    })
  },
  {
    root: null,
    rootMargin: '0px',
    threshold: [0],
  })

  let updateValid = false
  const checkUpdateValidity = () => {
    if (/([^\s])/.test(item.edits.name) && new Date(item.edits.endTime) > new Date(item.edits.startTime)) {
      updateValid = true
      return true
    } else {
      updateValid = false
      return false
    }
  }

  const deleteImage = async() => {
    if (item.imagePath && $user.id) {
      const fromPath = `${$user.id}/${item.imagePath}`
      const { data, error } = await supabase
        .storage
        .from('Decay')
        .remove([fromPath])
      if (error) {
        // console.log(error)
      }
      if (data && data.length > 0) {
        // Edit item to remove imagePath
        const { error } = await supabase
          .from('items')
          .update({ imagePath: null })
          .match({ id: item.id })
        item.imagePath = null
        item.image = null
        if (error) {
          // console.log('error', error)
          return
        }
        else message.set('Successfully deleted item image.')
      }
    }
  }

  const updateItem = async () => {
    const { data, error } = await supabase
      .from('items')
      .update({
        name: item.edits.name,
        startTime: item.edits.startTime,
        endTime: item.edits.endTime,
        category: item.edits.category.id,
      })
      .match({ id: item.id })
    if (error) {
      // console.log('error', error)
      return
    }
    if (data && data[0]) {
      item.name = data[0].name
      item.startTime = data[0].startTime
      item.endTime = data[0].endTime
      item.edits.name = data[0].name
      item.edits.category.id = data[0].category
      // Find category name
      const categoryName = categories.find((category) => category.id === item.edits.category.id)
      item.edits.category.name = categoryName
      item.edits.startTime = format(new Date(data[0].startTime), 'yyyy-MM-dd\'T\'HH:mm')
      item.edits.endTime = format(new Date(data[0].endTime), 'yyyy-MM-dd\'T\'HH:mm')
      // editItem.category = data[0].category
      updateEndTimeRelativity()
      menuVisible = false
      dispatch('update', item)
      message.set('Item updated.')
    }
  }

  let confirmDelete = false

  let fileInput
  let file
  let itemImagePreview
  const addImage = async() => {
    if (file) {
      const { data, error } = await supabase
        .storage
        .from('Decay')
        .upload(`${$user.id}/${item.id}`, file)
      if (error) {
        console.log('error below:')
        console.log(error)
      }
      if (data.Key) {
        const { error } = await supabase
          .from('items')
          .update({ imagePath: item.id })
          .match({ id : item.id })
        if (error) {
          console.log('error', error)
          return
        }
        file = null
        fileInput = null
        itemImagePreview = null
        menuVisible = false
        message.set('Successfully added image to item.')
        item.imagePath = `${item.id}`
        buildItemImage(item.imagePath)
      }
    }
    
  }
  const analyzeFile = () => {
    file = fileInput.files[0]
    if (file) {
      itemImagePreview = URL.createObjectURL(file)
    }
    else {
      itemImagePreview = null
    }
  }

  const updateEndTimeRelatively = () => {
    if (item.edits.endTime) {
      let adjTime = new Date(item.edits.startTime)
      if (item.edits.endRelatively.years)
        adjTime = addYears(adjTime, item.edits.endRelatively.years)
      if (item.edits.endRelatively.months)
        adjTime = addMonths(adjTime, item.edits.endRelatively.months)
      if (item.edits.endRelatively.weeks)
        adjTime = addWeeks(adjTime, item.edits.endRelatively.weeks)
      if (item.edits.endRelatively.days)
        adjTime = addDays(adjTime, item.edits.endRelatively.days)
      if (item.edits.endRelatively.hours)
        adjTime = addHours(adjTime, item.edits.endRelatively.hours)
      if (item.edits.endRelatively.minutes)
        adjTime = addMinutes(adjTime, item.edits.endRelatively.minutes)
        item.edits.endTime = format(new Date(adjTime), 'yyyy-MM-dd\'T\'HH:mm')
    }
    checkUpdateValidity()
  }

  const updateEndTimeRelativity = () => {
    const startTime = new Date(item.edits.startTime)
    if (item.edits.endTime) {
      let endTime = new Date(item.edits.endTime)
      item.edits.endRelatively.years = differenceInYears(endTime, startTime)
      endTime = subYears(new Date(endTime), item.edits.endRelatively.years)
      item.edits.endRelatively.months = differenceInMonths(endTime, startTime)
      endTime = subMonths(new Date(endTime), differenceInMonths(endTime, startTime))
      item.edits.endRelatively.weeks = differenceInWeeks(endTime, startTime)
      endTime = subWeeks(new Date(endTime), differenceInWeeks(endTime, startTime))
      item.edits.endRelatively.days = differenceInDays(endTime, startTime)
      endTime = subDays(new Date(endTime), differenceInDays(endTime, startTime))
      item.edits.endRelatively.hours = differenceInHours(endTime, startTime)
      endTime = subHours(new Date(endTime), differenceInHours(endTime, startTime))
      item.edits.endRelatively.minutes = differenceInMinutes(endTime, startTime)
      endTime = subMinutes(new Date(endTime), differenceInMinutes(endTime, startTime))
      checkUpdateValidity()
    }
    else {
      item.edits.endRelatively.years = 0
      item.edits.endRelatively.months = 0
      item.edits.endRelatively.weeks = 0
      item.edits.endRelatively.days = 0
      item.edits.endRelatively.hours = 0
      item.edits.endRelatively.minutes = 0
    }
  }
  afterUpdate(() => {
    // alert('after update')
    if (item.imagePath && !item.image) {
      buildItemImage(item.imagePath)
    }
  })
  onMount(() => {
    updateEndTimeRelativity()
    checkUpdateValidity()
    if (item.imagePath && !item.image) {
      buildItemImage(item.imagePath)
    }
    if (itemElement) {
      io.observe(itemElement)
    }
  })
  onDestroy(() => {
    if (itemElement) {
      io.unobserve(itemElement)
    }
  })
  // Reactivity to Time
  $: {
    if (time) {
      timeBar = getTimeBar()
      timeRemainder = getTimeRemainder()
    }
  }
</script>

<div bind:this="{itemElement}" class="item unset">
  <div class="item-internal grid gap-4 py-4">
    <div class="item__aside">
      <div class="image-block">
        {#if item.image}
          <img 
            src="{item.image}" 
            alt="{item.name}" 
            class="item-image"
          >
          {#if menuVisible}
            <button class="btn leading-tight negative mt-4 flex justify-center w-full" on:click="{deleteImage}">
              <Icon icon="clarity:trash-line" />
            </button>
          {/if}
        {:else}
          <div class="image-upload-region">
            {#if itemImagePreview}
              <img v-if="uploadReady === true" src="{itemImagePreview}" alt="" />
              <button class="btn my-4 w-full" on:click="{addImage}">
                Save
              </button>
            {/if}
            <div class="file-input-region overflow-hidden">
              <div class="form-field">
                <input
                  bind:this={fileInput}
                  id="new-item--file"
                  type="file"
                  accept="image/*"
                  class="file-input"
                  capture
                  on:change="{analyzeFile}"
                >
              </div>
            </div>

          </div>
        {/if}
      </div>
    </div>
    <div class="item__main">
      <div class="item__main-wrapper">
        <div class="item-title-area grid gap-8 pb-4">
          <div class="item-title">
            {item.name}
          </div>
          <aside>
            <button class="btn" on:click="{() => menuVisible = !menuVisible}">
              Menu
            </button>
          </aside>
        </div>
        <div class="item-menu-wrapper">
          {#if menuVisible}
            <div transition:slide class="item-menu pb-4">
              <div class="menu-area">
                <div class="area area--name">
                  <div class="form-field mb-2">
                    <label for="edit-{item.id}--name" class="block">Change Item Name</label>
                    <input type="text" id="edit-{item.id}--name" class="bg-black p-2 text-white w-full" bind:value="{item.edits.name}" on:input="{checkUpdateValidity}" />
                  </div>
                </div>
                <div class="area area--category">
                  <div class="form-field mb-2">
                    <label for="edit-{item.id}--category" class="block">Category</label>
                    <select name="" id="" class="bg-black p-2 text-white w-full" bind:value="{item.edits.category.id}">
                      {#each categories as category}
                        <option value="{category.id}">{category.name}</option>
                      {/each}
                    </select>
                    <!-- <input type="text" id="edit-{item.id}--category" class="bg-black p-1 text-white" bind:value="{editedCategory.name}" /> -->
                  </div>
                </div>
                <div class="area area--start-time">
                  <div class="form-field mb-2">
                    <label for="" class="block">Start Time</label>
                    <div class="relative">
                      <input
                        bind:value="{item.edits.startTime}"
                        type="datetime-local"
                        pattern="[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}"
                        required
                        style="background-color: black; color: white;"
                        class="px-2 py-1 w-full"
                        on:change="{updateEndTimeRelativity}"
                      >
                    </div>
                  </div>
                  <div class="area area--end-time">
                    <div class="form-field mb-2">
                      <label for="" class="block">End Time</label>
                      <div class="relative">
                        <input
                          bind:value="{item.edits.endTime}"
                          type="datetime-local"
                          pattern="[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}"
                          required
                          style="background-color: black; color: white;"
                          class="px-2 py-1 w-full"
                          on:change="{updateEndTimeRelativity}"
                        >
                      </div>
                    </div>
                  </div>
                  <div class="area area--end-time mb-2">
                    <form>
                      <fieldset>
                        <div class="unit-form-fields">
                          <div class="form-field grid gap-4 mb-2">
                            <label for="edit-{item.id}--endtime-years">Years</label>
                            <input type="number" min="0" class="bg-black p-1 text-white" id="edit-{item.id}--endtime-years" bind:value="{item.edits.endRelatively.years}" on:input="{updateEndTimeRelatively}" />
                          </div>
                          <div class="form-field grid gap-4 mb-2">
                            <label for="edit-{item.id}--endtime-months">Months</label>
                            <input type="number" min="0" class="bg-black p-1 text-white" id="edit-{item.id}--endtime-months" bind:value="{item.edits.endRelatively.months}" on:input="{updateEndTimeRelatively}" />
                          </div>
                          <div class="form-field grid gap-4 mb-2">
                            <label for="edit-{item.id}--endtime-weeks">Weeks</label>
                            <input type="number" min="0" class="bg-black p-1 text-white" id="edit-{item.id}--endtime-weeks" bind:value="{item.edits.endRelatively.weeks}" on:input="{updateEndTimeRelatively}" />
                          </div>
                          <div class="form-field grid gap-4 mb-2">
                            <label for="edit-{item.id}--endtime-days">Days</label>
                            <input type="number" min="0" class="bg-black p-1 text-white" id="edit-{item.id}--endtime-days" bind:value="{item.edits.endRelatively.days}" on:input="{updateEndTimeRelatively}" />
                          </div>
                          <div class="form-field grid gap-4 mb-2">
                            <label for="edit-{item.id}--endtime-hours">Hours</label>
                            <input type="number" min="0" class="bg-black p-1 text-white" id="edit-{item.id}--endtime-hours" bind:value="{item.edits.endRelatively.hours}" on:input="{updateEndTimeRelatively}" />
                          </div>
                          <div class="form-field grid gap-4 mb-2">
                            <label for="edit-{item.id}--endtime-minutes">Minutes</label>
                            <input type="number" min="0" class="bg-black p-1 text-white" id="edit-{item.id}--endtime-minutes" bind:value="{item.edits.endRelatively.minutes}" on:input="{updateEndTimeRelatively}" />
                          </div>
                        </div>
                      </fieldset>
                    </form>
                  </div>
                  {#if !updateValid}
                    <div class="py-2">Invalid</div>
                  {/if}
                  <div class="area area--remove">
                    <button type="button" class="btn edit-item" on:click="{updateItem}" disabled="{!updateValid}">
                      Update Item
                    </button>
                    <button type="button" class="btn remove-item mx-2 negative" on:click={() => { confirmDelete = !confirmDelete }}>
                      Delete Item
                    </button>
                    {#if confirmDelete}
                      <div transition:slide class="mt-4">
                        Delete this item?
                        <button class="btn negative" on:click="{removeItem}">
                          Yes
                        </button>
                        <button class="btn mx-2" on:click="{() => { confirmDelete = false }}">
                          No
                        </button>
                      </div>
                    {/if}
                  </div>
                </div>
              </div>
            </div>
          {/if}
        </div>
      </div>
      <div class="timer">
        <div class="timer__bar">
          <div class="measure" style="{ timeBar }"></div>
          <div class="timer__remainder">
            { timeRemainder }
          </div>
        </div>
      </div>
    </div>
  </div>
</div>

<style>
  .item {
    border-top: 2px solid var(--gray);
  }
  .item-internal {
    grid-template-columns: 100px 1fr;
  }
  .item-title-area {
    grid-template-columns: 1fr max-content;
  }
  .form-field {
    grid-template-columns: max-content 1fr;
  }
  .item-image {
    opacity: 1;
    transition: 400ms opacity;
  }
  .unset .item-image {
    opacity: 0;
  }
  /* Refactor This Copy Pasta Below: */
  .item__main {
    display: flex;
    flex-direction: column;
    justify-content: space-between;
  }
  .timer {
    margin-top: 1rem;
    position: relative;
  }
  .timer__bar {
    font-size: 90%;
    overflow: hidden;
    padding: 0.125rem 0.25rem;
    position: relative;
    width: 100%;
  }
  .timer__bar .measure {
    background-color: #f8feff;
    clip-path: polygon(0% 0%, calc(100% - 1rem) 0%, 100% 100%, 0 100%);
    height: 1rem;
    transform-origin: left;
    position: relative;
    transition: transform 400ms;
    width: 100%;
  }
  .unset .timer__bar .measure {
    transform: translateX(0) !important;
  }
  .timer__bar:before {
    border: 1px solid white;
    content: '';
    display: block;
    inset: 0;
    pointer-events: none;
    position: absolute;
  }
  .timer__bar .measure {
    background-color: #f8feff;
    clip-path: polygon(0% 0%, calc(100% - 1rem) 0%, 100% 100%, 0 100%);
    height: calc(100% + 2px);
    transform-origin: left;
    position: absolute;
    top: -1px;
    left: 0;
    transition: transform 400ms;
    width: 100%;
  }
  .unset .timer__bar .measure {
    transform: translateX(0) !important;
  }
  .timer__remainder {
    line-height: 1.2;
    mix-blend-mode: exclusion;
    text-align: right;
    white-space: nowrap;
    z-index: 2;
  }

  /*  Item Image  */

  /* .item-image {
    object-fit: cover;
    object-position: center;
    opacity: 0;
    transition: 400ms opacity ease-in;
    width: 100%;
  }
  .item-image.loaded {
    opacity: 1;
  }
  .image-block {
    aspect-ratio: 1 / 1;
    // aspect-ratio: 3 / 4;
    display: flex;
    overflow: hidden;
  } */

  /* End Refactor Todo Block */
</style>