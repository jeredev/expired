import { readable, writable, type Writable } from 'svelte/store';
import { browser } from '$app/env';

// Can this be done? Should this be done?
export const categories = writable<Array<CategoryProps> | null>(null);

interface Message {
  text: string,
  timed: boolean
}

export const message: Writable<Message | null> = writable({
  text: '',
  timed: false
});

export const time = readable(new Date().getTime(), function start(set) {
  const interval = setInterval(() => {
		set(new Date().getTime());
	}, 1000);
	return function stop() {
		clearInterval(interval);
	};
})

export const displayMode = writable(browser && (localStorage.getItem('displayMode') || 'list'));
export const sortingMode = writable(browser && (localStorage.getItem('sortingMode') || 'endtime-descending'));
export const timeStatusMode = writable(browser && (localStorage.getItem('timeStatusMode') || 'all'));

displayMode.subscribe((val) => browser && localStorage.setItem('displayMode', val.toString()));
sortingMode.subscribe((val) => browser && localStorage.setItem('sortingMode', val.toString()));
timeStatusMode.subscribe((val) => browser && localStorage.setItem('timeStatusMode', val.toString()));