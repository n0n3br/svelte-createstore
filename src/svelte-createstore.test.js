import { createStore } from "./svelte-createstore";

describe("svelte-createstore", () => {
  let store, unsubscribe;

  beforeEach(() => {
    store = createStore({
      initialState: 1,
      actions: { increment: state => state++, decrement: state => state-- }
    });
  });

  afterEach(() => {
    if (unsubscribe) {
      unsubscribe();
    }
  });

  it("should create a store with initial state configured", () => {
    let b;
    store.subscribe(({ state }) => (b = state));
    expect(b).toBe(0);
  });
});
