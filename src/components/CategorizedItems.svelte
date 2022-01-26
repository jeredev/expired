<script>
  import Item from "../components/Item.svelte"
  import Icon from '@iconify/svelte'

  export let items
  export let categories
  export let time

  const removeItem = (e) => {
    const index = items.findIndex((x) => x.id === e.detail.id)
    if (index !== -1) {
      items = [...items.slice(0, index), ...items.slice(index + 1)]
    }
  }
</script>

<div class="grouping">
  <div class="category bg-red-800 gap-2 grid p-2">
    <div class="category__name">
      {category.name}
    </div>
    <div class="category__panel">
      <button>
        <Icon icon="clarity:plus-line" />
      </button>
    </div>
  </div>
  <div class="items-list">
    {#each items as item}
      <Item item={item} time={time} categories={categories} on:remove={removeItem} />
    {/each}
  </div>
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