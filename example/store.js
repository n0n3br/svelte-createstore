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
