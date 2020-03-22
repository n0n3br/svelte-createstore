<script>
  import store from "./store";
</script>

<button class="btn btn-danger" on:click={() => store.decrement(1)}>
  Decrement 1
</button>
<button class="btn btn-danger" on:click={() => store.decrement(5)}>
  Decrement 5
</button>
