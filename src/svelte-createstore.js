import { writable } from "svelte/store";

const throwError = msg => {
  throw new Error(`[svelte-createstore error] : ${msg}`);
};
const isObject = obj => obj === Object(obj);
const isProvided = value => value !== null && value !== undefined;
const get__store = store => {
  let $val;
  store.subscribe($ => ($val = $))();
  return $val;
};
const setLoading = store => {
  if (!get__store(store).loading)
    store.update(currentState => ({
      ...currentState,
      loading: true,
      error: null
    }));
};

const setError = (store, error) => {
  if (get__store(store).error !== error)
    store.update(currentState => ({ ...currentState, error, loading: false }));
};

const setSuccess = (store, state) => {
  store.update(currentState => ({
    ...currentState,
    state,
    loading: false,
    error: null
  }));
};
export const createStore = ({ initialState = null, actions = null }) => {
  if (!isProvided(initialState)) throwError("no initialState provided");
  if (!actions) throwError("no actions provided");
  if (!isObject(actions)) throw new Error("actions must be of type Object");
  const store = writable({ state: initialState, loading: false, error: null });
  const storeActions = Object.keys(actions).reduce(
    (memo, action) => ({
      ...memo,
      [action]: async () => {
        try {
          let newState;
          const currentState = get__store(store).state;
          const actionResponse = actions[action](currentState);
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
