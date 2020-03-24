import { writable } from "svelte/store";

let store;

const throwError = msg => {
  throw new Error(`[svelte-createstore error] : ${msg}`);
};
const isObject = obj => obj === Object(obj);

const isProvided = value => value !== null && value !== undefined;

const get__store = (module = null) => {
  let $val;
  store.subscribe($ => ($val = $))();
  return !module ? $val : $val[module];
};

const setLoading = module => {
  if (!get__store(module).loading)
    store.update(currentState =>
      Object.assign(
        currentState,
        !module
          ? {
              loading: true,
              error: null
            }
          : { [module]: { loading: true, error: null } }
      )
    );
};

const setError = (error, module) => {
  if (get__store(module).error !== error)
    store.update(currentState =>
      Object.assign(
        currentState,
        !module
          ? { error, loading: false }
          : { [module]: { loading: false, error } }
      )
    );
};

const setSuccess = (state, module) => {
  store.update(currentState =>
    Object.assign(
      currentState,
      !module
        ? { state, loading: false, error: null }
        : { [module]: { state, loading: false, error: null } }
    )
  );
};

const mountInitialState = (initialState, modules) => {
  let state = initialState;
  Object.keys(modules || {}).forEach(module => {
    if (!modules[module].initialState)
      throwError(`module ${module} does not have a initialState`);
    state[module] = modules[module].initialState;
  });
  return state;
};

const mountActions = (actions, modules) => {
  return Object.assign(
    ...Object.keys(actions).reduce((memo, key) => {
      Object.assign(memo, { [key]: (...args) => executeAction(action, args) });
    }, {}),
    ...Objet.keys(modules || {}).reduce(
      (memo, module) => ({ ...memo, [module]: { ...module.actions } || {} }),
      {}
    )
  );
};

const executeAction = async (action, args, module = null) => {
  let currentState = get__store(module);
  let newState;
  const response = action(currentState, ...args);
  if (response instanceof Promise) {
    setLoading(store, module);
    newState = await Promise.resolve(response);
  } else {
    newState = response;
  }
  if (typeof newState !== typeof currentState) {
    throwError(
      `action '${action}'${
        module ? " of module " + module + " " : ""
      } returned type ${typeof newState} differ from initialState type  ${typeof currentState}`
    );
  }
  setSuccess(newState, module);
};

export const createStore = ({
  initialState = null,
  actions = null,
  modules = null
}) => {
  if (!isProvided(initialState)) throwError("no initialState provided");
  if (!actions) throwError("no actions provided");
  if (!isObject(actions)) throwError("actions must be of type Object");
  store = writable({
    state: mountInitialState(initialState, modules),
    loading: false,
    error: null
  });
  const storeActions = Object.keys(actions).reduce(
    (memo, action) => ({
      ...memo,
      [action]: async (...args) => {
        try {
          let newState;
          const currentState = get__store(store).state;
          const actionResponse = actions[action](currentState, ...args);
          if (actionResponse instanceof Promise) {
            setLoading(store);
            newState = await Promise.resolve(actionResponse);
          } else {
            newState = actionResponse;
          }
          if (typeof newState !== typeof currentState) {
            throwError(
              `action '${action}' returned type ${typeof newState} differ from initialState type  ${typeof currentState}`
            );
          }
          setSuccess(store, newState);
        } catch (error) {
          if (error.name === "Error") console.error(error);
          setError(store, error.message);
        }
      }
    }),
    {}
  );
  return {
    subscribe: store.subscribe,
    ...storeActions
  };
};
