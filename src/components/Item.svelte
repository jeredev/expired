<script lang="ts">
  import { session } from "$app/stores";
  import { createEventDispatcher, getContext, onDestroy, onMount } from "svelte";
  import { slide } from 'svelte/transition';
  import Icon from '@iconify/svelte'
  import { message, time } from "../stores";
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
    endOfMonth,
    format,
    subYears,
    subMonths,
    subWeeks,
    subDays,
    subHours,
    subMinutes,
  } from 'date-fns'
  
  // import { stuff } from '../routes/index.svelte'

  export let categories: Array<CategoryProps>
  // const categories = getContext('categories')
  // $: categories = getContext('categories')

  export let item: ItemProps
  // export let time: number

  let image: HTMLImageElement
  let imageLoaded = false

  let expired: boolean | null = null
  let imminent: boolean = false

  interface edits {
    name: string,
    category: string | null,
    startTime: string,
    endTime: string,
    endRelatively: {
      years: number,
      months: number,
      weeks: number,
      days: number,
      hours: number,
      minutes: number
    }
  }
  let edits: edits = {
    name: item.name,
    category: '',
    startTime: format(new Date(item.startTime), 'yyyy-MM-dd\'T\'HH:mm'),
    endTime: format(new Date(item.endTime), 'yyyy-MM-dd\'T\'HH:mm'), 
    endRelatively: {
      years: 0,
      months: 0,
      weeks: 0,
      days: 0,
      hours: 0,
      minutes: 0,
    }
  }

  // console.log(item)

  if (item.category) {
    edits.category = item.category.id
  }
  else {
    edits.category = null
  }

  let itemElement: HTMLDivElement
  let menuVisible = false

  let statusProcessing = false

  const dispatch = createEventDispatcher();

  const getLifespan = (startTime: Date, endTime: Date) => {
    return getTime(new Date(endTime)) - getTime(new Date(startTime))
  }
  // console.log(timeClock)
  const getTimeElapsed = (startTime: Date) => {
    return $time - getTime(new Date(startTime))
  }
  let statusRemoving = false
  const removeItem = async() => {
    statusProcessing = true
    statusRemoving = true
    const formData = new FormData()
    formData.append('id', item.id)
    const res = await fetch('/api/item', {
      method: 'DELETE',
      body: formData
    })
    if (!res.ok) {
      // Error here
      const error = await res.json()
      message.set({
        text: `Error: ${error.message}`,
        timed: true
      })
    }
    if (res.ok) {
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
        imminent = true;
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
  // Refactor
  const getTimeRemainder = () => {
    let timeElapsed = getTimeElapsed(item.startTime)
    let lifespan = getLifespan(item.startTime, item.endTime)
    if (timeElapsed > lifespan) {
      expired = true
      return 'Expired'
    }
    else {
      expired = false
      let timeRemaining = lifespan - timeElapsed + $time
      let timeReported = formatDistanceToNowStrict(timeRemaining)
      return timeReported
    }
  }
  let precursorBar = getPrecursorBar()
  let timeBar = getTimeBar()
  let timeRemaining = getTimeRemainder()

  let updateValid = false
  const checkUpdateValidity = () => {
    if (/([^\s])/.test(edits.name) && new Date(edits.endTime) > new Date(edits.startTime)) {
      updateValid = true
      return true
    } else {
      updateValid = false
      return false
    }
  }

  const deleteImage = async() => {
    if (item.imagePath && $session.user?.id) {
      statusProcessing = true

      const formData = new FormData()
      formData.append('id', item.id)
      formData.append('image', '')
      formData.append('imagePath', item.imagePath)

      const res = await fetch('/api/item', {
        method: 'PATCH',
        body: formData
      })
      // Res.error
      if (!res.ok) {
        statusProcessing = false
        statusUpdating = false
        console.log(`!res.ok and before error await`)
        const error = await res.json()
        console.log('after await error which should be logged below:')
        console.log(error)
        if (error.message) {
          message.set({
            text: `Error: ${error.message}`,
            timed: true
          })
        }
        else {
          message.set({
            text: `Error: ${error}`,
            timed: true
          })
        }
      }
      if (res.ok) {
        item.imagePath = undefined
        item.image = undefined
        message.set({
          text: 'Successfully deleted item image.',
          timed: true 
        })
      }
      statusProcessing = false
    }
  }

  let statusRenewing = false
  const renewItem = async () => {
    statusRenewing = true
    statusProcessing = true
    // Calculate new endTime
    let renewedEndTime = updateEndTimeRelativelyForRenewal()

    const formData = new FormData()
    formData.append('id', item.id)
    formData.append('startTime', new Date().toISOString())
    formData.append('endTime', new Date(renewedEndTime).toISOString())

    const res = await fetch('/api/item', {
      method: 'PATCH',
      body: formData
    })

    if (!res.ok) {
      statusProcessing = false
      statusRenewing = false
      // message.set({
      //   text: `Error: ${error.message}`,
      //   timed: true
      // })
      // console.error('There was a problem:', error)
      return
    }
    if (res.ok) {
      const processed = await res.json()
      const renewedItem = processed[0]

      item.name = renewedItem.name
      item.category = renewedItem.category
      item.startTime = renewedItem.startTime
      item.endTime = renewedItem.endTime
      edits.name = renewedItem.name
      edits.category = renewedItem.category
      edits.startTime = format(new Date(renewedItem.startTime), 'yyyy-MM-dd\'T\'HH:mm')
      edits.endTime = format(new Date(renewedItem.endTime), 'yyyy-MM-dd\'T\'HH:mm')
      updateEndTimeRelativity()
      menuVisible = false
      dispatch('update', item)
      statusProcessing = false
      statusRenewing = false
      message.set({
        text: 'Item renewed.',
        timed: true
      })
    }
  }

  let statusUpdating = false
  const updateItem = async() => {
    statusProcessing = true
    statusUpdating = true

    const formData = new FormData()
    formData.append('id', item.id)
    formData.append('name', edits.name)
    formData.append('startTime', edits.startTime)
    formData.append('endTime', edits.endTime)
    if (edits.category) {
      formData.append('category', edits.category)
    }

    const res = await fetch('/api/item', {
      method: 'PATCH',
      body: formData
    })
    // Res.error
    if (!res.ok) {
      console.log('!res.ok')
      statusProcessing = false
      statusUpdating = false
      const error = await res.json()
      if (error.message) {
        message.set({
          text: `Error: ${error.message}`,
          timed: true
        })
      }
      else {
        message.set({
          text: `Error (else): ${error}`,
          timed: true
        })
      }
    }
    if (res.ok) {
      statusProcessing = false
      statusUpdating = false
      const processed = await res.json()
      const updatedItem = processed[0]
      if (updatedItem.id === item.id) {
        item.name = updatedItem.name
        item.startTime = updatedItem.startTime
        item.endTime = updatedItem.endTime
        item.category = updatedItem.category
        edits.name = updatedItem.name
        edits.category = updatedItem.category
        edits.startTime = format(new Date(updatedItem.startTime), 'yyyy-MM-dd\'T\'HH:mm')
        edits.endTime = format(new Date(updatedItem.endTime), 'yyyy-MM-dd\'T\'HH:mm')
        updateEndTimeRelativity()
        menuVisible = false
        dispatch('update', item)
        message.set({
          text: 'Item updated.',
          timed: true
        })
      }
    }
    statusProcessing = false
    statusUpdating = false
  }

  let confirmDelete = false

  let fileInput: HTMLInputElement
  let file: File | null
  let itemImagePreview: string | null
  const addImage = async() => {
    if (file && $session.user?.id) {
      statusProcessing = true
      
      const formData = new FormData()
      formData.append('id', item.id)
      formData.append('image', file)

      const res = await fetch('/api/item', {
        method: 'PATCH',
        body: formData
      })
      // Res.error
      if (!res.ok) {
        alert('not ok')
        statusProcessing = false
        const error = await res.json()
        if (error.message) {
          message.set({
            text: `Error: ${error.message}`,
            timed: true
          })
        }
        else {
          message.set({
            text: JSON.stringify(error),
            timed: true
          })
        }
      }
      if (res.ok) {
        const updatedItem = await res.json()
        file = null
        itemImagePreview = null
        menuVisible = false
        message.set({
          text: 'Successfully added image to item.',
          timed: true
        })
        item.imagePath = `${item.id}`
        item.image = updatedItem[0].image
      }
      statusProcessing = false
    }
    else {
      message.set({
        text: "No file or $session.user.id",
        timed: true
      })
    }
  }
  const analyzeFile = () => {
    if (fileInput.files) {
      file = fileInput.files[0]
      if (file) {
        itemImagePreview = URL.createObjectURL(file)
      }
      else {
        itemImagePreview = null
      }
    }
  }
  const clearImage = () => {
    file = null
    itemImagePreview = null
  }

  const updateEndTimeRelativelyForRenewal = () => {
    let adjTime = new Date()
    if (edits.endRelatively.years)
      adjTime = addYears(adjTime, edits.endRelatively.years)
    if (edits.endRelatively.months)
      adjTime = addMonths(adjTime, edits.endRelatively.months)
    if (edits.endRelatively.weeks)
      adjTime = addWeeks(adjTime, edits.endRelatively.weeks)
    if (edits.endRelatively.days)
      adjTime = addDays(adjTime, edits.endRelatively.days)
    if (edits.endRelatively.hours)
      adjTime = addHours(adjTime, edits.endRelatively.hours)
    if (edits.endRelatively.minutes)
      adjTime = addMinutes(adjTime, edits.endRelatively.minutes)
    return adjTime
  }

  const updateEndTimeRelatively = () => {
    if (edits.endTime) {
      let adjTime = new Date(edits.startTime)
      if (edits.endRelatively.years)
        adjTime = addYears(adjTime, edits.endRelatively.years)
      if (edits.endRelatively.months)
        adjTime = addMonths(adjTime, edits.endRelatively.months)
      if (edits.endRelatively.weeks)
        adjTime = addWeeks(adjTime, edits.endRelatively.weeks)
      if (edits.endRelatively.days)
        adjTime = addDays(adjTime, edits.endRelatively.days)
      if (edits.endRelatively.hours)
        adjTime = addHours(adjTime, edits.endRelatively.hours)
      if (edits.endRelatively.minutes)
        adjTime = addMinutes(adjTime, edits.endRelatively.minutes)
        edits.endTime = format(new Date(adjTime), 'yyyy-MM-dd\'T\'HH:mm')
    }
    checkUpdateValidity()
  }

  const updateEndTimeRelativity = () => {
    const startTime = new Date(edits.startTime)
    if (edits.endTime) {
      
      let endTime = new Date(edits.endTime)
      if (subYears(new Date(endTime), differenceInYears(endTime, startTime)) < startTime) {
        edits.endRelatively.years = 0
      }
      else {
        edits.endRelatively.years = differenceInYears(endTime, startTime)
        endTime = subYears(new Date(endTime), differenceInYears(endTime, startTime))
      }

      if (subMonths(new Date(endTime), differenceInMonths(endTime, startTime)) < startTime) {
        edits.endRelatively.months = 0
      }
      else {
        edits.endRelatively.months = differenceInMonths(endTime, startTime)
        endTime = subMonths(new Date(endTime), differenceInMonths(endTime, startTime))
      }

      if (subWeeks(new Date(endTime), differenceInWeeks(endTime, startTime)) < startTime) {
        edits.endRelatively.weeks = 0
      }
      else {
        edits.endRelatively.weeks = differenceInWeeks(endTime, startTime)
        endTime = subWeeks(new Date(endTime), differenceInWeeks(endTime, startTime))
      }

      edits.endRelatively.days = differenceInDays(endTime, startTime)
      endTime = subDays(new Date(endTime), differenceInDays(endTime, startTime))
      edits.endRelatively.hours = differenceInHours(endTime, startTime)
      endTime = subHours(new Date(endTime), differenceInHours(endTime, startTime))
      edits.endRelatively.minutes = differenceInMinutes(endTime, startTime)
      endTime = subMinutes(new Date(endTime), differenceInMinutes(endTime, startTime))
      
      checkUpdateValidity()
    }
    else {
      edits.endRelatively.years = 0
      edits.endRelatively.months = 0
      edits.endRelatively.weeks = 0
      edits.endRelatively.days = 0
      edits.endRelatively.hours = 0
      edits.endRelatively.minutes = 0
    }
  }

  // Speech Recognition
  let recognitionExpiration: any = false
  let recognitionName: any = false
  let recognizing = false

  const listenForName = () => { 
    if (recognitionName) {
      recognitionName.start()
      recognitionName.addEventListener('result', (e: any) => {
        let text = Array.from(e.results)
          //@ts-ignore
          .map(result => result[0])
          .map(result => result.transcript)
          .join('')
        if (text) {
          edits.name = camelize(text)
        }
        recognitionName.stop()
      })
      recognitionName.onstart = function () {
        recognizing = true
      }
      recognitionName.onend = function () {
        recognizing = false
      }
    }
  }

  const months = [ 'January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December' ]
  // const grammarExpiration = '#JSGF V1.0; grammar months; public <month> = ' + months.join(' | ') + ' ;'
  
  const listenForEndTime = () => { 
    if (recognitionExpiration) {
      recognitionExpiration.abort() // Unsure :: InvalidStateError: Failed to execute 'start' on 'SpeechRecognition': recognition has already started.
      recognitionExpiration.start()
      recognitionExpiration.addEventListener('result', (e: any) => {
        let text = Array.from(e.results)
          //@ts-ignore
          .map(result => result[0])
          .map(result => result.transcript)
          .join('')
        if (text) {
          // End of "month" "year"
          // newItem.endTimeTranscription = text
          const words = text.split(' ')
          // Determine if first word is 'end'
          let year: number
          if (words[0].localeCompare('end', undefined, { sensitivity: 'accent' }) === 0) {
            // Find month
            const monthIndex = months.findIndex(month => month === words[2])
            // Process year
            if (words[3]) {
              year = parseInt(words[3])
            }
            else {
              year = new Date().getFullYear()
            }
            const processedDate = endOfMonth(new Date(year, monthIndex, 1, 0, 0, 0))
            edits.endTime = format(new Date(processedDate), 'yyyy-MM-dd\'T\'HH:mm')
            updateEndTimeRelativity()
          }
          else {
            // Find month
            const monthIndex = months.findIndex(month => month === words[0])
            // Process day
            const day = words[1].replace(/\D/g,'')
            // Process year
            if (words[2]) {
              year = parseInt(words[2])
            }
            else {
              year = new Date().getFullYear()
            }
            edits.endTime = format(new Date(year, monthIndex, parseInt(day)), 'yyyy-MM-dd\'T\'HH:mm')
            updateEndTimeRelativity()
          }
        }
        recognitionExpiration.stop()
      })
      recognitionExpiration.onstart = function () {
        recognizing = true
      }
      recognitionExpiration.onend = function () {
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

  onMount(() => {
    updateEndTimeRelativity()
    checkUpdateValidity()
    const SpeechRecognition = (<any>window).SpeechRecognition || (<any>window).webkitSpeechRecognition
    if (SpeechRecognition) {
      recognitionName = new SpeechRecognition()
      recognitionExpiration = new SpeechRecognition()
    }
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting && entry.target.classList.contains('calculated')) {
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
    if (itemElement && (timeRemaining || expired)) {
      io.observe(itemElement)
    }
    if (image) {
      image.onload = function() { 
        imageLoaded = true
      }
      image.onerror = function() {
        imageLoaded = true
      }
    }
  })
  onDestroy(() => {
    // if (itemElement) {
    //   io.unobserve(itemElement)
    // }
  })
  // Reactivity to Time
  $: {
    if ($time) {
      precursorBar = getPrecursorBar()
      timeBar = getTimeBar()
      timeRemaining = getTimeRemainder()
    }
  }
</script>

<div bind:this="{itemElement}" class="item unset" class:expired = {expired} class:imminent = {imminent} class:calculated = {timeRemaining}>
  <div class="item-internal grid gap-4 p-4">
    <div class="item__aside">
      {#if item.imagePath}
        <div class="image-block">
          {#if imageLoaded === false}
            <div class="elapser">
              <div class="indication"><div class="node"></div>
              </div>
            </div>
          {/if}
          <img
            src="{item.image}" 
            alt="{item.name}" 
            class="item-image block m-auto"
            bind:this={image}
          >
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
            <button class="btn my-4 w-full" on:click="{addImage}" disabled="{statusProcessing}">
              Save
            </button>
          {/if}
          <div class="file-input-region overflow-hidden">
            <label for="new-item--file-{item.id}" class="block btn cursor-pointer text-center">
              {#if itemImagePreview}
                Change
              {:else}
                <Icon icon="clarity:camera-solid" style="margin: 0 auto;" />
              {/if}
            </label>
            {#if itemImagePreview}
              <button class="block btn my-2 w-full" on:click="{clearImage}">
                <Icon icon="clarity:close-line" style="margin: 0 auto;" />
              </button>
            {/if}
            <input
              bind:this={fileInput}
              id="new-item--file-{item.id}"
              type="file"
              accept="image/*"
              class="file-input"
              capture
              on:change="{analyzeFile}"
            >
          </div>
        </div>
      {/if}
    </div>
    <div class="item__main">
      <div class="item__main-wrapper">
        <div class="item-title-area grid gap-8">
          <div class="item-title">
            {item.name}
          </div>
          <aside>
            <button class="btn" on:click="{() => menuVisible = !menuVisible}">
              <Icon icon="clarity:menu-line" />
            </button>
          </aside>
        </div>
        <div class="item-menu-wrapper mt-4">
          {#if menuVisible}
            <div transition:slide class="item-menu pb-4">
              <div class="menu-area">
                <div class="area area--name">
                  <div class="form-field mb-2">
                    <label for="edit-{item.id}--name">Name</label>
                    {#if recognitionName}
                      <button type="button" class="btn ml-2 px-2 py-1" on:click="{listenForName}">
                        <Icon icon="clarity:microphone-line" />
                      </button>
                    {/if}
                    <input type="text" id="edit-{item.id}--name" class="bg-black p-2 text-white w-full" bind:value="{edits.name}" on:input="{checkUpdateValidity}" />
                  </div>
                </div>
                <div class="area area--category">
                  <div class="form-field mb-2">
                    <label for="edit-{item.id}--category" class="block">Category</label>
                    <select name="" id="edit-{item.id}--category" class="bg-black px-1 py-2 text-white w-full" bind:value="{edits.category}">
                      {#if categories}
                        {#each categories as category}
                          <option value="{category.id}">{category.name}</option>
                        {/each}
                      {/if}
                      <option value="{null}">Uncategorized</option>
                    </select>
                  </div>
                </div>
                <div class="area area--start-time">
                  <div class="form-field mb-2">
                    <label for="edit-{item.id}--start-time" class="block">Start Time</label>
                    <div class="relative">
                      <input
                        bind:value="{edits.startTime}"
                        id="edit-{item.id}--start-time"
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
                      <label for="edit-{item.id}--end-time">End Time</label>
                      {#if recognitionExpiration}
                        <button type="button" class="btn ml-2 px-2 py-1 listener" class:recognizing = {recognizing} on:click="{listenForEndTime}">
                          <Icon icon="clarity:microphone-line" />
                        </button>
                      {/if}
                      <div class="relative">
                        <input
                          bind:value="{edits.endTime}"
                          id="edit-{item.id}--end-time"
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
                          <div class="form-field mb-2">
                            <label for="edit-{item.id}--endtime-years">Years</label>
                            <input type="number" min="0" class="bg-black p-1 text-white" id="edit-{item.id}--endtime-years" bind:value="{edits.endRelatively.years}" on:input="{updateEndTimeRelatively}" />
                          </div>
                          <div class="form-field mb-2">
                            <label for="edit-{item.id}--endtime-months">Months</label>
                            <input type="number" min="0" class="bg-black p-1 text-white" id="edit-{item.id}--endtime-months" bind:value="{edits.endRelatively.months}" on:input="{updateEndTimeRelatively}" />
                          </div>
                          <div class="form-field mb-2">
                            <label for="edit-{item.id}--endtime-weeks">Weeks</label>
                            <input type="number" min="0" class="bg-black p-1 text-white" id="edit-{item.id}--endtime-weeks" bind:value="{edits.endRelatively.weeks}" on:input="{updateEndTimeRelatively}" />
                          </div>
                          <div class="form-field mb-2">
                            <label for="edit-{item.id}--endtime-days">Days</label>
                            <input type="number" min="0" class="bg-black p-1 text-white" id="edit-{item.id}--endtime-days" bind:value="{edits.endRelatively.days}" on:input="{updateEndTimeRelatively}" />
                          </div>
                          <div class="form-field mb-2">
                            <label for="edit-{item.id}--endtime-hours">Hours</label>
                            <input type="number" min="0" class="bg-black p-1 text-white" id="edit-{item.id}--endtime-hours" bind:value="{edits.endRelatively.hours}" on:input="{updateEndTimeRelatively}" />
                          </div>
                          <div class="form-field mb-2">
                            <label for="edit-{item.id}--endtime-minutes">Minutes</label>
                            <input type="number" min="0" class="bg-black p-1 text-white" id="edit-{item.id}--endtime-minutes" bind:value="{edits.endRelatively.minutes}" on:input="{updateEndTimeRelatively}" />
                          </div>
                        </div>
                      </fieldset>
                    </form>
                  </div>
                  {#if !updateValid}
                    <div class="py-2">Invalid</div>
                  {/if}
                  <div class="area area--remove">
                    <button type="button" class="btn mb-2 edit-item" on:click="{updateItem}" disabled="{!updateValid || statusProcessing}">
                      {#if statusUpdating}
                        Updating...
                      {:else}
                        Update
                      {/if}
                    </button>
                    <button type="button" class="btn mx-2 mb-2 edit-item" on:click="{renewItem}" disabled="{statusProcessing}">
                      {#if statusRenewing}
                        Renewing...
                      {:else}
                        Renew
                      {/if}
                    </button>
                    <button type="button" class="btn mb-2 remove-item negative" on:click={() => { confirmDelete = !confirmDelete }} disabled="{statusProcessing}">
                      {#if statusRemoving}
                        Removing...
                      {:else}
                        Delete
                      {/if}
                    </button>
                    {#if confirmDelete}
                      <div transition:slide class="mt-4">
                        Delete this item?
                        <button class="btn negative" on:click="{removeItem}" disabled="{statusProcessing}">
                          Yes
                        </button>
                        <button class="btn mx-2" on:click="{() => { confirmDelete = false }}" disabled="{statusProcessing}">
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
            <div class="precursor-meter-veil" style="{ precursorBar }">
              <div class="precursor-meter"></div>
            </div>
          </div>
          <div class="measure">
            <div class="meter" style="{ timeBar }"></div>
          </div>
          <div class="timer__remainder">
            {#if timeRemaining}
              { timeRemaining }
            {:else if expired}
              Expired
            {:else}
              &nbsp;
            {/if}
          </div>
        </div>
      </div>
    </div>
  </div>
</div>

<style>
  .file-input-region {
    position: relative;
  }
  .file-input {
    opacity: 0;
    width: 0.1px;
    height: 0.1px;
    position: absolute;
  }
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
    border-top: 1px solid var(--gray);
    border-top: 1px solid rgba(102, 102, 102, 0.6);
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
    /* font-family: 'Recursive', sans-serif; */
    font-size: clamp(1rem, 2vw, 1.2rem);
    line-height: 1.2;
  }
  .form-field {
    grid-template-columns: max-content 1fr;
  }
  .form-field label {
    /* font-family: 'Inter', sans-serif; */
    /* font-family: 'Recursive', sans-serif */
  }
  .item-image {
    flex: 1;
    opacity: 1;
    transition: 400ms opacity;
    /* aspect-ratio: 1 / 1; */
    aspect-ratio: 3 / 4;
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
    font-family: 'Recursive', sans-serif;
    line-height: 1;
    mix-blend-mode: exclusion;
    text-align: right;
    white-space: nowrap;
    z-index: 2;
    transition: color 400ms;
  }

  /*  Item Image  */

  .image-block {
    /* aspect-ratio: 1 / 1; */
    aspect-ratio: 3 / 4;
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
  .form-field input:focus-visible, .form-field select:focus-visible {
    filter: drop-shadow(0 0 0.125rem #fff);
    outline: 1px solid #fff;
  }
  .unit-form-fields {
    display: grid;
    gap: 0.5rem;
    grid-template-columns: repeat(6, 1fr);
  }
  .unit-form-fields .form-field input {
    display: block;
    width: 100%;
  }
  .unit-form-fields .form-field label {
    font-size: 80%;
  }
  .item {
    background-color: rgba(16, 16, 16, 1);
    /* border-left: 1px solid var(--gray);
    border-right: 1px solid var(--gray); */
    border-left: 1px solid rgba(102, 102, 102, 0.6);
    border-right: 1px solid rgba(102, 102, 102, 0.6);
  }
  
</style>