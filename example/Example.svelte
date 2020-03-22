<script>
  import store from "./store";
  import { onDestroy } from "svelte";
  import Counter from "./Counter.svelte";
  import Increment from "./Increment.svelte";
  import Decrement from "./Decrement.svelte";
  let loading;
  const unsubscribe = store.subscribe(state => (loading = state.loading));
  onDestroy(() => unsubscribe());
</script>

<nav class="navbar navbar-dark bg-dark">
  <span class="navbar-brand mb-0 h1">svelte-createstore example</span>
</nav>

<div class="container-fluid mt-2">
  <div class="row">
    <div class="col">
      {#if loading}
        <h1>Loading ...</h1>
      {:else}
        <Counter />
        <hr />
        <Increment />
        <Decrement />
      {/if}
    </div>
  </div>

</div>
<svelte:head>
  <link
    rel="stylesheet"
    href="https://stackpath.bootstrapcdn.com/bootstrap/4.4.1/css/bootstrap.min.css" />
</svelte:head>
