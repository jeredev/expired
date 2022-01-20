<script>
  import { supabase, user } from "$lib/db";
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
    parseISO,
    subYears,
    subMonths,
    subWeeks,
    subDays,
    subHours,
    subMinutes,
  } from 'date-fns'
  const lifespan = (startTime, endTime) => {
    return getTime(new Date(endTime)) - getTime(new Date(startTime))
  }
  const timeElapsed = (startTime) => {
    return time - getTime(new Date(startTime))
  }
  const timeRemainder = () => {
    if (timeElapsed > lifespan) {
      return 'Decayed'
    }
    else {
      const timeRemaining = lifespan - timeElapsed + time
      const timeReported = formatDistanceToNowStrict(timeRemaining)
      return timeReported
    }
  }
  const getItemImage = async (path) => {
    const { data, error } = await supabase
      .storage
      .from('Decay')
      .download(path)
      if (data) return URL.createObjectURL(data)
  }
  export let item
  export let time
</script>

<div class="item">
  <div class="item-internal grid gap-4 py-4">
    <div class="item__aside">
      <div class="image-block">
        {#if item.imagePath}
          {#await getItemImage(`${$user.id}/${item.imagePath}`)}
            Loading...
          {:then data}
            <img src="{data}" alt="" class="item-image">
          {/await}
        {:else}
          <div class="image-upload-region">
            <!-- <img v-if="uploadReady === true" ref="itemImage" :src="itemImagePreview" alt="" /> -->
            <div class="file-input-region">
              <div class="form-field">
                <!-- <label :for="`edit-${item.id}--image`">Choose</label> -->
                <input
                  type="file"
                  accept="image/*"
                  class="file-input"
                  capture
                />
              </div>
            </div>
            <!-- <button v-show="uploadReady === true" :disabled="uploadReady === false" @click="addImage">
              Save
            </button> -->
          </div>
        {/if}
      </div>
    </div>
    <div class="item__main">
      <div class="item__main-wrapper">
        <div class="item-title-area grid gap-8">
          <div class="item-title">
            {item.name}
          </div>
          <aside>
            <button class="btn">
              Menu
            </button>
          </aside>
        </div>
        <div class="item-menu-wrapper">
          <!-- ... -->
        </div>
      </div>
      <div class="timer">
        <div class="timer__bar">
          <div class="timer__remainder">
            Remainder
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
</style>