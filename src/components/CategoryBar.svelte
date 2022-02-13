<script>
  import { supabase } from "$lib/supabase";
  import Icon from '@iconify/svelte'
  import { message } from "../stores";
  import { createEventDispatcher, onMount } from "svelte";

  const dispatch = createEventDispatcher()

  export let category

  let statusProcessing = false
  let statusUpdating = false
  let statusRemoving = false

  let enableEditCategory = false
  let editedCategoryName
  let editCategoryValid
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
    const { data, error } = await supabase
      .from('categories')
      .update({
        name: editedCategoryName,
      })
      .match({ id: category.id })
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
      statusProcessing = false
      statusUpdating = false
      enableEditCategory = false
      category.name = data[0].name
      editedCategoryName = data[0].name
      dispatch('updateCategory', data[0])
      message.set({
        text: 'Category updated.',
        timed: true
      })
    }
  }

  let enableDeleteCategory = false
  const deleteCategory = async() => {
    console.log('delete')
    if (category.items.length) {
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
      const { data, error } = await supabase
        .from('categories')
        .delete()
        .match({ id: category.id })
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
        statusProcessing = false
        statusRemoving = false
        enableDeleteCategory = false
        // menuVisible = false
        dispatch('removeCategory', data[0])
        message.set({
          text: 'Category successfully deleted.',
          timed: true
        })
      }
    }
    // const { data, error } = await supabase
    //   .from('categories')
    //   .insert([
    //     {
    //       name: newCategory.trim(),
    //     },
    //   ])
    // if (error) {
    //   message.set({
    //     text: `Error: ${error.message}`,
    //     timed: true
    //   })
    //   console.log('error adding new category:', error)
    //   return
    // }
    // if (data) {
    //   categories = await getCategories()
    //   // newCategory = null
    //   // addingCategory = false
    //   // fileInput.value = null // Doesn't work
    // }
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