import { createStore } from "./svelte-createstore";

describe("svelte-createstore", () => {
  let store, unsubscribe, target;

  beforeEach(() => {
    store = createStore({
      initialState: 0,
      actions: {
        increment: state => state + 1,
        decrement: state => state - 1,
        incrementWithArgs: (state, amount) => state + amount,
        incrementAsync: state =>
          new Promise(resolve => setTimeout(() => resolve(state + 1), 1000))
      }
    });
    unsubscribe = store.subscribe(({ state }) => {
      target = state;
    });
  });
  afterEach(() => {
    unsubscribe();
    store = null;
    unsubscribe = null;
    target = null;
  });

  it("should create a store with initial state configured", () => {
    expect(target).toBe(0);
  });
  it("should execute sync actions", () => {
    store.increment();
    expect(target).toBe(1);
    store.decrement();
    expect(target).toBe(0);
  });
  it("should execute sycn action with argument", () => {
    store.incrementWithArgs(5);
    expect(target).toBe(5);
  });
  it("should execute async action", async () => {
    await store.incrementAsync();
    expect(target).toBe(1);
  });
});
