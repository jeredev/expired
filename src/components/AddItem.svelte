<script>
  import { supabase, user } from "$lib/db";
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
import { createEventDispatcher } from "svelte";

  const dispatch = createEventDispatcher();

  let newItem = {
    name: null,
    startTime: format(new Date(), 'yyyy-MM-dd\'T\'HH:mm'),
    endTime: null,
    image: null,
    category: null,
  }

  let newItemValid = false
  const checkNewItemValidity = () => {
    if (newItem.name && newItem.endTime > newItem.startTime) {
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

  const addNewItem = async() => {
    const { data, error } = await supabase
      .from('items')
      .insert([
        {
          name: newItem.name,
          startTime: new Date(newItem.startTime),
          endTime: new Date(newItem.endTime),
          imagePath: newItem.image,
          category: newItem.category,
        },
      ])
    if (error) {
      // console.log('error adding new item:', error)
      return
    }
    if (data) {
      let newItemWithImg
      if (newItem.image) {
        newItemWithImg = await addNewItemImage(data)
      }
      data[0].imagePath = newItemWithImg[0].imagePath
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
      fileInput = null
      newItemImagePreview = null
      dispatch('add', data)
      message.set('Successfully added new item.')
      // fileInput.value = null // Doesn't work
    }
  }

  const addNewItemImage = async(item) => {
    const { data, error } = await supabase
      .storage
      .from('Decay')
      .upload(`${$user.id}/${item[0].id}`, newItem.image)
    if (error) {
      // console.log('error from addNewItemImage() below:')
      // console.log(error)
    }
    // console.log(`data below after uploading image:`)
    // console.log(data)
    if (data && data.Key) {
      const {data, error} = await supabase
        .from('items')
        .update({ imagePath: `${item[0].id}` })
        .match({ id: item[0].id })
      // getItemImage(`${userSession.value.user.id}/${props.item.id}`)
      // console.log('returned image data below:')
      // console.log(data) // The item, so data[0].imagePath
      if (data) return data
    }
  }

  let fileInput
  let newItemImagePreview = null

  const analyzeFile = () => {
    const file = fileInput.files[0]
    if (file) {
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

  // console.log($user)

</script>

<div class="container" style="max-width: 60rem;">
  <form on:submit|preventDefault class="form form--add-item">
    <div class="form-field my-2">
      <label for="new-item--name">Item Name</label>
      <input id="new-item-name" bind:value={newItem.name} type="text" class="bg-black p-1 text-white w-full" on:input="{checkNewItemValidity}" required>
    </div>
    <div class="form-field my-2">
      <div class="add-item-image">
        {#if newItemImagePreview}
          <h1>Preview</h1>
          <img src="{newItemImagePreview}" alt="">
        {/if}
        <div class="file-input-region">
          <label for="new-item--file">Choose Image</label>
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
      <label for="new-item--start-time">Start Time</label>
      <div class="date-picker">
        <input
          bind:value={newItem.startTime}
          type="datetime-local"
          pattern="[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}"
          required
          style="background-color: white; color: black;"
          class="px-2 py-1 w-full"
        >
      </div>
    </div>
    <div v-show="newItem.startTime" class="form-field my-2">
      <label for="new-item--end-time">End Time</label>
      <div class="date-picker">
        <input
          bind:value={newItem.endTime}
          type="datetime-local"
          pattern="[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}"
          required
          style="background-color: white; color: black;"
          class="px-2 py-1 w-full"
          on:change={updateEndTimeRelativity}
        >
      </div>
      <div class="relative relativity-fields grid grid-cols-6 gap-2 my-4">
        <div class="form-field">
          <label for="new-item--end-time-years">Years</label>
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
          <label for="new-item--end-time-months">Months</label>
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
          <label for="new-item--end-time-weeks">Weeks</label>
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
          <label for="new-item--end-time-days">Days</label>
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
          <label for="new-item--end-time-days">Hours</label>
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
          <label for="new-item--end-time-days">Minutes</label>
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
    <!-- <div class="form-field my-2">
      <label for="new-item--category">Item Category</label>
      <input id="new-item--category" v-model="newItem.category" type="text" class="bg-black p-1 text-white">
    </div> -->
    <button type="submit" class="btn my-4" disabled={!newItemValid} on:click="{addNewItem}">
      Add Item
    </button>
  </form>
</div>

<style>
  .relativity-fields {
    grid-template-columns: repeat(auto-fit, minmax(1rem, 1fr));
  }
  .relativity-fields .form-field input {
    width: 4rem;
  }
</style>