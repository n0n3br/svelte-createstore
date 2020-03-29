import { createStore } from "../example/node_modules/@n0n3br/svelte-createstore/lib/svelte-createstore";

describe("svelte-createstore", () => {
  describe("state", () => {
    it("should create a store with initial state configured", () => {
      let storeState;
      let store = createStore({
        initialState: { total: 0 },
        actions: {
          increment: state => ({ total: state.total + 1 }),
          decrement: state => ({ total: state.total - 1 }),
          incrementWithArgs: (state, amount) => {
            total: state.total + amount;
          },
          incrementAsync: state =>
            new Promise(resolve =>
              setTimeout(() => resolve({ total: state.total + 1 }), 1000)
            )
        }
      });
      let unsubscribe = store.subscribe(({ state }) => {
        storeState = state;
      });
      expect(storeState.total).toBe(0);
      unsubscribe();
    });
  });
  describe("actions", () => {
    let store, unsubscribe, storeState;

    beforeEach(() => {
      store = createStore({
        initialState: { total: 0 },
        actions: {
          increment: state => ({ total: state.total + 1 }),
          decrement: state => ({ total: state.total - 1 }),
          incrementWithArgs: (state, amount) => ({
            total: state.total + amount
          }),
          incrementAsync: state =>
            new Promise(resolve =>
              setTimeout(() => resolve({ total: state.total + 1 }), 1000)
            )
        }
      });
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

    it("should execute sync actions", () => {
      store.increment();
      expect(storeState.total).toBe(1);
      store.decrement();
      expect(storeState.total).toBe(0);
    });
    it("should execute sycn action with argument", () => {
      store.incrementWithArgs(5);
      expect(storeState.total).toBe(5);
    });
    it("should execute async action", async () => {
      await store.incrementAsync();
      expect(storeState.total).toBe(1);
    });
  });
  describe("modules", () => {
    let store, unsubscribe, storeState;

    beforeEach(() => {
      let storeConfig = {
        initialState: { a: 2 },
        actions: {
          increment: (state, amount) => ({ a: state.a + amount })
        },
        modules: {
          test: {
            initialState: { b: 3 },
            actions: {
              increment: (state, amount) => ({ b: state.b + amount }),
              incrementAsync: (state, amount) =>
                new Promise(resolve =>
                  setTimeout(() => resolve({ b: state.b + amount }), 1000)
                )
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
        expect(storeState).toStrictEqual({ a: 2, test: { b: 3 } });
      });
    });

    describe("actions", () => {
      it("should execute root sync action", () => {
        store.increment(1);
        expect(storeState).toStrictEqual({ a: 3, test: { b: 3 } });
      });
      it("should execute module async action", async () => {
        await store.test.incrementAsync(2);
        expect(storeState).toStrictEqual({ a: 2, test: { b: 5 } });
      });
    });
  });
});
