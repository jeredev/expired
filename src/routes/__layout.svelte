<slot />

<style global windi:global windi:preflights:global windi:safelist:global>
  /* @import url('https://fonts.googleapis.com/css2?family=Encode+Sans&family=JetBrains+Mono&display=swap'); */
  :root {
    --gray: #666;
    --red: rgba(220, 38, 38, 1);
  }
  body {
    background-color: #181818;
    font-family: 'Inter', sans-serif;
  }
  ::-webkit-calendar-picker-indicator {
    filter: invert(1);
  }
  .btn {
    @apply
    px-4 py-1 text-sm text-red-600 font-semibold
    rounded-full border border-red-600 dark:border-red-800
    hover:text-white hover:bg-red-600 hover:border-transparent
    disabled:bg-gray-600 disabled:text-white disabled:border-transparent disabled:opacity-50 disabled:cursor-not-allowed
    focus:outline-none focus:ring-2 ring-red-600 ring-opacity-40;
  }
  .btn.active {
    background-color: var(--red);
    color: white;
    border-color: var(--red);
  }
</style>
