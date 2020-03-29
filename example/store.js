import { createStore } from "../lib/svelte-createstore";

export default createStore({
  initialState: { counter: 0 },
  actions: {
    increment: (state, amount) =>
      new Promise(resolve => {
        setTimeout(() => {
          resolve({ counter: state.counter + amount });
        }, 1000);
      }),
    decrement: (state, amount) =>
      state.counter > amount
        ? { counter: state.counter - amount }
        : { counter: 0 }
  },
  modules: {
    person: {
      initialState: { name: "Joe " },
      actions: {
        setName: (state, name) => ({ ...state, name }),
        clear: state => ({ name: "" })
      }
    }
  }
});
