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

describe("modules", () => {
  let store, unsubscribe, storeState;

  beforeEach(() => {
    let storeConfig = {
      initialState: { a: 2 },
      actions: {
        increment: (state, amount) => (state.a += amount)
      },
      modules: {
        test: {
          initialState: { b: 3 },
          actions: {
            increment: (state, amount) => (state.b += amount)
          }
        }
      }
    };
    store = createStore(storeConfig);
    unsubscribe = store.subscribe(({ state }) => {
      storeState = state;
    });
  });
  afterEach(() => {
    unsubscribe();
    store = null;
    unsubscribe = null;
    storeState = null;
  });

  describe("state", () => {
    it("should create initial state with modules", () => {
      let store = createStore(storeConfig);
      let storeState;
      expect(storeState).toStrictEqual({ a: 2, test: { b: 3 } });
      store.unsubscribe();
    });
  });

  describe("actions", () => {
    it("should execute root sync action", () => {
      store.increment(1);
      expect(storeState).toStrictEqual({ a: 3, test: { b: 3 } });
    });
  });
});
