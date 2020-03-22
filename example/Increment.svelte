<script>
  import store from "./store";
</script>

<button class="btn btn-primary" on:click={() => store.increment(1)}>
  Increment 1 (Async)
</button>
<button class="btn btn-primary" on:click={() => store.increment(5)}>
  Increment 5 (Async)
</button>
