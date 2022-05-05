import { writable } from 'svelte/store';
import { browser } from '$app/env';

export const message = writable({
  text: '',
  timed: false
});

export const displayMode = writable(browser && (localStorage.getItem('displayMode') || 'list'));
export const sortingMode = writable(browser && (localStorage.getItem('sortingMode') || 'endtime-descending'));
export const timeStatusMode = writable(browser && (localStorage.getItem('timeStatusMode') || 'all'));

displayMode.subscribe((val) => browser && localStorage.setItem('displayMode', val.toString()));
sortingMode.subscribe((val) => browser && localStorage.setItem('sortingMode', val.toString()));
timeStatusMode.subscribe((val) => browser && localStorage.setItem('timeStatusMode', val.toString()));