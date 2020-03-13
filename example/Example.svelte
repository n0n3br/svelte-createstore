<div class='container'>
	<div class='row'>
		<div class='col'>
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