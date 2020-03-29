<script>
  import store from "./store";
  let name = "";
  const setName = () => {
    if (!name) return;
    store.person.setName(name);
    name = "";
  };
</script>

<div class="row">
  <div class="col">
    <input
      type="text"
      bind:value={name}
      placehold="New name"
      class="form-control" />
  </div>
  <div class="col">
    <button class="btn btn-success" on:click={setName} disabled={!name}>
      Change Name
    </button>
  </div>
</div>
