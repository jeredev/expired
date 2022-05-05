<script lang="ts">
  import Icon from '@iconify/svelte'
  import { message } from "../stores";
  import { createEventDispatcher, onMount } from "svelte";

  const dispatch = createEventDispatcher()

  export let category: CategoryProps

  let statusProcessing = false
  let statusUpdating = false
  let statusRemoving = false

  let enableEditCategory = false
  let editedCategoryName: string
  let editCategoryValid: boolean
  const checkEditCategoryValidity = () => {
    if (editedCategoryName && /([^\s])/.test(editedCategoryName) && editedCategoryName !== category.name) {
      editCategoryValid = true
      return true
    }
    else {
      editCategoryValid = false
      return false
    }
  }
  const updateCategory = async() => {
    statusProcessing = true
    statusUpdating = true
    const formData = new FormData()
    formData.append('id', category.id)
    formData.append('name', editedCategoryName)
    const res = await fetch('/api/categories', {
      method: 'PATCH',
      body: formData
    })
    if (!res.ok) {
      statusProcessing = false
      statusUpdating = false
      const error = await res.json()
      message.set({
        text: `Error: ${error}`,
        timed: true
      })
      return
    }
    if (res.ok) {
      statusProcessing = false
      statusUpdating = false
      enableEditCategory = false
      const processed = await res.json()
      const updatedCategory = processed[0]
      category.name = updatedCategory.name
      editedCategoryName = updatedCategory.name
      dispatch('updateCategory', updatedCategory)
      message.set({
        text: 'Category updated.',
        timed: true
      })
    }
  }

  let enableDeleteCategory = false
  const deleteCategory = async() => {
    if (category.items && category.items.length) {
      return
      // const { data, error } = await supabase
      //   .from('items')
      //   .update({ category: null })
      //   .match({ category: category.id })
      // if (error) {
      //   message.set({
      //     text: `Error: ${error.message}`,
      //     timed: true
      //   })
      //   console.log('error removing category:', error)
      //   return
      // }
      // if (data) {
      //   console.log(data)
      // }
    }
    else {
      statusProcessing = true
      statusRemoving = true
      const formData = new FormData()
      formData.append('id', category.id)
      const res = await fetch('/api/categories', {
        method: 'DELETE',
        body: formData
      })
      if (!res.ok) {
        statusProcessing = false
        statusRemoving = false
        // message.set({
        //   text: `Error: ${error.message}`,
        //   timed: true
        // })
        // console.error('There was a problem:', error)
        return
      }
      if (res.ok) {
        const processed = await res.json()
        const deletedCategory = processed[0]
        // console.log(deletedCategory)
        statusProcessing = false
        statusRemoving = false
        enableDeleteCategory = false
        // menuVisible = false
        dispatch('removeCategory', deletedCategory)
        message.set({
          text: 'Category successfully deleted.',
          timed: true
        })
      }
    }
  }
  onMount(() => {
    editedCategoryName = category.name
  })
</script>

<div class="category-panel bg-red-800 items-center flex my-2 p-2">
  <div class="category-name flex-1">
    <input
      type="text"
      class="category-name-field bg-transparent p-1 w-full"
      class:editing = {enableEditCategory}
      disabled="{!enableEditCategory}"
      bind:value="{editedCategoryName}"
      on:input="{checkEditCategoryValidity}"
    >
  </div>
  <div class="actions flex ml-4">
    <div class="action">
      {#if enableEditCategory === false && enableDeleteCategory === false}
        <button type="button" class="align-middle" on:click="{() => enableEditCategory = true}">
          <Icon icon="clarity:edit-line" />
        </button>
      {/if}
      {#if enableEditCategory === true}
        <button type="button" class="align-middle" disabled="{!editCategoryValid || statusUpdating}" on:click={updateCategory}>
          <Icon icon="clarity:check-line" />
        </button>
        <button type="button" class="align-middle" on:click="{() => enableEditCategory = false}">
          <Icon icon="clarity:close-line" />
        </button>
      {/if}
    </div>
    <div class="action ml-2">
      {#if enableEditCategory === false && enableDeleteCategory === false}
        <button type="button" class="align-middle" on:click="{() => enableDeleteCategory = true}">
          <Icon icon="clarity:trash-line" />
        </button>
      {/if}
      {#if enableDeleteCategory === true}
        <span class="confirm-text mr-2" style="font-size: 80%;">Delete?</span>
        <button type="button" class="align-middle" disabled={statusRemoving} on:click={deleteCategory}>
          <Icon icon="clarity:check-line" />
        </button>
        <button type="button" class="align-middle" on:click="{() => enableDeleteCategory = false}">
          <Icon icon="clarity:close-line" />
        </button>
      {/if}
    </div>
  </div>
</div>

<style>
  .category-name-field {
    pointer-events: none;
  }
  .category-name-field.editing {
    background-color: black;
    pointer-events: auto;
  }
</style>