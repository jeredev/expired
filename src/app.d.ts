/// <reference types="@sveltejs/kit" />

// See https://kit.svelte.dev/docs/types#the-app-namespace
// for information about these interfaces
declare namespace App {
	// interface Locals {}
	// interface Platform {}
	interface Session {
    user: {
      id: string
    } | null
  }
	// interface Stuff {}
}

declare interface CategoryProps {
  id: string,
  name: string,
  creator?: string
}

declare interface ItemProps {
  id: string,
  name: string,
  startTime: Date,
  endTime: Date,
  category?: string | {
    id: string,
    name: string
  },
  imagePath?: string,
  image?: string,
  creator?: string
}