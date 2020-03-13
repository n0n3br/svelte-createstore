<h1>The counter value is {counter}</h1>
<script>
  import store from "./store";
  import { onDestroy } from "svelte";
  let counter;
  const unsubscribe = store.subscribe(({ state }) => {
    counter = state;
  });
  onDestroy(() => unsubscribe());
</script>
