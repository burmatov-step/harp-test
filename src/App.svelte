<script >
  import Test from "./Test.svelte";
  let canvas;
</script>

<canvas id="map" bind:this={canvas} />

{#if canvas}
  <Test bind:canvas />
{/if}

<style>
</style>