import { writable } from "svelte/store";

let store;

const throwError = msg => {
  throw new Error(`[svelte-createstore error] : ${msg}`);
};
const isObject = obj => obj === Object(obj);

const isDate = date =>
  new Date(date).toString() !== "Invalid Date" && !isNaN(new Date(date));

const getState = (module = null) => {
  let $val;
  store.subscribe($ => ($val = $))();
  return $val;
};

const getSchema = (object, output = {}) => {
  for (var key in object) {
    var value = object[key];
    var type = typeof value;
    if (type === "undefined") {
      type = "null";
    }
    if (type === "string" && isDate(value)) {
      type = "date";
    }

    if (type !== "object") {
      output[key] = {
        type: type
      };
    } else {
      output[key] = getSchema(object[key]);
      output[key].type = type;
    }
  }

  return output;
};

const setLoading = module => {
  if (!getState(module).loading)
    store.update(currentState =>
      deepMerge(currentState, {
        loading: true,
        error: null
      })
    );
};

const setError = (error, module) => {
  if (getState(module).error !== error)
    store.update(currentState =>
      deepMerge(currentState, { error, loading: false })
    );
};

const deepMerge = (target, source) => {
  if (!isObject(target) || !isObject(source)) {
    return source;
  }
  Object.keys(source).forEach(key => {
    const targetValue = target[key];
    const sourceValue = source[key];

    if (Array.isArray(targetValue) && Array.isArray(sourceValue)) {
      target[key] = targetValue.concat(sourceValue);
    } else if (isObject(targetValue) && isObject(sourceValue)) {
      target[key] = deepMerge(Object.assign({}, targetValue), sourceValue);
    } else {
      target[key] = sourceValue;
    }
  });
  return target;
};

const isDeepEqual = (a, b) => {
  let s = o =>
    Object.entries(o)
      .sort()
      .map(i => {
        if (i[1] instanceof Object) i[1] = s(i[1]);
        return i;
      });
  return JSON.stringify(s(a)) === JSON.stringify(s(b));
};

const setSuccess = (state, module) => {
  store.update(currentState => {
    return deepMerge(
      currentState,
      !module
        ? { state: { ...state }, loading: false, error: null }
        : { state: { [module]: state }, loading: false, error: null }
    );
  });
};

const mountInitialState = (initialState, modules) => {
  let state = initialState;
  Object.keys(modules || {}).forEach(module => {
    if (!modules[module].initialState)
      throwError(`initialState of module ${module} must be of type Object`);
    state[module] = {
      ...modules[module].initialState
    };
  });
  return state;
};

const mountActions = (actions, modules, moduleName = null) => {
  return deepMerge(
    Object.keys(actions).reduce(
      (memo, key) => ({
        ...memo,
        ...{
          [key]: (...args) => {
            return executeAction(actions[key], moduleName, ...args);
          }
        }
      }),
      {}
    ),
    Object.keys(modules || {}).reduce(
      (memo, key) =>
        deepMerge(
          {
            ...memo
          },
          { [key]: mountActions(modules[key].actions, {}, key) || {} }
        ),
      {}
    )
  );
};

const executeAction = async (action, module = null, ...args) => {
  try {
    let currentState = getState().state;
    if (module) {
      currentState = currentState[module];
    }
    let newState;
    const response = action(currentState, ...args);
    if (response instanceof Promise) {
      setLoading(module);
      newState = await Promise.resolve(response);
    } else {
      newState = response;
    }
    if (
      !isDeepEqual(
        getSchema(deepMerge(currentState, newState)),
        getSchema(currentState)
      )
    ) {
      throwError(
        `action '${action}'${
          module ? " of module " + module + " " : ""
        } returned schema [ ${JSON.stringify(
          getSchema(newState)
        )} ] differs from current state schema [ ${JSON.stringify(
          getSchema(currentState)
        )} ] `
      );
    }
    setSuccess(newState, module);
  } catch (err) {
    setError(err, module);
  }
};

export const createStore = ({
  initialState = null,
  actions = null,
  modules = null
}) => {
  if (!isObject(initialState))
    throwError("initialState must be of type Object");
  if (!actions) throwError("no actions provided");
  if (!isObject(actions)) throwError("actions must be of type Object");
  store = writable({
    state: mountInitialState(initialState, modules),
    loading: false,
    error: null
  });
  const storeActions = mountActions(actions, modules);
  return {
    subscribe: store.subscribe,
    ...storeActions
  };
};
