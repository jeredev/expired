/// <reference types="@sveltejs/kit" />

// See https://kit.svelte.dev/docs/types#the-app-namespace
// for information about these interfaces
declare namespace App {
	interface Locals {
    user: {
      id: string,
      account: {
        created_at: string,
        id: string,
        customer_id: string,
        owner: string,
        product_id: string,
        subscription_id: string,
        subscription_status: string,
        updated_at: string
      }
    } | null
  }
	// interface Platform {}
	interface Session {
    user: {
      id: string,
      account: {
        created_at: string,
        id: string,
        customer_id: string,
        owner: string,
        product_id: string,
        subscription_id: string,
        subscription_status: string,
        updated_at: string
      }
    } | null
  }
	// interface Stuff {}
}

declare interface CategoryProps {
  id: string,
  name: string,
  creator?: string,
  items?: []
}

declare interface ItemProps {
  id: string,
  name: string,
  startTime: Date,
  endTime: Date,
  category?: {
    id: string,
    name: string
  } | null,
  // category?: string | {
  //   id: string,
  //   name: string
  // },
  imagePath?: string,
  image?: string,
  creator?: string
}