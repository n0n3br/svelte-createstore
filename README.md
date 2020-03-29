# svelte-createstore
![Node.js CI](https://github.com/n0n3br/svelte-createstore/workflows/Node.js%20CI/badge.svg?branch=master)

Svelte 3 related module to create a store with support to modules and sync/async actions

## why i did this

Svelte 3 provides a basic store that is perfectly fine for small applications.

When your app grows, it's always a good idea to extract the business logic from components to keep them lean and focused on what they're primarlly design to do - interact with the user.

Inspired by other state management solutions, I ´wrote a code that automatically creates a writable store and ´provides access to the actions, so that components can interact with the data withou having to know the business logic to do it.
I also added support for async actions and modules, so it can be used in api fetch operations, for example.

## how to use

createStore is a method that requires 3 parameters:

- initialState: value that will be loaded in the state key of the store once it's created. It must be a valid object.

- actions: and object that describes the actions that will update the store state. This is the only way to update the store, no update or set default Svelte store methods are supported. Each action is composed of a name (the key itself) and a function that receives the current state as the first parameter and the other arguments passed after. The function must return the updated state. Async functions are supported. To call modules actions just use the module name dot the action name.

- modules: an object that lists the modules to be included in the store. It's not a required parameter, if not informed the store will be create withou modules. The object keys will be the modules names. A module descbribes a subset of a state, with it's own initialState and actions. Each module is a object with inititalStore and actions keys, like the root state. Modules actions has access only to that modules state.

The execution of createStore returns an object that has all the actions provided and can be executed by any component.

The returned object can also be used to subscribe to changes using the subscribe method like Svelte native store.

The callback function of the subscribe method will receive as a variable an object with 3 keys:

- state: the current state of the store, including modules state in module's names keys.

- error: if any error occurs during an action execution, it will contain the error message. Otherwise is null

- loading: it turns to true when an async action is executed and to false when it ends.

## example

A complete usage example can be found in my [github repository](https://github.com/n0n3br/svelte-createstore/tree/master/example)
