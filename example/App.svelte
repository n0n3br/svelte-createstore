<script>
  import store from "./store";
  import { onDestroy } from "svelte";
  import Display from "./Display.svelte";
  import Increment from "./Increment.svelte";
  import Decrement from "./Decrement.svelte";
  import Person from "./Person.svelte";
  let loading;
  const unsubscribe = store.subscribe(state => (loading = state.loading));
  onDestroy(() => unsubscribe());
</script>

<nav class="navbar navbar-dark bg-dark">
  <span class="navbar-brand mb-0 h1">svelte-createstore example</span>
</nav>

<div class="container-fluid mt-2">
  {#if loading}
    <div class="row">
      <div class="col">
        <h1>Loading ...</h1>
      </div>
    </div>
  {:else}
    <div class="row">
      <div class="col">
        <Display />
      </div>
    </div>
    <hr />
    <div class="row mt-5">
      <div class="col">
        <Increment />
        <Decrement />
      </div>
    </div>
    <div class="row mt-5">
      <div class="col">
        <Person />
      </div>
    </div>
  {/if}

</div>
<svelte:head>
  <link
    rel="stylesheet"
    href="https://stackpath.bootstrapcdn.com/bootstrap/4.4.1/css/bootstrap.min.css" />
</svelte:head>
