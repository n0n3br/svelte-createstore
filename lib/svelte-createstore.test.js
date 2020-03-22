"use strict";

var _svelteCreatestore = require("./svelte-createstore");

describe("svelte-createstore", function () {
  var store, unsubscribe;
  beforeEach(function () {
    store = (0, _svelteCreatestore.createStore)({
      initialState: 1,
      actions: {
        increment: function increment(state) {
          return state++;
        },
        decrement: function decrement(state) {
          return state--;
        }
      }
    });
  });
  afterEach(function () {
    if (unsubscribe) {
      unsubscribe();
    }
  });
  it("should create a store with initial state configured", function () {
    var b;
    store.subscribe(function (_ref) {
      var state = _ref.state;
      return b = state;
    });
    expect(b).toBe(0);
  });
});