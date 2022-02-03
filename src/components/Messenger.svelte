<script>
  import { onDestroy, onMount } from "svelte";
  import { message } from '../stores';

  let active = false
  const duration = 2500
  let timed = false
  let timeBomb
  let text

  const transmitMessage = () => {
    active = true
  }

  const transmitTimedMessage = () => {
    active = true
    if (timeBomb) window.clearTimeout(timeBomb)
    timeBomb = window.setTimeout(() => {
      active = false
      message.set(null)
    }, duration)
  }

  message.subscribe(value => {
    if (value && value.text && value.timed) {
      timed = true
      text = value.text
      transmitTimedMessage()
    }
    if (value && value.text && value.timed === false) {
      timed = false
      text = value.text
      transmitMessage()
    }
    if (!value) {
      active = false
    }
  })
  
  onMount(() => {
    
  });
  onDestroy(() => {
    if (timeBomb) window.clearTimeout(timeBomb)
  });
  
  
</script>

<div class="message" class:active class:timed>
  <div class="text">
    { text } 
  </div>
  <div class="elapser">
    <div class="measure">
      {#if !timed}
        <div class="node"></div>
      {/if}
    </div>
  </div>
</div>

<style>
  .message {
    background-color: #020912;
    border: 1px solid #fff;
    box-shadow: 0 0 5rem 2rem #020912;
    display: grid;
    font-size: 90%;
    grid-gap: 1rem;
    grid-template-columns: max-content 3rem;
    left: 50%;
    max-width: 40rem;
    opacity: 0;
    padding: 0.5rem 1rem;
    pointer-events: none;
    position: fixed;
    top: 18%;
    transform: translate(-50%);
    transition: 400ms;
    z-index: -1;
  }
  .message.active {
    opacity: 1;
    pointer-events: auto;
    z-index: 100;
  }
  .message.active.timed .elapser .measure {
    animation: timed-elapser 2500ms linear forwards;
  }
  .elapser {
    background-color: var(--gray);
    /* border: 1px solid var(--blue); */
    height: 2px;
    margin: 0.7rem 0 0;
    /* overflow: hidden; */
    position: relative;
    width: 100%;
  }
  .elapser .measure {
    
    height: 100%;
    transform-origin: left;
    position: relative;
    width: 100%;
  }
  .elapser .measure .node {
    width: 100%;
    /* background-color: red; */
    position: absolute;
    height: 100%;
    animation: looped-elapser 1.5s linear infinite;
    transform-origin: left;
  }
  .elapser .measure .node::before {
    background-color: #fff;
    content: '';
    display: block;
    filter: drop-shadow(0 0 0.5rem white);
    width: 20%;
    position: absolute;
    right: 0;
    height: 100%;
  }
  .timed .elapser .measure {
    background-color: #fff;
    filter: drop-shadow(0 0 0.5rem white);
    height: 100%;
    transform-origin: left;
    position: relative;
    transform: scaleX(0);
    width: 100%;
  }
  /* .timed .elapser .measure::before {
    display: none;
  } */
  @keyframes timed-elapser {
    0% {
      transform: scaleX(1)
    }
    100% {
      transform: scaleX(0);
    }
  }
  @keyframes looped-elapser {
    50%, 100% {
      transform: scaleX(0);
    }
  }

</style>