<script lang="ts">
  import Item from "../components/Item.svelte"
  import Icon from '@iconify/svelte'
  import { slide } from 'svelte/transition'

  let itemsVisible = true

  export let items: Array<ItemProps> = []
  export let categories: Array<CategoryProps>
  export let category: CategoryProps

  // &: categories = getContext('categories')

</script>

<div class="grouping">
  <div class="category bg-red-800 gap-2 grid p-2">
    <div class="category__name">
      {#if category.name}
        {category.name}
      {:else}
        Uncategorized
      {/if}
    </div>
    <div class="category__panel flex">
      {#if items.length}
        <button on:click={() => { itemsVisible = !itemsVisible }}>
          {#if itemsVisible}
          <Icon icon="clarity:minus-line" style="font-size: 1.5rem;" />
          {:else}
            <Icon icon="clarity:plus-line" style="font-size: 1.5rem;" />
          {/if}
        </button>
      {/if}
    </div>
  </div>
  {#if itemsVisible}
    <div transition:slide|local class="items-list">
      {#each items as item}
        <Item categories={categories} item={item} on:remove on:update />
      {/each}
    </div>
  {/if}
</div>

<style>
  .category {
    align-items: center;
    grid-template-columns: 1fr max-content;
    position: sticky;
    top: 0;
    z-index: 2;
  }
</style>