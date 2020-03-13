# svelte-createstore
Svelte 3 snippet to create a store with support do sync and async actions

## why i did this

Svelte 3 provides a basic store that is perfectly fine for small applications.

When your app grows, it's always a good idea to extract the business logic from components to keep them lean and focused on their concern, wich is interact with the user.

Inspired by other state management solutions, I ´wrote a code that automatically creates a writable store and ´provides access to the actions, so that components can interact with the data withou having to know the rules to do it. 
I also addedd suport for async actions, so it can be used in api fetch operations, for example.

## instalation

Use your favorite package manager
```node
npm install --save @non3br/svelte-createstore

yarn add @n0n3br/svelte-createstore
```

## how to use

createStore is a method that requires 2 parameters:

  * initialState: value that will be loaded in the state key of the store once it's created. It can be anything, execpt for null and undefined.
  
  * actions: and object that describes the actions that will update the store state. This is the only way to update the store, no update or set default Svelte store methods are supported. Each action is composed of a name (the key itself) and a function that receives the current state as a parameter. The function must return the updated state. Async functions are supported.

The execution of createStore returns an object that contains all the actions provided and can be executed by any component.

The returned object can also be used to subscribe to changes using the subscribe method like Svelte native store. 

The callback function of the subscribe method will receive as a parameter an object with 3 keys:

  * state: the current state of the store
    
  * error: if any error occurrs during an action execution, it will contain the error message. Otherwise is null
    
  * loading: it turns to true when an async action is executed and to false when it ends.
  
 ## example
 
 ```javascript
 // file store.js
 import { createStore } from "../src/svelte-createstore";

export default createStore({
  initialState: 1,
  actions: {
    increment: state =>
      new Promise(resolve => {
        setTimeout(() => {
          resolve(state + 1);
        }, 1000);
      }),
    decrement: state => (state > 0 ? state - 1 : 0)
  }
});
 
```
 ```html
 <!-- file App.svelte -->
 {#if loading }
 <h1>Loading ...</h1>
 {:else}
 <h1>The counter value is {counter}</h1>
 <button on:click={store.increment}>Increment</button>
 <button on:click={store.decrement}>Decrement</button>
 {/if}
<script>
  import store from "./store";
  import { onDestroy } from "svelte";
  let state, loading, error;
  const unsubscribe = store.subscribe(currentState => {
    { state, loading, error } = currentState;
  });
  onDestroy(() => unsubscribe());
</script>


