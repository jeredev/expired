<script>
  import { supabase } from "$lib/supabase";
  import { session } from "$app/stores";
  import { createEventDispatcher, onDestroy, onMount } from "svelte";
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

  item.expired = null
  item.imminent = false
  item.imageLoaded = true

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

  let statusProcessing = false

  const dispatch = createEventDispatcher();

  const getLifespan = (startTime, endTime) => {
    return getTime(new Date(endTime)) - getTime(new Date(startTime))
  }
  const getTimeElapsed = (startTime) => {
    return time - getTime(new Date(startTime))
  }
  let statusRemoving = false
  const removeItem = async() => {
    statusProcessing = true
    statusRemoving = true
    const { data, error } = await supabase
      .from('items')
      .delete()
      .match({ id: item.id })
    if (error) {
      statusProcessing = false
      statusRemoving = false
      message.set({
        text: `Error: ${error.message}`,
        timed: true
      })
      console.error('There was a problem:', error)
      return
    }
    if (data) {
      if (data[0] && data[0].imagePath) {
        const fromPath = `${$session.user.id}/${data[0].imagePath}`
        // Ideally, this should be done behind the scenes or in a housekeeping like fashion // Worked
        await supabase
          .storage
          .from('expired')
          .remove([fromPath])
      }
      statusProcessing = false
      statusRemoving = false
      menuVisible = false
      dispatch('remove', item)
      message.set({
        text: 'Item successfully deleted.',
        timed: true
      })
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
      if (timeElapsed / lifespan >= 0.85) {
        item.imminent = true;
      }
      let percentLeft = `-${(timeElapsed / lifespan) * 100}%`
      let percentLeftCSS = `transform: translateX(${percentLeft})`
      return percentLeftCSS
    }
  }
  const getPrecursorBar = () => {
    let timeElapsed = getTimeElapsed(item.startTime)
    let lifespan = getLifespan(item.startTime, item.endTime)
    let timeLeft = lifespan - timeElapsed
    if (timeLeft < 0) {
      // return 'transform: translateX(-100%)'
    }
    else {
      const percent = (timeElapsed / lifespan) * 100
      let percentLost = -Math.abs(percent) + 100
      let percentLeft = `${percentLost}%`
      let precursorWidth = `${(timeElapsed / lifespan) * 100}%`
      let percentLeftCSS = `width: ${precursorWidth};`
      return percentLeftCSS
    }
  }
  const getTimeRemainder = () => {
    let timeElapsed = getTimeElapsed(item.startTime)
    let lifespan = getLifespan(item.startTime, item.endTime)
    if (timeElapsed > lifespan) {
      item.expired = true
    }
    else {
      item.expired = false
      let timeRemaining = lifespan - timeElapsed + time
      let timeReported = formatDistanceToNowStrict(timeRemaining)
      return timeReported
    }
  }
  item.precursorBar = getPrecursorBar()
  item.timeBar = getTimeBar()
  item.timeRemaining = getTimeRemainder()
  const getItemImage = async (path) => {
    // console.log('getting image from supabase')
    const { data, error } = await supabase
      .storage
      .from('expired')
      .download(path)
    if (data) {
      item.imageLoaded = true
      return URL.createObjectURL(data)
    }
    if (error) {
      console.log(`error from ${path}`)
      message.set({
        text: `Error: ${error.message}`,
        timed: true
      })
      console.error('Error:', error)
      return
    }
  }
  const buildItemImage = async (path) => {
    // console.log('building')
    const imagePath = $session.user.id + "/" + item.imagePath
    item.image = await getItemImage(imagePath)
  }
  const io = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
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
    if (item.imagePath && $session.user.id) {
      const fromPath = `${$session.user.id}/${item.imagePath}`
      const { data, error } = await supabase
        .storage
        .from('expired')
        .remove([fromPath])
      if (error) {
        message.set({
          text: `Error: ${error.message}`,
          timed: true
        })
        console.error('Error:', error)
        return
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
          message.set({
            text: `Error: ${error.message}`,
            timed: true
          })
          console.error('Error:', error)
          return
        }
        else {
          message.set({
            text: 'Successfully deleted item image.',
            timed: true 
          })
        }
      }
    }
  }

  let statusRenewing = false
  const renewItem = async () => {
    statusRenewing = true
    statusProcessing = true
    // Calculate new endTime
    let renewedEndTime = updateEndTimeRelativelyForRenewal()
    const { data, error } = await supabase
      .from('items')
      .update({
        startTime: new Date(),
        endTime: new Date(renewedEndTime),
      })
      .match({ id: item.id })
    if (error) {
      statusProcessing = false
      statusUpdating = false
      message.set({
        text: `Error: ${error.message}`,
        timed: true
      })
      console.error('There was a problem:', error)
      return
    }
    if (data && data[0]) {
      item.name = data[0].name
      item.startTime = data[0].startTime
      item.endTime = data[0].endTime
      item.edits.name = data[0].name
      // Find category name / Assign category
      const found = categories.find(element => element.id === data[0].category)
      if (!found) {
        item.category = {}
      } else {
        item.category = {}
        item.category.id = found.id
        item.category.name = found.name
        item.edits.category.id = found.id
        item.edits.category.name = found.name
      }
      item.edits.startTime = format(new Date(data[0].startTime), 'yyyy-MM-dd\'T\'HH:mm')
      item.edits.endTime = format(new Date(data[0].endTime), 'yyyy-MM-dd\'T\'HH:mm')
      updateEndTimeRelativity()
      menuVisible = false
      dispatch('update', item)
      statusProcessing = false
      statusUpdating = false
      message.set({
        text: 'Item renewed.',
        timed: true
      })
    }
  }

  let statusUpdating = false
  const updateItem = async () => {
    statusProcessing = true
    statusUpdating = true
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
      statusProcessing = false
      statusUpdating = false
      message.set({
        text: `Error: ${error.message}`,
        timed: true
      })
      console.error('There was a problem:', error)
      return
    }
    if (data && data[0]) {
      item.name = data[0].name
      item.startTime = data[0].startTime
      item.endTime = data[0].endTime
      item.edits.name = data[0].name
      // Find category name / Assign category
      const found = categories.find(element => element.id === data[0].category)
      if (!found) {
        item.category = {}
      } else {
        item.category = {}
        item.category.id = found.id
        item.category.name = found.name
        item.edits.category.id = found.id
        item.edits.category.name = found.name
      }
      item.edits.startTime = format(new Date(data[0].startTime), 'yyyy-MM-dd\'T\'HH:mm')
      item.edits.endTime = format(new Date(data[0].endTime), 'yyyy-MM-dd\'T\'HH:mm')
      updateEndTimeRelativity()
      menuVisible = false
      dispatch('update', item)
      statusProcessing = false
      statusUpdating = false
      message.set({
        text: 'Item updated.',
        timed: true
      })
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
        .from('expired')
        .upload(`${$session.user.id}/${item.id}`, file)
      if (error) {
        message.set({
          text: `Error: ${error.message}`,
          timed: true
        })
        console.error('Error:', error)
        return
      }
      if (data.Key) {
        const { error } = await supabase
          .from('items')
          .update({ imagePath: item.id })
          .match({ id : item.id })
        if (error) {
          message.set({
            text: `Error: ${error.message}`,
            timed: true
          })
          console.error('Error:', error)
          return
        }
        file = null
        fileInput = null
        itemImagePreview = null
        menuVisible = false
        message.set({
          text: 'Successfully added image to item.',
          timed: true
        })
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

  const updateEndTimeRelativelyForRenewal = () => {
    let adjTime = new Date()
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
    return adjTime
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
      if (subYears(new Date(endTime), differenceInYears(endTime, startTime)) < startTime) {
        item.edits.endRelatively.years = 0
      }
      else {
        item.edits.endRelatively.years = differenceInYears(endTime, startTime)
        endTime = subYears(new Date(endTime), differenceInYears(endTime, startTime))
      }

      if (subMonths(new Date(endTime), differenceInMonths(endTime, startTime)) < startTime) {
        item.edits.endRelatively.months = 0
      }
      else {
        item.edits.endRelatively.months = differenceInMonths(endTime, startTime)
        endTime = subMonths(new Date(endTime), differenceInMonths(endTime, startTime))
      }

      if (subWeeks(new Date(endTime), differenceInWeeks(endTime, startTime)) < startTime) {
        item.edits.endRelatively.weeks = 0
      }
      else {
        item.edits.endRelatively.weeks = differenceInWeeks(endTime, startTime)
        endTime = subWeeks(new Date(endTime), differenceInWeeks(endTime, startTime))
      }

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
  onMount(() => {
    updateEndTimeRelativity()
    checkUpdateValidity()
    if (item.imagePath && !item.image) {
      item.imageLoaded = false
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
      item.precursorBar = getPrecursorBar()
      item.timeBar = getTimeBar()
      item.timeRemaining = getTimeRemainder()
    }
  }
</script>

<div bind:this="{itemElement}" class="item unset" class:expired = {item.expired} class:imminent = {item.imminent}>
  <div class="item-internal grid gap-4 py-4">
    <div class="item__aside">
      {#if item.imagePath}
        <div class="image-block">
          {#if item.imageLoaded === false}
            <div class="elapser">
              <div class="indication"><div class="node"></div>
              </div>
            </div>
          {:else}
            <img 
              src="{item.image}" 
              alt="{item.name}" 
              class="item-image block m-auto"
              loading="lazy"
            >
          {/if}
        </div>
        {#if menuVisible}
          <button class="btn leading-tight negative mt-4 flex justify-center w-full" on:click="{deleteImage}" disabled="{statusProcessing}">
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
    <div class="item__main">
      <div class="item__main-wrapper">
        <div class="item-title-area grid gap-8 pb-4">
          <div class="item-title">
            {item.name}
          </div>
          <aside>
            <button class="btn" on:click="{() => menuVisible = !menuVisible}">
              <Icon icon="clarity:menu-line" />
            </button>
          </aside>
        </div>
        <div class="item-menu-wrapper">
          {#if menuVisible}
            <div transition:slide class="item-menu pb-4">
              <div class="menu-area">
                <div class="area area--name">
                  <div class="form-field mb-2">
                    <label for="edit-{item.id}--name" class="block">Name</label>
                    <input type="text" id="edit-{item.id}--name" class="bg-black p-2 text-white w-full" bind:value="{item.edits.name}" on:input="{checkUpdateValidity}" />
                  </div>
                </div>
                <div class="area area--category">
                  <div class="form-field mb-2">
                    <label for="edit-{item.id}--category" class="block">Category</label>
                    <select name="" id="" class="bg-black px-1 py-2 text-white w-full" bind:value="{item.edits.category.id}">
                      {#each categories as category}
                        <option value="{category.id}">{category.name}</option>
                      {/each}
                      <option value="{null}">Uncategorized</option>
                    </select>
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
                    <button type="button" class="btn edit-item" on:click="{updateItem}" disabled="{!updateValid || statusProcessing}">
                      {#if statusUpdating}
                        Updating...
                      {:else}
                        Update
                      {/if}
                    </button>
                    <button type="button" class="btn mx-2 edit-item" on:click="{renewItem}" disabled="{statusProcessing}">
                      {#if statusRenewing}
                        Renewing...
                      {:else}
                        Renew
                      {/if}
                    </button>
                    <button type="button" class="btn remove-item negative" on:click={() => { confirmDelete = !confirmDelete }} disabled="{statusProcessing}">
                      {#if statusRemoving}
                        Removing...
                      {:else}
                        Delete
                      {/if}
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
          <div class="precursor">
            <div class="precursor-meter-veil" style="{ item.precursorBar }">
              <div class="precursor-meter"></div>
            </div>
          </div>
          <div class="measure">
            <div class="meter" style="{ item.timeBar }"></div>
          </div>
          <div class="timer__remainder">
            {#if item.timeRemaining}
              { item.timeRemaining }
            {:else}
              Expired
            {/if}
          </div>
        </div>
      </div>
    </div>
  </div>
</div>

<style>
  .menu-area {
    border-bottom: 1px solid var(--gray);
    border-top: 1px solid var(--gray);
    font-size: 85%;
    padding: 1rem 0;
  }
  .precursor {
    height: 100%;
    position: absolute;
    left: 0;
    top: 0;
    width: 100%;
  }
  .precursor-meter-veil {
    filter: drop-shadow(0 0 0.5rem white);
    height: 100%;
    position: absolute;
    right: 0;
    top: 0;
    transform-origin: left;
    transform: scaleX(0);
    transition: 400ms;
    width: 100%;
  }
  .precursor-meter {
    background-color: white;
    height: 100%;
    left: 0;
    position: absolute;
    top: 0;
    width: 100%;
  }
  .item:not(:first-child) {
    border-top: 2px solid var(--gray);
  }
  .item.expired .timer__remainder {
    color: var(--red);
  }
  .item-internal {
    grid-template-columns: 100px 1fr;
  }
  .item-title-area {
    grid-template-columns: 1fr max-content;
  }
  .item-title {
    line-height: 1.2;
  }
  .form-field {
    grid-template-columns: max-content 1fr;
  }
  .item-image {
    flex: 1;
    opacity: 1;
    transition: 400ms opacity;
    aspect-ratio: 1 / 1;
    /* object-fit: cover; */
    object-fit: contain;
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
    font-family: 'JetBrains Mono', monospace;
    margin-top: 2rem;
    position: relative;
  }
  .timer__bar {
    font-size: 90%;
    padding: 0.125rem 0.25rem;
    position: relative;
    width: 100%;
  }
  .measure {
    overflow: hidden;
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
  }
  .unset .timer__bar .precursor-meter-veil {
    transform: scaleX(1) !important;
  }
  .timer__bar:before {
    border: 1px solid white;
    content: '';
    display: block;
    inset: 0;
    pointer-events: none;
    position: absolute;
  }
  .timer__bar .meter {
    background-color: #f8feff;
    height: calc(100% + 2px);
    transform-origin: left;
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
  }
  .timer__remainder {
    line-height: 1.2;
    mix-blend-mode: exclusion;
    text-align: right;
    white-space: nowrap;
    z-index: 2;
    transition: color 400ms;
  }

  /*  Item Image  */

  .image-block {
    aspect-ratio: 1 / 1;
    display: flex;
    flex-direction: column;
    min-height: 100px;
    position: relative;
  }

  /* End Refactor Todo Block */

  .imminent .timer__remainder {
    animation: 5000ms imminent linear infinite;
  }

  @keyframes imminent {
    15% {
      color: #fff;
    }
    25% {
      color: #fff;
      text-shadow: 0 0 5px #fff;
    }
    35% {
      color: #fff;
    }
    50% {
      color: var(--red);
      text-shadow: 0 0 5px var(--red);
    }
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
    /* background-color: red; */
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