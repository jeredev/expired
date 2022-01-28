<slot />

<style global windi:global windi:preflights:global windi:safelist:global>
  :root {
    --gray: #666;
  }
  body {
    background-color: #181818;
  }
  ::-webkit-calendar-picker-indicator {
    filter: invert(1);
  }
  .btn {
    @apply
    px-4 py-1 text-sm text-red-600 font-semibold
    rounded-full border border-red-600 dark:border-red-800
    hover:text-white hover:bg-red-600 hover:border-transparent
    disabled:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:text-red-600 disabled:hover:border-red-600
    focus:outline-none focus:ring-2 ring-red-600 ring-opacity-40;
  }
  .btn.active {
    background-color: rgba(220, 38, 38, var(--tw-border-opacity));
    color: white;
    border-color: rgba(220, 38, 38, var(--tw-border-opacity));
  }
</style>
