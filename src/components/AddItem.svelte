<script lang="ts">
  import { session } from "$app/stores";
  import { message } from "../stores";
  import { onMount } from "svelte";
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
    endOfMonth,
    format,
    subYears,
    subMonths,
    subWeeks,
    subDays,
    subHours,
    subMinutes,
  } from 'date-fns'
  import { createEventDispatcher } from "svelte";

  const dispatch = createEventDispatcher();

  export let active: boolean

  let newItem = {
    name: '',
    startTime: format(new Date(), 'yyyy-MM-dd\'T\'HH:mm'),
    endTime: '',
    image: null,
    category: '',
  }

  let itemImage: Blob | File | null = null

  let fileInput: HTMLInputElement
  let newItemImagePreview: string

  let newItemValid = false
  const checkNewItemValidity = () => {
    if (/([^\s])/.test(newItem.name) && newItem.endTime > newItem.startTime) {
      newItemValid = true
      return true
    } else {
      newItemValid = false
      return false
    }
  }

  const endRelatively = {
    years: 0,
    months: 0,
    weeks: 0,
    days: 0,
    hours: 0,
    minutes: 0,
  }

  const updateEndTimeRelatively = () => {
    let adjTime = new Date(newItem.startTime)
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
      newItem.endTime = format(new Date(adjTime), 'yyyy-MM-dd\'T\'HH:mm')
    checkNewItemValidity()
  }

  const updateEndTimeRelativity = () => {
    const startTime = new Date(newItem.startTime)
    if (newItem.endTime) {
      let endTime = new Date(newItem.endTime)

      if (subYears(new Date(endTime), differenceInYears(endTime, startTime)) < startTime) {
        endRelatively.years = 0
      }
      else {
        endRelatively.years = differenceInYears(endTime, startTime)
        endTime = subYears(new Date(endTime), differenceInYears(endTime, startTime))
      }
      if (subMonths(new Date(endTime), differenceInMonths(endTime, startTime)) < startTime) {
        endRelatively.months = 0
      }
      else {
        endRelatively.months = differenceInMonths(endTime, startTime)
        endTime = subMonths(new Date(endTime), differenceInMonths(endTime, startTime))
      }
      if (subWeeks(new Date(endTime), differenceInWeeks(endTime, startTime)) < startTime) {
        endRelatively.weeks = 0
      }
      else {
        endRelatively.weeks = differenceInWeeks(endTime, startTime)
        endTime = subWeeks(new Date(endTime), differenceInWeeks(endTime, startTime))
      }

      // endRelatively.years = differenceInYears(endTime, startTime)
      // endTime = subYears(new Date(endTime), endRelatively.years)
      // endRelatively.months = differenceInMonths(endTime, startTime)
      // endTime = subMonths(new Date(endTime), differenceInMonths(endTime, startTime))
      // endRelatively.weeks = differenceInWeeks(endTime, startTime)
      endTime = subWeeks(new Date(endTime), differenceInWeeks(endTime, startTime))
      endRelatively.days = differenceInDays(endTime, startTime)
      endTime = subDays(new Date(endTime), differenceInDays(endTime, startTime))
      endRelatively.hours = differenceInHours(endTime, startTime)
      endTime = subHours(new Date(endTime), differenceInHours(endTime, startTime))
      endRelatively.minutes = differenceInMinutes(endTime, startTime)
      endTime = subMinutes(new Date(endTime), differenceInMinutes(endTime, startTime))
    }
    else {
      endRelatively.years = 0
      endRelatively.months = 0
      endRelatively.weeks = 0
      endRelatively.days = 0
      endRelatively.hours = 0
      endRelatively.minutes = 0
    }
    checkNewItemValidity()
  }

  let addNewItemProcessing = false
  const addNewItem = async() => {
    addNewItemProcessing = true
    const formData = new FormData()
    formData.append('name', newItem.name.trim())
    if (itemImage) {
      formData.append('image', itemImage)
    }
    const startTimeStr = new Date(newItem.startTime).toISOString()
    formData.append('startTime', startTimeStr)
    const endTimeStr = new Date(newItem.endTime).toISOString()
    formData.append('endTime', endTimeStr)
    formData.append('category', newItem.category)
    
    const res = await fetch('/api/item', {
      method: 'POST',
      body: formData,
    })

    if (!res.ok) {
      const error = await res.json()
      message.set({
        text: `Error: ${error.message}`,
        timed: true
      })
    }
    
    if (res.ok) {
      const newItems = await res.json()
      // Reset New Item Form
      newItem = {
        name: '',
        startTime: format(new Date(), 'yyyy-MM-dd\'T\'HH:mm'),
        endTime: '',
        image: null,
        category: '',
      }
      endRelatively.years = 0
      endRelatively.months = 0
      endRelatively.weeks = 0
      endRelatively.days = 0
      endRelatively.hours = 0
      endRelatively.minutes = 0
      fileInput.value = ''
      newItemImagePreview = ''
      noImageFound = false
      addNewItemProcessing = false
      checkNewItemValidity()
      dispatch('add', newItems)
      message.set({
        text: 'Successfully added new item.',
        timed: true
      })
    }
    addNewItemProcessing = false
  }

  const analyzeFile = () => {
    if (fileInput.files) {
      const file = fileInput.files[0]
      newItemImagePreview = URL.createObjectURL(file)
      itemImage = file
    }
    else {
      itemImage = null
      newItemImagePreview = ''
    }
  }

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

  let addNewCategoryProcessing = false
  const addNewCategory = async() => {
    addNewCategoryProcessing = true
    const formData = new FormData()
    formData.append('name', newCategory.trim())
    const res = await fetch('/api/categories', {
      method: 'POST',
      body: formData
    })
    if (!res.ok) {
      addNewCategoryProcessing = false
      const error = await res.json()
      message.set({
        text: `Error: ${error}`,
        timed: true
      })
      // console.log('error adding new category:', error)
      return
    }
    if (res.ok) {
      addNewCategoryProcessing = false
      categories = await getCategories()
      newCategory = ''
      addingCategory = false
      // fileInput.value = null // Doesn't work
    }
  }

  const getCategories = async() => {
    const res = await fetch('/api/categories')
    if (!res.ok) {
      //   message.set({
      //     text: `Error: ${error.message}`,
      //     timed: true
      //   })
      //   console.error('Error:', error)
    }
    if (res.ok) {
      return await res.json()
    }
  }
  let categories: Array<CategoryProps> | null

  let scanner: boolean
  let scannerActive: boolean
  let detection: number
  let barcodeDetector: any // ???
  let mediaStream: MediaStream
  let scannedBarcode: string | null = null
  let video: HTMLVideoElement

  let noImageFound = false

  const setupScanner = () => {
    scanner = true
    //@ts-ignore // Cannot find name 'BarcodeDetector' ???
    barcodeDetector = new BarcodeDetector({
      formats: [
        // 'ean_13',
        'upc_a',
      ]
    })
  }

  const activateScanner = async() => {
    mediaStream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: 'environment' }
    })
    video.srcObject = mediaStream
    detect()
  }

  const deactivateScanner = () => {
    mediaStream.getTracks().forEach(track => {
      track.stop()
    })
    video.srcObject = null
    scannedBarcode = null
    scannerActive = false
  }

  interface barcode {
    rawValue: string
  }

  const detect = async() => {
    function render() {
      barcodeDetector
        .detect(video)
        .then((barcodes: barcode[]) => {
          barcodes.forEach(async(barcode: barcode) => {
            if (scannedBarcode) return
            else {
              scannedBarcode = barcode.rawValue
              stopDetection()
              await barcodeLookup(scannedBarcode)
              deactivateScanner()
            }
          });
        })
        .catch(console.error);
        }

    (function renderLoop() {
      detection = requestAnimationFrame(renderLoop);
      render()
    })()
  }

  const stopDetection = () => {
    cancelAnimationFrame(detection)
  }

  // API :: https://world.openfoodfacts.org/api/v0/product/652729101133.json
  const barcodeLookup = async(barcode: string) => {
    message.set({
      text: 'Fetching item',
      timed: false
    })
    fetch(`https://world.openfoodfacts.org/api/v0/product/${barcode}.json`)
      .then(response => response.json())
      .then(async(data) => {
        if (data.product.product_name_en) newItem.name = camelize(data.product.product_name_en)
        if (data.product.image_url) {
          newItemImagePreview = data.product.image_url
          itemImage = await fetch(data.product.image_url).then(r => r.blob())
        } else {
          noImageFound = true
        }
        message.set({
          text: `Item successfully fetched!`,
          timed: true
        })
      })
      .catch(error => {
        message.set({
          text: `Fetch error: ${error}`,
          timed: true
        })
        console.error('There has been a problem with your fetch operation:', error)
        deactivateScanner()
      })
  }

  // Speech Recognition
  // let recognition = false
  let recognitionExpiration: any = false
  let recognitionName: any = false
  let recognizing = false
  const listenForName = () => { 
    if (recognitionName) {
      recognitionName.abort() // Unsure :: InvalidStateError: Failed to execute 'start' on 'SpeechRecognition': recognition has already started.
      recognitionName.start()
      recognitionName.addEventListener('result', (e: any) => {
        let text = Array.from(e.results)
          //@ts-ignore
          .map(result => result[0])
          .map(result => result.transcript)
          .join('')
        if (text) {
          newItem.name = camelize(text)
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
          // newItem.endTimeTranscription = text
          const words = text.split(' ')
          // Determine if first word is 'end'
          if (words[0].localeCompare('end', undefined, { sensitivity: 'accent' }) === 0) {
            // Find month
            const monthIndex = months.findIndex(month => month === words[2])
            // Process year
            let year
            if (words[3]) {
              year = parseInt(words[3])
            }
            else {
              year = new Date().getFullYear()
            }
            const processedDate = endOfMonth(new Date(year, monthIndex, 1, 0, 0, 0))
            newItem.endTime = format(new Date(processedDate), 'yyyy-MM-dd\'T\'HH:mm')
            updateEndTimeRelativity()
          }
          else {
            // Find month
            const monthIndex = months.findIndex(month => month === words[0])
            // Process day
            const day = words[1].replace(/\D/g,'')
            // Process year
            let year
            if (words[2]) {
              year = parseInt(words[2])
            }
            else {
              year = new Date().getFullYear()
            }
            newItem.endTime = format(new Date(year, monthIndex, parseInt(day)), 'yyyy-MM-dd\'T\'HH:mm')
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

  onMount(async() => {
    categories = await getCategories()
    if (('BarcodeDetector' in window)) {
      setupScanner()
    }
    const SpeechRecognition = (<any>window).SpeechRecognition || (<any>window).webkitSpeechRecognition
    if (SpeechRecognition) {
      // console.log('true') // Chrome needs webkit prefix version
      recognitionName = new SpeechRecognition()
      recognitionExpiration = new SpeechRecognition()
    }
    
  })

</script>

{#if active}
  <div transition:slide class="container" style="max-width: 60rem;">
    <h2 class="py-2 mb-4 text-white" style="border-bottom: 2px solid var(--red); border-top: 2px solid var(--red);">
      Add New Item
    </h2>
    {#if scanner}
      <div class="scanner-panel">
        {#if scannerActive}
          <button class="btn my-2" on:click="{deactivateScanner}">Cancel</button>
        {:else}
          <button class="btn my-2" on:click="{() => { scannerActive = true }}">Add using barcode</button>
        {/if}
        {#if scannerActive}
          <div transition:slide on:introstart="{activateScanner}">
            <video
              autoplay
              id="barcode-capture"
              src=""
              bind:this={video}
            >
              <track default
                kind="captions" />
              Sorry, your browser doesn't support embedded videos.
            </video>
          </div>
        {/if}
      </div>
    {/if}
    <form on:submit|preventDefault class="form form--add-item" autocomplete="off">
      <div class="form-field my-2">
        <label for="new-item--name block mb-1">Item Name</label>
        {#if recognitionName}
          <button type="button" class="btn ml-2 px-2 py-1 listener" class:recognizing = {recognizing} on:click="{listenForName}">
            <Icon icon="clarity:microphone-line" />
          </button>
        {/if}
        <input id="new-item-name" bind:value={newItem.name} type="text" class="bg-black p-1 text-white w-full" on:input="{checkNewItemValidity}" required>
      </div>
      <div class="form-field my-2">
        {#if noImageFound}
          <p class="my-2 p-1 border-red-800">No image found for scanned item.</p>
        {/if}
        <div class="add-item-image">
          {#if newItemImagePreview}
            <h1>Preview</h1>
            <img src="{newItemImagePreview}" alt="">
          {/if}
          <div class="file-input-region">
            <label for="new-item--file" class="block">Item Image</label>
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
      <div class="form-field my-2">
        <label for="new-item--start-time block mb-1">Start Time</label>
        <div class="date-picker">
          <input
            bind:value={newItem.startTime}
            type="datetime-local"
            pattern="[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}"
            required
            style="background-color: black; color: white;"
            class="px-2 py-1 w-full"
          >
        </div>
      </div>
      <div v-show="newItem.startTime" class="form-field my-2">
        <label for="new-item--end-time block mb-1">Expiration Time</label>
        {#if recognitionExpiration}
          <button type="button" class="btn ml-2 px-2 py-1 listener" class:recognizing = {recognizing} on:click="{listenForEndTime}">
            <Icon icon="clarity:microphone-line" />
          </button>
        {/if}
        <!-- <input type="text" style="background-color: black; color: white;"
        class="mb-2 px-2 py-1 w-full" bind:value="{newItem.endTimeTranscription}"> -->
        <div class="date-picker">
          <input
            bind:value={newItem.endTime}
            type="datetime-local"
            pattern="[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}"
            required
            style="background-color: black; color: white;"
            class="px-2 py-1 w-full"
            on:change={updateEndTimeRelativity}
          >
        </div>
        <div class="relative relativity-fields grid gap-2 my-4">
          <div class="form-field">
            <label for="new-item--end-time-years" class="block">Years</label>
            <input
              id="new-item--end-time-years"
              bind:value={endRelatively.years}
              type="number"
              min="0"
              step="1"
              class="bg-black p-1 text-white"
              on:input="{updateEndTimeRelatively}"
            >
          </div>
          <div class="form-field">
            <label for="new-item--end-time-months" class="block">Months</label>
            <input
              id="new-item--end-time-months"
              bind:value={endRelatively.months}
              type="number"
              min="0"
              step="1"
              class="bg-black p-1 text-white"
              on:input="{updateEndTimeRelatively}"
            >
          </div>
          <div class="form-field">
            <label for="new-item--end-time-weeks" class="block">Weeks</label>
            <input
              id="new-item--end-time-weeks"
              bind:value={endRelatively.weeks}
              type="number"
              min="0"
              step="1"
              class="bg-black p-1 text-white"
              on:input="{updateEndTimeRelatively}"
            >
          </div>
          <div class="form-field">
            <label for="new-item--end-time-days" class="block">Days</label>
            <input
              id="new-item--end-time-days"
              bind:value={endRelatively.days}
              type="number"
              min="0"
              step="1"
              class="bg-black p-1 text-white"
              on:input="{updateEndTimeRelatively}"
            >
          </div>
          <div class="form-field">
            <label for="new-item--end-time-days" class="block">Hours</label>
            <input
              id="new-item--end-time-days"
              bind:value={endRelatively.hours}
              type="number"
              min="0"
              step="1"
              class="bg-black p-1 text-white"
              on:input="{updateEndTimeRelatively}"
            >
          </div>
          <div class="form-field">
            <label for="new-item--end-time-days" class="block">Minutes</label>
            <input
              id="new-item--end-time-days"
              bind:value={endRelatively.minutes}
              type="number"
              min="0"
              step="1"
              class="bg-black p-1 text-white"
              on:input="{updateEndTimeRelatively}"
            >
          </div>
        </div>
      </div>
      <div class="form-field my-2">
        <div class="label-field grid gap-2">
          <label for="new-item--category" class="block mb-1">Category</label>
          <div class="label-field__panel">
            <button type="button" on:click={() => {addingCategory = !addingCategory}}>
              {#if addingCategory}
                <Icon icon="clarity:minus-line" />
              {:else}
                <Icon icon="clarity:plus-line" />
              {/if}
            </button>
          </div>
        </div>
        {#if addingCategory}
          <div class="input-field grid gap-2">
            <input
              type="text"
              name="new-category-name"
              id="new-category-name"
              class="bg-black p-2 text-white"
              placeholder="Category Name"
              bind:value="{newCategory}"
              on:input="{checkNewCategoryValidity}"
            >
            <div class="input-field__panel">
              <button type="button" class="btn" disabled="{!newCategoryValid || addNewCategoryProcessing}" on:click="{addNewCategory}">Add</button>
            </div>
          </div>
        {/if}
        {#if categories && !addingCategory}
          <select name="item-category" id="new-item--category" class="bg-black p-2 text-white w-full" bind:value="{newItem.category}">
            {#each categories as category}
              <option value="{category.id}">{category.name}</option>
            {/each}
          </select>
        {/if}
      </div>
      <button type="submit" class="btn my-4" disabled={!newItemValid || addNewItemProcessing} on:click="{addNewItem}">
        Add Item
      </button>
    </form>
  </div>
{/if}

<style>
  .form-field label {
    font-size: 90%;
  }
  .form-field input, .form-field select {
    transition: 400ms;
  }
  .input-field {
    align-items: center;
    grid-template-columns: 1fr min-content;
  }
  .label-field {
    grid-template-columns: 1fr min-content;
  }
  .relativity-fields {
    grid-template-columns: repeat(6, 1fr);
    /* grid-template-columns: repeat(auto-fit, minmax(1rem, 1fr)); */
  }
  .relativity-fields label {
    font-size: 80%;
  }
  .relativity-fields .form-field input {
    /* display: none; */
    /* width: 4rem; */
    width: 100%;
  }
  .form-field input:focus-visible, .form-field select:focus-visible {
    filter: drop-shadow(0 0 0.125rem #fff);
    outline: 1px solid #fff;
  }
</style>