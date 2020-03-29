<script>
  import store from "./store";
  import { onDestroy } from "svelte";
  let counter, name;
  const unsubscribe = store.subscribe(({ state }) => {
    counter = state.counter;
    name = state.person.name;
  });
  onDestroy(() => unsubscribe());
</script>

<h1>The counter value is {counter}</h1>
<h1>My name is {name}</h1>
