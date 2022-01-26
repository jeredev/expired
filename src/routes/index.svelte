<script>
  import { supabase, user } from "$lib/db";
  import { onDestroy, onMount } from "svelte";
  import Icon from '@iconify/svelte'
  import {
    getTime,
  } from 'date-fns'

  // import Layout from "./__layout.svelte";

  import AddItem from "../components/AddItem.svelte"
  import Item from "../components/Item.svelte"
  import Messenger from "../components/Messenger.svelte"
  import { message } from "../stores";

  let allItems = []
  let items = []

  let time = getTime(new Date())

  let email;
  let password;

  let addMenuActive = false

  const logIn = async () => {
    const { user, error } = await supabase.auth.signIn({
      email: email,
      password: password,
    });
    message.set('Successfully logged in.')
  };

  const logOut = async () => {
    const { error } = await supabase.auth.signOut();
    message.set('Successfully logged out.')
  };

  const addItems = (e) => {
    const newItems = e.detail
    newItems.forEach(item => {
      item.time = time
      items = [...items, item]
    });
  }

  const removeItem = (e) => {
    const index = items.findIndex((x) => x.id === e.detail.id)
    if (index !== -1) {
      items = [...items.slice(0, index), ...items.slice(index + 1)]
    }
  }

  const resetPwd = () => {
    console.log('resetting!')
  };

  let clock;

  const runClock = () => {
    time = getTime(new Date())
  };

  /* Sorting */

  // Level One
  let categorized = false
  // Level Two
  let timeStatusMode = 'all'
  // Level Three
  let sortingMode = 'alpha-ascending'

  const getLifespan = (startTime, endTime) => {
    return getTime(new Date(endTime)) - getTime(new Date(startTime))
  }
  const getTimeElapsed = (startTime) => {
    return time - getTime(new Date(startTime))
  }
  const filterAll = () => {
    timeStatusMode = 'all'
    items = allItems
  }
  const filterSafe = () => {
    timeStatusMode = 'safe'
    const safe = allItems.filter(item => {
      let timeElapsed = getTimeElapsed(item.startTime)
      let lifespan = getLifespan(item.startTime, item.endTime)
      return timeElapsed < lifespan
    })
    items = safe
  }
  const filterExpired = () => {
    timeStatusMode = 'expired'
    const expired = allItems.filter(item => {
      let timeElapsed = getTimeElapsed(item.startTime)
      let lifespan = getLifespan(item.startTime, item.endTime)
      return timeElapsed > lifespan
    })
    items = expired
  }
  const sortAlphaAsc = () => {
    sortingMode = 'alpha-ascending'
    console.log(sortingMode)
    if (categorized && categories) {
      categories.forEach((category) => {
        const sortedItems = [...category.items].sort((a, b) => a.name.localeCompare(b.name))
        category.items = []
        window.setTimeout(() => {
          category.items = sortedItems
          console.log('completed')
        }, 400)
      })
      if (uncategorizedItems) {
        uncategorizedItems = [...uncategorizedItems].sort((a, b) => a.name.localeCompare(b.name))
      }
    } else {
      items = [...items].sort((a, b) => a.name.localeCompare(b.name))
    }
  }
  const sortAlphaDesc = () => {
    sortingMode = 'alpha-descending'
    console.log(sortingMode)
    if (categorized && categories) {
      categories.forEach((category) => {
        const sortedItems = [...category.items].sort((a, b) => b.name.localeCompare(a.name))
        category.items = []
        window.setTimeout(() => {
          category.items = sortedItems
          console.log('completed')
        }, 400)
      })
      if (uncategorizedItems) {
        uncategorizedItems = [...uncategorizedItems].sort((a, b) => b.name.localeCompare(a.name))
      }
    } else {
      items = [...items].sort((a, b) => b.name.localeCompare(a.name))
    }
  }
  const sortEndtimeAsc = () => {
    sortingMode = 'endtime-ascending'
    console.log(sortingMode)
    if (categorized && categories) {
      categories.forEach((category) => {
        const sortedItems = [...category.items].sort((a, b) => {
          return new Date(b.endTime) - new Date(a.endTime)
        })
        category.items = []
        window.setTimeout(() => {
          category.items = sortedItems
          console.log('completed')
        }, 400)
      })
      if (uncategorizedItems) {
        uncategorizedItems = [...uncategorizedItems].sort((a, b) => {
          return new Date(b.endTime) - new Date(a.endTime)
        })
      }
    } else {
      items = [...items].sort((a, b) => {
        return new Date(b.endTime) - new Date(a.endTime)
      })
    }
  }
  const sortEndtimeDesc = () => {
    sortingMode = 'endtime-descending'
    console.log(sortingMode)
    if (categorized && categories) {
      categories.forEach((category) => {
        const sortedItems = [...category.items].sort((a, b) => {
          return new Date(a.endTime) - new Date(b.endTime)
        })
        category.items = [...sortedItems]
        // category.items = []
        // window.setTimeout(() => {
        //   category.items = [...sortedItems]
        //   console.log('completed')
        // }, 400)
      })
      if (uncategorizedItems) {
        uncategorizedItems = [...uncategorizedItems].sort((a, b) => {
          return new Date(a.endTime) - new Date(b.endTime)
        })
      }
    } else {
      items = [...items].sort((a, b) => {
        return new Date(a.endTime) - new Date(b.endTime)
      })
    }
  }

  let categories = []
  const getCategories = async() => {
    const { data, error } = await supabase
      .from('categories')
      .select()
    if (data) return data
  }

  let uncategorizedItems
  // const toggleCategories = () => {
  //   categorized = !categorized
  // }

  onMount(async() => {
    clock = window.setInterval(runClock, 1000);
    const { data, error } = await supabase
      .from('items')
      .select(`
        id,
        name,
        startTime,
        endTime,
        category (
          id,
          name
        ),
        imagePath
      `)
    items = data
    allItems = data
    categories = await getCategories()
    if (categories) {
      categories.forEach((category) => {
        // category.items = []
        category.items = items.filter((item) => {
          if (item.category?.id === category.id) {
            return true
          }
        })
      })
      uncategorizedItems = items.filter((item) => !item.category)
    }
  });
  onDestroy(() => {
    clearInterval(clock)
  })
</script>

<div class="decay mx-auto max-w-50rem p-4 text-white">
  <Messenger />
  <div class="header">
    {#if $user}
      <button on:click={logOut} class="btn">Log Out</button>
    {:else}
      <form on:submit|preventDefault={logIn} class="form form--login">
        <div class="login-form-fields">
          <input
            bind:value="{email}"
            type="email"
            autocomplete="email"
            placeholder="Email address"
            required
            class="bg-black text-white p-2"
          >
          <input
            bind:value="{password}"
            type="password" 
            autocomplete="current-password" 
            placeholder="Password"
            class="bg-black text-white p-2"
          >
          <button on:click={resetPwd} type="button" class="btn">
            Reset
          </button>
          <button type="submit" class="btn">
            Login
          </button>
        </div>
      </form>
    {/if}
  </div>
  {#if $user}
    <div class="homebase">
      <div class="panel">
        <button class="btn">Search</button>
        <button class="btn" on:click={() => { addMenuActive = !addMenuActive }}>Add Item</button>
      </div>
      <div class="add-item-menu">
        <AddItem on:add={addItems} active={addMenuActive} />
      </div>
      <div class="search-menu">
        
      </div>
      <div class="sector my-4">
        <h2 class="my-2">
          Sorting
        </h2>
        <div class="grid grid-cols-2 gap-2 my-2">
          <button class="btn" disabled="{ categorized === false }" on:click="{() => { categorized = false }}">List</button>
          <button class="btn" disabled="{ categorized === true }" on:click="{() => { categorized = true }}">Categories</button>
        </div>
        <div class="grid grid-cols-3 gap-2 my-2">
          <button class="btn" disabled="{ timeStatusMode === 'all' }" on:click="{filterAll}">
            All
          </button>
          <button class="btn" disabled="{ timeStatusMode === 'safe' }" on:click="{filterSafe}">
            Safe
          </button>
          <button class="btn" disabled="{ timeStatusMode === 'expired' }" on:click="{filterExpired}">
            Expired
          </button>
        </div>
        <div class="grid grid-cols-4 gap-2">
          <button class="btn whitespace-nowrap" disabled="{ sortingMode === "alpha-ascending" }" on:click={sortAlphaAsc}>
            A <Icon icon="clarity:arrow-line" inline={true} style="display: inline-block; transform:rotate(90deg);" /> Z
          </button>
          <button class="btn whitespace-nowrap" disabled="{ sortingMode === "alpha-descending" }" on:click={sortAlphaDesc}>
            Z <Icon icon="clarity:arrow-line" inline={true} style="display: inline-block; transform:rotate(90deg);" /> A
          </button>
          <button class="btn whitespace-nowrap" disabled="{ sortingMode === "endtime-ascending" }" on:click={sortEndtimeAsc}>
            <Icon icon="clarity:clock-line" inline={true} style="display: inline-block;" />
            <Icon icon="clarity:arrow-line" inline={true} style="display: inline-block;" />
          </button>
          <button class="btn whitespace-nowrap" disabled="{ sortingMode === "endtime-descending" }" on:click={sortEndtimeDesc}>
            <Icon icon="clarity:clock-line" inline={true} style="display: inline-block;" />
            <Icon icon="clarity:arrow-line" inline={true} style="display: inline-block; transform:rotate(180deg);" />
          </button>
        </div>
      </div>
    </div>
    <div class="items">
      {#if items.length}
        <div class="items-listing">
          {#if categorized}
            {#each categories as category}
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
                  {#each category.items as item}
                    <Item item={item} time={time} categories={categories} on:remove={removeItem} />
                  {/each}
                </div>
              </div>
            {/each}
            {#if uncategorizedItems}
              <div class="grouping">
                <div class="category bg-red-800 gap-2 grid p-2">
                  <div class="category__name">
                    Uncategorized
                  </div>
                  <div class="category__panel">
                    <button>
                      <Icon icon="clarity:plus-line" />
                    </button>
                  </div>
                </div>
                <div class="items-list">
                  {#each uncategorizedItems as item}
                    <Item item={item} time={time} categories={categories} on:remove={removeItem} />
                  {/each}
                </div>
              </div>
            {/if}
          {:else}
          {#each items as item}
            <Item item={item} time={time} categories={categories} on:remove={removeItem} />
          {/each}
        {/if}
        </div>
      {:else}
        <p>No items found</p>
      {/if}
    </div>
  {:else}
    Please log in.
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