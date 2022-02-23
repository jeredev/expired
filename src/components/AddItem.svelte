<script lang="ts">
  import { supabase } from "$lib/supabase";
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
    format,
    subYears,
    subMonths,
    subWeeks,
    subDays,
    subHours,
    subMinutes,
  } from 'date-fns'
  import { createEventDispatcher } from "svelte";
  // import { dataset_dev } from "svelte/internal";
  // import Item from "./Item.svelte";

  const dispatch = createEventDispatcher();

  export let active

  let newItem = {
    name: null,
    startTime: format(new Date(), 'yyyy-MM-dd\'T\'HH:mm'),
    endTime: null,
    image: null,
    category: null,
  }

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
    years: null,
    months: null,
    weeks: null,
    days: null,
    hours: null,
    minutes: null,
  }

  const updateEndTimeRelatively = () => {
    // if (newItem.endTime) {
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
    // }
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
    const { data, error } = await supabase
      .from('items')
      .insert([
        {
          name: newItem.name.trim(),
          startTime: new Date(newItem.startTime),
          endTime: new Date(newItem.endTime),
          category: newItem.category,
        },
      ])
    if (error) {
      addNewItemProcessing = false
      message.set({
        text: `Error: ${error.message}`,
        timed: true
      })
      console.error('Error:', error)
      return
    }
    if (data) {
      if (newItem.image) {
        const newItemWithImg = await addNewItemImage(data)
        if (newItemWithImg) data[0].imagePath = newItemWithImg[0].imagePath
      }
      data.forEach((item) => {
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
        const startTime = new Date(item.startTime)
        if (item.endTime) {
          let endTime = new Date(item.endTime)
          item.edits.endRelatively.years = differenceInYears(endTime, startTime)
          endTime = subYears(new Date(endTime), endRelatively.years)
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
        }
        else {
          item.edits.endRelatively.years = 0
          item.edits.endRelatively.months = 0
          item.edits.endRelatively.weeks = 0
          item.edits.endRelatively.days = 0
          item.edits.endRelatively.hours = 0
          item.edits.endRelatively.minutes = 0
        }
      })
      // Reset New Item Form
      newItem = {
        name: null,
        startTime: format(new Date(), 'yyyy-MM-dd\'T\'HH:mm'),
        endTime: null,
        image: null,
        category: null,
      }
      endRelatively.years = 0
      endRelatively.months = 0
      endRelatively.weeks = 0
      endRelatively.days = 0
      endRelatively.hours = 0
      endRelatively.minutes = 0
      fileInput.value = ''
      newItemImagePreview = null
      addNewItemProcessing = false
      checkNewItemValidity()
      dispatch('add', data)
      message.set({
        text: 'Successfully added new item.',
        timed: true
      })
    }
  }

  const addNewItemImage = async(item) => {
    const { data, error } = await supabase
      .storage
      .from('expired')
      .upload(`${$session.user.id}/${item[0].id}`, newItem.image)
    if (error) {
      message.set({
        text: `Error: ${error.message}`,
        timed: true
      })
      console.error('Error:', error)
      return
    }
    if (data && data.Key) {
      const {data, error} = await supabase
        .from('items')
        .update({ imagePath: `${item[0].id}` })
        .match({ id: item[0].id })
      if (data) return data
      if (error) {
        message.set({
          text: `Error: ${error.message}`,
          timed: true
        })
        console.error('Error:', error)
      }
    }
  }

  let fileInput
  let newItemImagePreview = null

  const analyzeFile = () => {
    // const file = fileInput.files[0]
    if (fileInput.files[0]) {
      const file = fileInput.files[0]
      newItemImagePreview = URL.createObjectURL(file)
      newItem.image = file
      // newItemImagePreview = URL.createObjectURL(file)
      // console.log(newItem.image)
    }
    else {
      newItem.image = null
      newItemImagePreview = null
    }
  }

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

  let addNewCategoryProcessing = false
  const addNewCategory = async() => {
    addNewCategoryProcessing = true
    const { data, error } = await supabase
      .from('categories')
      .insert([
        {
          name: newCategory.trim(),
        },
      ])
    if (error) {
      addNewCategoryProcessing = false
      message.set({
        text: `Error: ${error.message}`,
        timed: true
      })
      console.log('error adding new category:', error)
      return
    }
    if (data) {
      addNewCategoryProcessing = false
      categories = await getCategories()
      newCategory = null
      addingCategory = false
      // fileInput.value = null // Doesn't work
    }
  }

  const getCategories = async() => {
    const { data, error } = await supabase
      .from('categories')
      .select()
      .order('name', { ascending: true })
    if (data) return data
    if (error) {
      message.set({
        text: `Error: ${error.message}`,
        timed: true
      })
      console.error('Error:', error)
    }
  }
  let categories: Array<CategoryProps> | null

  let scanner: boolean
  let scannerActive: boolean
  let detection: number
  let barcodeDetector
  let mediaStream: MediaStream
  let scannedBarcode
  let video
  // let video: HTMLVideoElement

  const setupScanner = () => {
    scanner = true
    barcodeDetector = new BarcodeDetector({
      formats: [
        // 'ean_13',
        'upc_a',
      ]
    })
  }

  const activateScanner = async() => {
    video = document.getElementById('barcode-capture')
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

  const detect = async() => {
    function render() {
      barcodeDetector
        .detect(video)
        .then(barcodes => {
          barcodes.forEach(async(barcode) => {
            if (scannedBarcode) return
            else {
              scannedBarcode = barcode.rawValue
              stopDetection()
              const scannedItem = await barcodeLookup(scannedBarcode)
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
  const barcodeLookup = async(barcode) => {
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
          newItem.image = await fetch(data.product.image_url).then(r => r.blob())
        }
        // message.set(null)
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
  let recognition = false
  const listenForName = () => { 
    if (recognition) {
      recognition.start()
      recognition.addEventListener('result', (e) => {
        let text = Array.from(e.results)
          .map(result => result[0])
          .map(result => result.transcript)
          .join('')
        if (text) {
          newItem.name = camelize(text)
        }
        recognition.stop()
      })
    }
  }
  // const SpeechRecognition = window.SpeechRecognition || webkitSpeechRecognition
  // const recognition = new SpeechRecognition()
  // console.log(recognition)

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
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    if (SpeechRecognition) {
      // console.log('true') // Chrome needs webkit prefix version
      recognition = new SpeechRecognition()
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
        {#if recognition}
          <button type="button" class="btn" on:click="{listenForName}">
            <Icon icon="clarity:microphone-line" />
          </button>
        {/if}
        <input id="new-item-name" bind:value={newItem.name} type="text" class="bg-black p-1 text-white w-full" on:input="{checkNewItemValidity}" required>
      </div>
      <div class="form-field my-2">
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