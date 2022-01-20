<script>
  import { onDestroy, onMount } from "svelte";
  // import { message } from "../stores"

  // const dispatch = createEventDispatcher();

  let active = true
  const duration = 2500
  // let message
  let timeBomb

  const transmitMessage = (e) => {
    console.log(`transmitting`)
    active = true
    // message = e.message
    if (timeBomb) window.clearTimeout(timeBomb)
    timeBomb = window.setTimeout(() => {
      active = false
    }, duration)
  }

  message.subscribe(value => {
    console.log(value)
  })
  
  onMount(() => {
    // emitter.on('transmitMessage', transmitMessage)
  });
  onDestroy(() => {
    if (timeBomb) window.clearTimeout(timeBomb)
  });
  
  
</script>

<div class="message" class:active>
  <div class="text">
    <!-- { message }  -->
    <button on:click="{transmit}">Transmit</button>
  </div>
  <div class="elapser">
    <div class="measure"></div>
  </div>
</div>

<style>
  .message {
    background-color: #020912;
    border: 1px solid #fff;
    box-shadow: 0 0 5rem 2rem #020912;
    display: grid;
    grid-gap: 1rem;
    grid-template-columns: max-content 3rem;
    left: 50%;
    max-width: 40rem;
    opacity: 0;
    padding: 0.5rem 1rem;
    pointer-events: none;
    position: fixed;
    top: 25%;
    transform: translate(-50%);
    transition: 400ms;
    z-index: -1;
  }
  .message.active {
    opacity: 1;
    pointer-events: auto;
    z-index: 100;
  }
  .elapser {
    border: 1px solid var(--blue);
    margin: 0.33rem 0 0;
    overflow: hidden;
    position: relative;
    width: 100%;
  }
  .elapser .measure {
    background-color: rgba(255, 255, 255, 0.65);
    clip-path: polygon(0% 0%, calc(100% - 1rem) 0%, 100% 100%, 0 100%);
    height: 100%;
    transform-origin: left;
    position: relative;
    transition: transform 400ms;
    width: 100%;

    transform: translateX(-30%);
  }
  .elapser .measure::before {
    background-image: linear-gradient(to left, rgba(255, 255, 255, 0.95) 40%, rgba(255, 255, 255, 0.15));
    content: '';
    display: block;
    filter: drop-shadow(0 0 10px #000);
    position: absolute;
    height: 100%;
    right: 40%;
    width: 20%;
  }

</style>