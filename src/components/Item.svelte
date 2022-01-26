<script lang="ts">
  import { supabase, user } from "$lib/db";
  import { createEventDispatcher, onDestroy, onMount } from "svelte";
  import { slide } from 'svelte/transition';
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
// import ja from "date-fns/locale/ja";

  export let categories
  export let item
  export let time

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
  if (item.imagePath) {
    buildItemImage(item.imagePath)
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
    // console.log('checking validity')
    // updateValid = true
    // console.log(`pickerStart is ${pickerStart}`)
    // console.log(`pickerEnd is ${pickerEnd}`)
    if (/([^\s])/.test(editedName) && new Date(datetimeEnd) > new Date(datetimeStart)) {
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
        name: editedName,
        startTime: pickerStart,
        endTime: pickerEnd,
        category: editedCategory.id,
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
      // item.category = data[0].category
      editedName = data[0].name
      editedCategory.id = data[0].category
      // Find category name
      const categoryName = categories.find((category) => category.id === editedCategory.id)
      editedCategory.name = categoryName
      pickerStart = new Date(data[0].startTime)
      pickerEnd = new Date(data[0].endTime)
      // editItem.category = data[0].category
      updateEndTimeRelativity()
      menuVisible = false
      message.set('Item updated.')
      // toast.push('Item updated.')
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
      // newItemImagePreview = URL.createObjectURL(file)
      // console.log(newItem.image)
    }
    else {
      itemImagePreview = null
      // newItemImagePreview = null
    }
  }

  let editedName = item.name
  let editedCategory
  if (item.category) {
    editedCategory = item.category
  }
  else {
    editedCategory = {}
    editedCategory.id = null
  }
  // let pickerStart = new Date(item.startTime)
  // let pickerEnd = new Date(item.endTime)

  let datetimeStart = format(new Date(item.startTime), 'yyyy-MM-dd\'T\'HH:mm')
  let datetimeEnd = format(new Date(item.endTime), 'yyyy-MM-dd\'T\'HH:mm')

  const endRelatively = {
    years: null,
    months: null,
    weeks: null,
    days: null,
    hours: null,
    minutes: null,
  }

  const updateEndTimeRelatively = () => {
    if (datetimeEnd) {
      let adjTime = new Date(datetimeStart)
      if (endRelatively.years)
        adjTime = addYears(adjTime, endRelatively.years)
      if (endRelatively.months)
        adjTime = addMonths(adjTime, endRelatively.months)
      if (endRelatively.weeks)
        adjTime = addWeeks(adjTime, endRelatively.weeks)
      if (endRelatively.days)
        adjTime = addDays(adjTime, endRelatively.days)
      if (endRelatively.hours)
        adjTime = addHours(adjTime, endRelatively.hours)
      if (endRelatively.minutes)
        adjTime = addMinutes(adjTime, endRelatively.minutes)
        datetimeEnd = format(new Date(adjTime), 'yyyy-MM-dd\'T\'HH:mm')
    }
    checkUpdateValidity()
  }

  const updateEndTimeRelativity = () => {
    const startTime = new Date(datetimeStart)
    if (datetimeEnd) {
      let endTime = new Date(datetimeEnd)
      endRelatively.years = differenceInYears(endTime, startTime)
      endTime = subYears(new Date(endTime), endRelatively.years)
      endRelatively.months = differenceInMonths(endTime, startTime)
      endTime = subMonths(new Date(endTime), differenceInMonths(endTime, startTime))
      endRelatively.weeks = differenceInWeeks(endTime, startTime)
      endTime = subWeeks(new Date(endTime), differenceInWeeks(endTime, startTime))
      endRelatively.days = differenceInDays(endTime, startTime)
      endTime = subDays(new Date(endTime), differenceInDays(endTime, startTime))
      endRelatively.hours = differenceInHours(endTime, startTime)
      endTime = subHours(new Date(endTime), differenceInHours(endTime, startTime))
      endRelatively.minutes = differenceInMinutes(endTime, startTime)
      endTime = subMinutes(new Date(endTime), differenceInMinutes(endTime, startTime))
      checkUpdateValidity()
    }
    else {
      endRelatively.years = 0
      endRelatively.months = 0
      endRelatively.weeks = 0
      endRelatively.days = 0
      endRelatively.hours = 0
      endRelatively.minutes = 0
    }
  }

  onMount(() => {
    updateEndTimeRelativity()
    checkUpdateValidity()
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
            <button class="btn leading-tight negative mt-4" on:click="{deleteImage}">
              Delete image
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
                  <div class="form-field grid gap-4 mb-2">
                    <label for="edit-{item.id}--name">Change Item Name</label>
                    <input type="text" id="edit-{item.id}--name" class="bg-black p-1 text-white" bind:value="{editedName}" on:input="{checkUpdateValidity}" />
                  </div>
                </div>
                <div class="area area--category">
                  <div class="form-field mb-2">
                    <label for="edit-{item.id}--category">Category</label>
                    <select name="" id="" class="bg-black p-2 text-white w-full" bind:value="{editedCategory.id}">
                      {#each categories as category}
                        <option value="{category.id}">{category.name}</option>
                      {/each}
                    </select>
                    <!-- <input type="text" id="edit-{item.id}--category" class="bg-black p-1 text-white" bind:value="{editedCategory.name}" /> -->
                  </div>
                </div>
                <div class="area area--start-time">
                  <div class="form-field grid gap-4 mb-2">
                    <label for="">Start Time</label>
                    <div class="relative">
                      <input
                        bind:value="{datetimeStart}"
                        type="datetime-local"
                        pattern="[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}"
                        required
                        style="background-color: white; color: black;"
                        class="w-full"
                        on:change="{updateEndTimeRelativity}"
                      >
                    </div>
                  </div>
                  <div class="area area--end-time">
                    <div class="form-field grid gap-4 mb-2">
                      <label for="">End Time</label>
                      <div class="relative">
                        <input
                          bind:value="{datetimeEnd}"
                          type="datetime-local"
                          pattern="[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}"
                          required
                          style="background-color: white; color: black;"
                          class="w-full"
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
                            <input type="number" min="0" class="bg-black p-1 text-white" id="edit-{item.id}--endtime-years" bind:value="{endRelatively.years}" on:input="{updateEndTimeRelatively}" />
                          </div>
                          <div class="form-field grid gap-4 mb-2">
                            <label for="edit-{item.id}--endtime-months">Months</label>
                            <input type="number" min="0" class="bg-black p-1 text-white" id="edit-{item.id}--endtime-months" bind:value="{endRelatively.months}" on:input="{updateEndTimeRelatively}" />
                          </div>
                          <div class="form-field grid gap-4 mb-2">
                            <label for="edit-{item.id}--endtime-weeks">Weeks</label>
                            <input type="number" min="0" class="bg-black p-1 text-white" id="edit-{item.id}--endtime-weeks" bind:value="{endRelatively.weeks}" on:input="{updateEndTimeRelatively}" />
                          </div>
                          <div class="form-field grid gap-4 mb-2">
                            <label for="edit-{item.id}--endtime-days">Days</label>
                            <input type="number" min="0" class="bg-black p-1 text-white" id="edit-{item.id}--endtime-days" bind:value="{endRelatively.days}" on:input="{updateEndTimeRelatively}" />
                          </div>
                          <div class="form-field grid gap-4 mb-2">
                            <label for="edit-{item.id}--endtime-hours">Hours</label>
                            <input type="number" min="0" class="bg-black p-1 text-white" id="edit-{item.id}--endtime-hours" bind:value="{endRelatively.hours}" on:input="{updateEndTimeRelatively}" />
                          </div>
                          <div class="form-field grid gap-4 mb-2">
                            <label for="edit-{item.id}--endtime-minutes">Minutes</label>
                            <input type="number" min="0" class="bg-black p-1 text-white" id="edit-{item.id}--endtime-minutes" bind:value="{endRelatively.minutes}" on:input="{updateEndTimeRelatively}" />
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