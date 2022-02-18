/// <reference types="@sveltejs/kit" />

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

//Default SvelteKit App Objects
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

//#region Ensure Svelte file endings have a type for TypeScript
/**
 * These declarations tell TypeScript that we allow import of Svelte files in TS files, e.g.
 * ```
		import Component from './Component.svelte';
	 ```
 */
   declare module '*.svelte' {
    export { SvelteComponent as default } from 'svelte';
  }
  //#endregion
  
  //#region Ensure image file endings have a type for TypeScript
  /**
   * These declarations tell TypeScript that we allow import of images, e.g.
   * ```
      <script lang='ts'>
        import successkid from 'images/successkid.jpg';
      </script>
      <img src="{successkid}">
     ```
   */
  declare module "*.gif" {
    const value: string;
    export = value;
  }
  
  declare module "*.jpg" {
    const value: string;
    export = value;
  }
  
  declare module "*.jpeg" {
    const value: string;
    export = value;
  }
  
  declare module "*.png" {
    const value: string;
    export = value;
  }
  
  declare module "*.svg" {
    const value: string;
    export = value;
  }
  
  declare module "*.webp" {
    const value: string;
    export = value;
  }
  //#endregion