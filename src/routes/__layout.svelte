
<!-- <script context="module">
	export function load({ url }) {
    console.log(url.hash)
    // console.log(url.href) // This is correct and matches input
    const params = new URLSearchParams(url.href)
    for(var pair of params.entries()) {
      console.log(pair[0]+ ', '+ pair[1]);
    }
    // if (new URLSearchParams(url.href).get('access_token')) {
    //   console.log('access')
    // }
    if (params.get('type') === 'recovery') {
      console.log('go to reset page')
      return {
        status: 302,
        redirect: '/reset'
      }
    }

    return {}
    // if (params.get('type') === 'recovery') {
    //   // Redirect to Password Reset page
    // }
		

		// ...
	}
</script> -->
<script>
  import { supabase } from "$lib/supabase";
  import { session } from "$app/stores";
  import { browser } from "$app/env";
  import * as Sentry from "@sentry/browser";
  import { BrowserTracing } from "@sentry/tracing";

  if (browser) {
    $session = supabase.auth.session()
    supabase.auth.onAuthStateChange((event, sesh) => {
      handleAuthChange(event, sesh)
      $session = sesh
    })
    // const user = supabase.auth.user()
    // console.log(user)
  }

  const handleAuthChange = async(event, session) => {
    // console.log('handleAuthChange')
    const res = await fetch('/api/auth', {
      method: 'POST',
      headers: new Headers({ 'Content-Type': 'application/json' }),
      credentials: 'same-origin',
      body: JSON.stringify({ event, session })
    })
    // if (!response.ok) {
    //   throw new Error(`HTTP error! status: ${response.status}`);
    // }
  }

  // console.log(supabase.auth.session())

  Sentry.init({
    dsn: "https://6bc5561aeb964cc69945653710add9a2@o998740.ingest.sentry.io/6198797",
    integrations: [new BrowserTracing()],

    // Set tracesSampleRate to 1.0 to capture 100%
    // of transactions for performance monitoring.
    // We recommend adjusting this value in production
    tracesSampleRate: 1.0,
  });
  
</script>

<slot />

<style global windi:global windi:preflights:global windi:safelist:global>
  /* @import url('https://fonts.googleapis.com/css2?family=Encode+Sans&family=JetBrains+Mono&display=swap'); */
  :root {
    --gray: #666;
    /* --red: rgba(220, 38, 38, 1); */
    --red: #b22020;
  }
  body {
    background-color: #181818;
    font-family: 'Inter', sans-serif;
  }
  ::-webkit-calendar-picker-indicator {
    filter: invert(1);
  }
  a {
    color: var(--red);
    text-decoration: underline;
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
