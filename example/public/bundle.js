var app = (function () {
    'use strict';

    function noop() { }
    function add_location(element, file, line, column, char) {
        element.__svelte_meta = {
            loc: { file, line, column, char }
        };
    }
    function run(fn) {
        return fn();
    }
    function blank_object() {
        return Object.create(null);
    }
    function run_all(fns) {
        fns.forEach(run);
    }
    function is_function(thing) {
        return typeof thing === 'function';
    }
    function safe_not_equal(a, b) {
        return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
    }

    function append(target, node) {
        target.appendChild(node);
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        node.parentNode.removeChild(node);
    }
    function element(name) {
        return document.createElement(name);
    }
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
    }
    function listen(node, event, handler, options) {
        node.addEventListener(event, handler, options);
        return () => node.removeEventListener(event, handler, options);
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else if (node.getAttribute(attribute) !== value)
            node.setAttribute(attribute, value);
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function set_input_value(input, value) {
        if (value != null || input.value) {
            input.value = value;
        }
    }
    function custom_event(type, detail) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, false, false, detail);
        return e;
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }
    function get_current_component() {
        if (!current_component)
            throw new Error(`Function called outside component initialization`);
        return current_component;
    }
    function onDestroy(fn) {
        get_current_component().$$.on_destroy.push(fn);
    }

    const dirty_components = [];
    const binding_callbacks = [];
    const render_callbacks = [];
    const flush_callbacks = [];
    const resolved_promise = Promise.resolve();
    let update_scheduled = false;
    function schedule_update() {
        if (!update_scheduled) {
            update_scheduled = true;
            resolved_promise.then(flush);
        }
    }
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    let flushing = false;
    const seen_callbacks = new Set();
    function flush() {
        if (flushing)
            return;
        flushing = true;
        do {
            // first, call beforeUpdate functions
            // and update components
            for (let i = 0; i < dirty_components.length; i += 1) {
                const component = dirty_components[i];
                set_current_component(component);
                update(component.$$);
            }
            dirty_components.length = 0;
            while (binding_callbacks.length)
                binding_callbacks.pop()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            for (let i = 0; i < render_callbacks.length; i += 1) {
                const callback = render_callbacks[i];
                if (!seen_callbacks.has(callback)) {
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                    callback();
                }
            }
            render_callbacks.length = 0;
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
        flushing = false;
        seen_callbacks.clear();
    }
    function update($$) {
        if ($$.fragment !== null) {
            $$.update();
            run_all($$.before_update);
            const dirty = $$.dirty;
            $$.dirty = [-1];
            $$.fragment && $$.fragment.p($$.ctx, dirty);
            $$.after_update.forEach(add_render_callback);
        }
    }
    const outroing = new Set();
    let outros;
    function group_outros() {
        outros = {
            r: 0,
            c: [],
            p: outros // parent group
        };
    }
    function check_outros() {
        if (!outros.r) {
            run_all(outros.c);
        }
        outros = outros.p;
    }
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }
    function transition_out(block, local, detach, callback) {
        if (block && block.o) {
            if (outroing.has(block))
                return;
            outroing.add(block);
            outros.c.push(() => {
                outroing.delete(block);
                if (callback) {
                    if (detach)
                        block.d(1);
                    callback();
                }
            });
            block.o(local);
        }
    }
    function create_component(block) {
        block && block.c();
    }
    function mount_component(component, target, anchor) {
        const { fragment, on_mount, on_destroy, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
        // onMount happens before the initial afterUpdate
        add_render_callback(() => {
            const new_on_destroy = on_mount.map(run).filter(is_function);
            if (on_destroy) {
                on_destroy.push(...new_on_destroy);
            }
            else {
                // Edge case - component was destroyed immediately,
                // most likely as a result of a binding initialising
                run_all(new_on_destroy);
            }
            component.$$.on_mount = [];
        });
        after_update.forEach(add_render_callback);
    }
    function destroy_component(component, detaching) {
        const $$ = component.$$;
        if ($$.fragment !== null) {
            run_all($$.on_destroy);
            $$.fragment && $$.fragment.d(detaching);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            $$.on_destroy = $$.fragment = null;
            $$.ctx = [];
        }
    }
    function make_dirty(component, i) {
        if (component.$$.dirty[0] === -1) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty.fill(0);
        }
        component.$$.dirty[(i / 31) | 0] |= (1 << (i % 31));
    }
    function init(component, options, instance, create_fragment, not_equal, props, dirty = [-1]) {
        const parent_component = current_component;
        set_current_component(component);
        const prop_values = options.props || {};
        const $$ = component.$$ = {
            fragment: null,
            ctx: null,
            // state
            props,
            update: noop,
            not_equal,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            before_update: [],
            after_update: [],
            context: new Map(parent_component ? parent_component.$$.context : []),
            // everything else
            callbacks: blank_object(),
            dirty
        };
        let ready = false;
        $$.ctx = instance
            ? instance(component, prop_values, (i, ret, ...rest) => {
                const value = rest.length ? rest[0] : ret;
                if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                    if ($$.bound[i])
                        $$.bound[i](value);
                    if (ready)
                        make_dirty(component, i);
                }
                return ret;
            })
            : [];
        $$.update();
        ready = true;
        run_all($$.before_update);
        // `false` as a special case of no DOM component
        $$.fragment = create_fragment ? create_fragment($$.ctx) : false;
        if (options.target) {
            if (options.hydrate) {
                const nodes = children(options.target);
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.l(nodes);
                nodes.forEach(detach);
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.c();
            }
            if (options.intro)
                transition_in(component.$$.fragment);
            mount_component(component, options.target, options.anchor);
            flush();
        }
        set_current_component(parent_component);
    }
    class SvelteComponent {
        $destroy() {
            destroy_component(this, 1);
            this.$destroy = noop;
        }
        $on(type, callback) {
            const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
            callbacks.push(callback);
            return () => {
                const index = callbacks.indexOf(callback);
                if (index !== -1)
                    callbacks.splice(index, 1);
            };
        }
        $set() {
            // overridden by instance, if it has props
        }
    }

    function dispatch_dev(type, detail) {
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.20.0' }, detail)));
    }
    function append_dev(target, node) {
        dispatch_dev("SvelteDOMInsert", { target, node });
        append(target, node);
    }
    function insert_dev(target, node, anchor) {
        dispatch_dev("SvelteDOMInsert", { target, node, anchor });
        insert(target, node, anchor);
    }
    function detach_dev(node) {
        dispatch_dev("SvelteDOMRemove", { node });
        detach(node);
    }
    function listen_dev(node, event, handler, options, has_prevent_default, has_stop_propagation) {
        const modifiers = options === true ? ["capture"] : options ? Array.from(Object.keys(options)) : [];
        if (has_prevent_default)
            modifiers.push('preventDefault');
        if (has_stop_propagation)
            modifiers.push('stopPropagation');
        dispatch_dev("SvelteDOMAddEventListener", { node, event, handler, modifiers });
        const dispose = listen(node, event, handler, options);
        return () => {
            dispatch_dev("SvelteDOMRemoveEventListener", { node, event, handler, modifiers });
            dispose();
        };
    }
    function attr_dev(node, attribute, value) {
        attr(node, attribute, value);
        if (value == null)
            dispatch_dev("SvelteDOMRemoveAttribute", { node, attribute });
        else
            dispatch_dev("SvelteDOMSetAttribute", { node, attribute, value });
    }
    function prop_dev(node, property, value) {
        node[property] = value;
        dispatch_dev("SvelteDOMSetProperty", { node, property, value });
    }
    function set_data_dev(text, data) {
        data = '' + data;
        if (text.data === data)
            return;
        dispatch_dev("SvelteDOMSetData", { node: text, data });
        text.data = data;
    }
    function validate_slots(name, slot, keys) {
        for (const slot_key of Object.keys(slot)) {
            if (!~keys.indexOf(slot_key)) {
                console.warn(`<${name}> received an unexpected slot "${slot_key}".`);
            }
        }
    }
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error(`'target' is a required option`);
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn(`Component was already destroyed`); // eslint-disable-line no-console
            };
        }
        $capture_state() { }
        $inject_state() { }
    }

    function unwrapExports (x) {
    	return x && x.__esModule && Object.prototype.hasOwnProperty.call(x, 'default') ? x['default'] : x;
    }

    function createCommonjsModule(fn, module) {
    	return module = { exports: {} }, fn(module, module.exports), module.exports;
    }

    function getCjsExportFromNamespace (n) {
    	return n && n['default'] || n;
    }

    function noop$1() { }
    function run$1(fn) {
        return fn();
    }
    function run_all$1(fns) {
        fns.forEach(run$1);
    }
    function is_function$1(thing) {
        return typeof thing === 'function';
    }
    function safe_not_equal$1(a, b) {
        return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
    }
    function subscribe(store, ...callbacks) {
        if (store == null) {
            return noop$1;
        }
        const unsub = store.subscribe(...callbacks);
        return unsub.unsubscribe ? () => unsub.unsubscribe() : unsub;
    }
    function get_store_value(store) {
        let value;
        subscribe(store, _ => value = _)();
        return value;
    }

    const subscriber_queue = [];
    /**
     * Creates a `Readable` store that allows reading by subscription.
     * @param value initial value
     * @param {StartStopNotifier}start start and stop notifications for subscriptions
     */
    function readable(value, start) {
        return {
            subscribe: writable(value, start).subscribe,
        };
    }
    /**
     * Create a `Writable` store that allows both updating and reading by subscription.
     * @param {*=}value initial value
     * @param {StartStopNotifier=}start start and stop notifications for subscriptions
     */
    function writable(value, start = noop$1) {
        let stop;
        const subscribers = [];
        function set(new_value) {
            if (safe_not_equal$1(value, new_value)) {
                value = new_value;
                if (stop) { // store is ready
                    const run_queue = !subscriber_queue.length;
                    for (let i = 0; i < subscribers.length; i += 1) {
                        const s = subscribers[i];
                        s[1]();
                        subscriber_queue.push(s, value);
                    }
                    if (run_queue) {
                        for (let i = 0; i < subscriber_queue.length; i += 2) {
                            subscriber_queue[i][0](subscriber_queue[i + 1]);
                        }
                        subscriber_queue.length = 0;
                    }
                }
            }
        }
        function update(fn) {
            set(fn(value));
        }
        function subscribe(run, invalidate = noop$1) {
            const subscriber = [run, invalidate];
            subscribers.push(subscriber);
            if (subscribers.length === 1) {
                stop = start(set) || noop$1;
            }
            run(value);
            return () => {
                const index = subscribers.indexOf(subscriber);
                if (index !== -1) {
                    subscribers.splice(index, 1);
                }
                if (subscribers.length === 0) {
                    stop();
                    stop = null;
                }
            };
        }
        return { set, update, subscribe };
    }
    function derived(stores, fn, initial_value) {
        const single = !Array.isArray(stores);
        const stores_array = single
            ? [stores]
            : stores;
        const auto = fn.length < 2;
        return readable(initial_value, (set) => {
            let inited = false;
            const values = [];
            let pending = 0;
            let cleanup = noop$1;
            const sync = () => {
                if (pending) {
                    return;
                }
                cleanup();
                const result = fn(single ? values[0] : values, set);
                if (auto) {
                    set(result);
                }
                else {
                    cleanup = is_function$1(result) ? result : noop$1;
                }
            };
            const unsubscribers = stores_array.map((store, i) => subscribe(store, (value) => {
                values[i] = value;
                pending &= ~(1 << i);
                if (inited) {
                    sync();
                }
            }, () => {
                pending |= (1 << i);
            }));
            inited = true;
            sync();
            return function stop() {
                run_all$1(unsubscribers);
                cleanup();
            };
        });
    }

    var store = /*#__PURE__*/Object.freeze({
        __proto__: null,
        derived: derived,
        readable: readable,
        writable: writable,
        get: get_store_value
    });

    var _store = getCjsExportFromNamespace(store);

    var svelteCreatestore = createCommonjsModule(function (module, exports) {

    Object.defineProperty(exports, "__esModule", {
      value: true
    });
    exports.createStore = void 0;



    let store;

    const throwError = msg => {
      throw new Error(`[svelte-createstore error] : ${msg}`);
    };

    const isObject = obj => obj === Object(obj);

    const isDate = date => new Date(date).toString() !== "Invalid Date" && !isNaN(new Date(date));

    const getState = (module = null) => {
      let $val;
      store.subscribe($ => $val = $)();
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
      if (!getState(module).loading) store.update(currentState => deepMerge(currentState, {
        loading: true,
        error: null
      }));
    };

    const setError = (error, module) => {
      if (getState(module).error !== error) store.update(currentState => deepMerge(currentState, {
        error,
        loading: false
      }));
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
      let s = o => Object.entries(o).sort().map(i => {
        if (i[1] instanceof Object) i[1] = s(i[1]);
        return i;
      });

      return JSON.stringify(s(a)) === JSON.stringify(s(b));
    };

    const setSuccess = (state, module) => {
      store.update(currentState => {
        return deepMerge(currentState, !module ? {
          state: { ...state
          },
          loading: false,
          error: null
        } : {
          state: {
            [module]: state
          },
          loading: false,
          error: null
        });
      });
    };

    const mountInitialState = (initialState, modules) => {
      let state = initialState;
      Object.keys(modules || {}).forEach(module => {
        if (!modules[module].initialState) throwError(`initialState of module ${module} must be of type Object`);
        state[module] = { ...modules[module].initialState
        };
      });
      return state;
    };

    const mountActions = (actions, modules, moduleName = null) => {
      return deepMerge(Object.keys(actions).reduce((memo, key) => ({ ...memo,
        ...{
          [key]: (...args) => {
            return executeAction(actions[key], moduleName, ...args);
          }
        }
      }), {}), Object.keys(modules || {}).reduce((memo, key) => deepMerge({ ...memo
      }, {
        [key]: mountActions(modules[key].actions, {}, key) || {}
      }), {}));
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

        if (!isDeepEqual(getSchema(deepMerge(currentState, newState)), getSchema(currentState))) {
          throwError(`action '${action}'${module ? " of module " + module + " " : ""} returned schema [ ${JSON.stringify(getSchema(newState))} ] differs from current state schema [ ${JSON.stringify(getSchema(currentState))} ] `);
        }

        setSuccess(newState, module);
      } catch (err) {
        setError(err, module);
      }
    };

    const createStore = ({
      initialState = null,
      actions = null,
      modules = null
    }) => {
      if (!isObject(initialState)) throwError("initialState must be of type Object");
      if (!actions) throwError("no actions provided");
      if (!isObject(actions)) throwError("actions must be of type Object");
      store = (0, _store.writable)({
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

    exports.createStore = createStore;
    });

    unwrapExports(svelteCreatestore);
    var svelteCreatestore_1 = svelteCreatestore.createStore;

    var store$1 = svelteCreatestore_1({
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

    /* Display.svelte generated by Svelte v3.20.0 */
    const file = "Display.svelte";

    function create_fragment(ctx) {
    	let h10;
    	let t0;
    	let t1;
    	let t2;
    	let h11;
    	let t3;
    	let t4;

    	const block = {
    		c: function create() {
    			h10 = element("h1");
    			t0 = text("The counter value is ");
    			t1 = text(/*counter*/ ctx[0]);
    			t2 = space();
    			h11 = element("h1");
    			t3 = text("My name is ");
    			t4 = text(/*name*/ ctx[1]);
    			add_location(h10, file, 11, 0, 275);
    			add_location(h11, file, 12, 0, 316);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, h10, anchor);
    			append_dev(h10, t0);
    			append_dev(h10, t1);
    			insert_dev(target, t2, anchor);
    			insert_dev(target, h11, anchor);
    			append_dev(h11, t3);
    			append_dev(h11, t4);
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*counter*/ 1) set_data_dev(t1, /*counter*/ ctx[0]);
    			if (dirty & /*name*/ 2) set_data_dev(t4, /*name*/ ctx[1]);
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(h10);
    			if (detaching) detach_dev(t2);
    			if (detaching) detach_dev(h11);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance($$self, $$props, $$invalidate) {
    	let counter, name;

    	const unsubscribe = store$1.subscribe(({ state }) => {
    		$$invalidate(0, counter = state.counter);
    		$$invalidate(1, name = state.person.name);
    	});

    	onDestroy(() => unsubscribe());
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Display> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("Display", $$slots, []);

    	$$self.$capture_state = () => ({
    		store: store$1,
    		onDestroy,
    		counter,
    		name,
    		unsubscribe
    	});

    	$$self.$inject_state = $$props => {
    		if ("counter" in $$props) $$invalidate(0, counter = $$props.counter);
    		if ("name" in $$props) $$invalidate(1, name = $$props.name);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [counter, name];
    }

    class Display extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Display",
    			options,
    			id: create_fragment.name
    		});
    	}
    }

    /* Increment.svelte generated by Svelte v3.20.0 */
    const file$1 = "Increment.svelte";

    function create_fragment$1(ctx) {
    	let button0;
    	let t1;
    	let button1;
    	let dispose;

    	const block = {
    		c: function create() {
    			button0 = element("button");
    			button0.textContent = "Increment 1 (Async)";
    			t1 = space();
    			button1 = element("button");
    			button1.textContent = "Increment 5 (Async)";
    			attr_dev(button0, "class", "btn btn-primary");
    			add_location(button0, file$1, 4, 0, 55);
    			attr_dev(button1, "class", "btn btn-primary");
    			add_location(button1, file$1, 7, 0, 159);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor, remount) {
    			insert_dev(target, button0, anchor);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, button1, anchor);
    			if (remount) run_all(dispose);

    			dispose = [
    				listen_dev(button0, "click", /*click_handler*/ ctx[0], false, false, false),
    				listen_dev(button1, "click", /*click_handler_1*/ ctx[1], false, false, false)
    			];
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(button0);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(button1);
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$1.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$1($$self, $$props, $$invalidate) {
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Increment> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("Increment", $$slots, []);
    	const click_handler = () => store$1.increment(1);
    	const click_handler_1 = () => store$1.increment(5);
    	$$self.$capture_state = () => ({ store: store$1 });
    	return [click_handler, click_handler_1];
    }

    class Increment extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Increment",
    			options,
    			id: create_fragment$1.name
    		});
    	}
    }

    /* Decrement.svelte generated by Svelte v3.20.0 */
    const file$2 = "Decrement.svelte";

    function create_fragment$2(ctx) {
    	let button0;
    	let t1;
    	let button1;
    	let dispose;

    	const block = {
    		c: function create() {
    			button0 = element("button");
    			button0.textContent = "Decrement 1";
    			t1 = space();
    			button1 = element("button");
    			button1.textContent = "Decrement 5";
    			attr_dev(button0, "class", "btn btn-danger");
    			add_location(button0, file$2, 4, 0, 55);
    			attr_dev(button1, "class", "btn btn-danger");
    			add_location(button1, file$2, 7, 0, 150);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor, remount) {
    			insert_dev(target, button0, anchor);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, button1, anchor);
    			if (remount) run_all(dispose);

    			dispose = [
    				listen_dev(button0, "click", /*click_handler*/ ctx[0], false, false, false),
    				listen_dev(button1, "click", /*click_handler_1*/ ctx[1], false, false, false)
    			];
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(button0);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(button1);
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$2.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$2($$self, $$props, $$invalidate) {
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Decrement> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("Decrement", $$slots, []);
    	const click_handler = () => store$1.decrement(1);
    	const click_handler_1 = () => store$1.decrement(5);
    	$$self.$capture_state = () => ({ store: store$1 });
    	return [click_handler, click_handler_1];
    }

    class Decrement extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$2, create_fragment$2, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Decrement",
    			options,
    			id: create_fragment$2.name
    		});
    	}
    }

    /* Person.svelte generated by Svelte v3.20.0 */
    const file$3 = "Person.svelte";

    function create_fragment$3(ctx) {
    	let div2;
    	let div0;
    	let input;
    	let t0;
    	let div1;
    	let button;
    	let t1;
    	let button_disabled_value;
    	let dispose;

    	const block = {
    		c: function create() {
    			div2 = element("div");
    			div0 = element("div");
    			input = element("input");
    			t0 = space();
    			div1 = element("div");
    			button = element("button");
    			t1 = text("Change Name");
    			attr_dev(input, "type", "text");
    			attr_dev(input, "placehold", "New name");
    			attr_dev(input, "class", "form-control");
    			add_location(input, file$3, 12, 4, 223);
    			attr_dev(div0, "class", "col");
    			add_location(div0, file$3, 11, 2, 200);
    			attr_dev(button, "class", "btn btn-success");
    			button.disabled = button_disabled_value = !/*name*/ ctx[0];
    			add_location(button, file$3, 19, 4, 369);
    			attr_dev(div1, "class", "col");
    			add_location(div1, file$3, 18, 2, 346);
    			attr_dev(div2, "class", "row");
    			add_location(div2, file$3, 10, 0, 179);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor, remount) {
    			insert_dev(target, div2, anchor);
    			append_dev(div2, div0);
    			append_dev(div0, input);
    			set_input_value(input, /*name*/ ctx[0]);
    			append_dev(div2, t0);
    			append_dev(div2, div1);
    			append_dev(div1, button);
    			append_dev(button, t1);
    			if (remount) run_all(dispose);

    			dispose = [
    				listen_dev(input, "input", /*input_input_handler*/ ctx[2]),
    				listen_dev(button, "click", /*setName*/ ctx[1], false, false, false)
    			];
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*name*/ 1 && input.value !== /*name*/ ctx[0]) {
    				set_input_value(input, /*name*/ ctx[0]);
    			}

    			if (dirty & /*name*/ 1 && button_disabled_value !== (button_disabled_value = !/*name*/ ctx[0])) {
    				prop_dev(button, "disabled", button_disabled_value);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div2);
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$3.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$3($$self, $$props, $$invalidate) {
    	let name = "";

    	const setName = () => {
    		if (!name) return;
    		store$1.person.setName(name);
    		$$invalidate(0, name = "");
    	};

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Person> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("Person", $$slots, []);

    	function input_input_handler() {
    		name = this.value;
    		$$invalidate(0, name);
    	}

    	$$self.$capture_state = () => ({ store: store$1, name, setName });

    	$$self.$inject_state = $$props => {
    		if ("name" in $$props) $$invalidate(0, name = $$props.name);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [name, setName, input_input_handler];
    }

    class Person extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$3, create_fragment$3, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Person",
    			options,
    			id: create_fragment$3.name
    		});
    	}
    }

    /* App.svelte generated by Svelte v3.20.0 */
    const file$4 = "App.svelte";

    // (24:2) {:else}
    function create_else_block(ctx) {
    	let div1;
    	let div0;
    	let t0;
    	let hr;
    	let t1;
    	let div3;
    	let div2;
    	let t2;
    	let t3;
    	let div5;
    	let div4;
    	let current;
    	const display = new Display({ $$inline: true });
    	const increment = new Increment({ $$inline: true });
    	const decrement = new Decrement({ $$inline: true });
    	const person = new Person({ $$inline: true });

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			div0 = element("div");
    			create_component(display.$$.fragment);
    			t0 = space();
    			hr = element("hr");
    			t1 = space();
    			div3 = element("div");
    			div2 = element("div");
    			create_component(increment.$$.fragment);
    			t2 = space();
    			create_component(decrement.$$.fragment);
    			t3 = space();
    			div5 = element("div");
    			div4 = element("div");
    			create_component(person.$$.fragment);
    			attr_dev(div0, "class", "col");
    			add_location(div0, file$4, 25, 6, 720);
    			attr_dev(div1, "class", "row");
    			add_location(div1, file$4, 24, 4, 695);
    			add_location(hr, file$4, 29, 4, 790);
    			attr_dev(div2, "class", "col");
    			add_location(div2, file$4, 31, 6, 832);
    			attr_dev(div3, "class", "row mt-5");
    			add_location(div3, file$4, 30, 4, 802);
    			attr_dev(div4, "class", "col");
    			add_location(div4, file$4, 37, 6, 957);
    			attr_dev(div5, "class", "row mt-5");
    			add_location(div5, file$4, 36, 4, 927);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			append_dev(div1, div0);
    			mount_component(display, div0, null);
    			insert_dev(target, t0, anchor);
    			insert_dev(target, hr, anchor);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, div3, anchor);
    			append_dev(div3, div2);
    			mount_component(increment, div2, null);
    			append_dev(div2, t2);
    			mount_component(decrement, div2, null);
    			insert_dev(target, t3, anchor);
    			insert_dev(target, div5, anchor);
    			append_dev(div5, div4);
    			mount_component(person, div4, null);
    			current = true;
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(display.$$.fragment, local);
    			transition_in(increment.$$.fragment, local);
    			transition_in(decrement.$$.fragment, local);
    			transition_in(person.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(display.$$.fragment, local);
    			transition_out(increment.$$.fragment, local);
    			transition_out(decrement.$$.fragment, local);
    			transition_out(person.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div1);
    			destroy_component(display);
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(hr);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(div3);
    			destroy_component(increment);
    			destroy_component(decrement);
    			if (detaching) detach_dev(t3);
    			if (detaching) detach_dev(div5);
    			destroy_component(person);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block.name,
    		type: "else",
    		source: "(24:2) {:else}",
    		ctx
    	});

    	return block;
    }

    // (18:2) {#if loading}
    function create_if_block(ctx) {
    	let div1;
    	let div0;
    	let h1;

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			div0 = element("div");
    			h1 = element("h1");
    			h1.textContent = "Loading ...";
    			add_location(h1, file$4, 20, 8, 632);
    			attr_dev(div0, "class", "col");
    			add_location(div0, file$4, 19, 6, 605);
    			attr_dev(div1, "class", "row");
    			add_location(div1, file$4, 18, 4, 580);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			append_dev(div1, div0);
    			append_dev(div0, h1);
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div1);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block.name,
    		type: "if",
    		source: "(18:2) {#if loading}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$4(ctx) {
    	let nav;
    	let span;
    	let t1;
    	let div;
    	let current_block_type_index;
    	let if_block;
    	let t2;
    	let link;
    	let current;
    	const if_block_creators = [create_if_block, create_else_block];
    	const if_blocks = [];

    	function select_block_type(ctx, dirty) {
    		if (/*loading*/ ctx[0]) return 0;
    		return 1;
    	}

    	current_block_type_index = select_block_type(ctx);
    	if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);

    	const block = {
    		c: function create() {
    			nav = element("nav");
    			span = element("span");
    			span.textContent = "svelte-createstore example";
    			t1 = space();
    			div = element("div");
    			if_block.c();
    			t2 = space();
    			link = element("link");
    			attr_dev(span, "class", "navbar-brand mb-0 h1");
    			add_location(span, file$4, 13, 2, 443);
    			attr_dev(nav, "class", "navbar navbar-dark bg-dark");
    			add_location(nav, file$4, 12, 0, 399);
    			attr_dev(div, "class", "container-fluid mt-2");
    			add_location(div, file$4, 16, 0, 523);
    			attr_dev(link, "rel", "stylesheet");
    			attr_dev(link, "href", "https://stackpath.bootstrapcdn.com/bootstrap/4.4.1/css/bootstrap.min.css");
    			add_location(link, file$4, 45, 2, 1058);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, nav, anchor);
    			append_dev(nav, span);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, div, anchor);
    			if_blocks[current_block_type_index].m(div, null);
    			insert_dev(target, t2, anchor);
    			append_dev(document.head, link);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			let previous_block_index = current_block_type_index;
    			current_block_type_index = select_block_type(ctx);

    			if (current_block_type_index !== previous_block_index) {
    				group_outros();

    				transition_out(if_blocks[previous_block_index], 1, 1, () => {
    					if_blocks[previous_block_index] = null;
    				});

    				check_outros();
    				if_block = if_blocks[current_block_type_index];

    				if (!if_block) {
    					if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    					if_block.c();
    				}

    				transition_in(if_block, 1);
    				if_block.m(div, null);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(nav);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(div);
    			if_blocks[current_block_type_index].d();
    			if (detaching) detach_dev(t2);
    			detach_dev(link);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$4.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$4($$self, $$props, $$invalidate) {
    	let loading;
    	const unsubscribe = store$1.subscribe(state => $$invalidate(0, loading = state.loading));
    	onDestroy(() => unsubscribe());
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("App", $$slots, []);

    	$$self.$capture_state = () => ({
    		store: store$1,
    		onDestroy,
    		Display,
    		Increment,
    		Decrement,
    		Person,
    		loading,
    		unsubscribe
    	});

    	$$self.$inject_state = $$props => {
    		if ("loading" in $$props) $$invalidate(0, loading = $$props.loading);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [loading];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$4, create_fragment$4, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment$4.name
    		});
    	}
    }

    const app = new App({
      target: document.body
    });

    return app;

}());
//# sourceMappingURL=bundle.js.map
