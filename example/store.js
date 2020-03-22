import { createStore } from "../src/svelte-createstore";

export default createStore({
  initialState: 0,
  actions: {
    increment: (state, amount) =>
      new Promise(resolve => {
        setTimeout(() => {
          resolve(state + amount);
        }, 1000);
      }),
    decrement: (state, amount) => (state > amount ? state - amount : 0)
  }
});
