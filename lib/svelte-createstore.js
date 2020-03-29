import "core-js/modules/es6.object.define-properties";
import "core-js/modules/es7.object.get-own-property-descriptors";
import "core-js/modules/es6.array.filter";
import "core-js/modules/es6.object.define-property";
import "core-js/modules/es7.symbol.async-iterator";
import "core-js/modules/es6.symbol";
import "core-js/modules/es6.promise";
import "regenerator-runtime/runtime";
import "core-js/modules/es6.array.reduce";
import "core-js/modules/es7.object.entries";
import "core-js/modules/es6.array.sort";
import "core-js/modules/es6.array.map";
import "core-js/modules/es6.object.assign";
import "core-js/modules/es6.array.is-array";
import "core-js/modules/web.dom.iterable";
import "core-js/modules/es6.array.iterator";
import "core-js/modules/es6.object.keys";
import "core-js/modules/es6.array.for-each";
import "core-js/modules/es6.regexp.to-string";
import "core-js/modules/es6.date.to-string";
import "core-js/modules/es6.object.to-string";

function asyncGeneratorStep(gen, resolve, reject, _next, _throw, key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { Promise.resolve(value).then(_next, _throw); } }

function _asyncToGenerator(fn) { return function () { var self = this, args = arguments; return new Promise(function (resolve, reject) { var gen = fn.apply(self, args); function _next(value) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "next", value); } function _throw(err) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "throw", err); } _next(undefined); }); }; }

function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); if (enumerableOnly) symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; }); keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; if (i % 2) { ownKeys(Object(source), true).forEach(function (key) { _defineProperty(target, key, source[key]); }); } else if (Object.getOwnPropertyDescriptors) { Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)); } else { ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } } return target; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

function _typeof(obj) { "@babel/helpers - typeof"; if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

import { writable } from "svelte/store";
var store;

var throwError = function throwError(msg) {
  throw new Error("[svelte-createstore error] : ".concat(msg));
};

var isObject = function isObject(obj) {
  return obj === Object(obj);
};

var isDate = function isDate(date) {
  return new Date(date).toString() !== "Invalid Date" && !isNaN(new Date(date));
};

var getState = function getState() {
  var module = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : null;
  var $val;
  store.subscribe(function ($) {
    return $val = $;
  })();
  return $val;
};

var getSchema = function getSchema(object) {
  var output = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

  for (var key in object) {
    var value = object[key];

    var type = _typeof(value);

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

var setLoading = function setLoading(module) {
  if (!getState(module).loading) store.update(function (currentState) {
    return deepMerge(currentState, {
      loading: true,
      error: null
    });
  });
};

var setError = function setError(error, module) {
  if (getState(module).error !== error) store.update(function (currentState) {
    return deepMerge(currentState, {
      error: error,
      loading: false
    });
  });
};

var deepMerge = function deepMerge(target, source) {
  if (!isObject(target) || !isObject(source)) {
    return source;
  }

  Object.keys(source).forEach(function (key) {
    var targetValue = target[key];
    var sourceValue = source[key];

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

var isDeepEqual = function isDeepEqual(a, b) {
  var s = function s(o) {
    return Object.entries(o).sort().map(function (i) {
      if (i[1] instanceof Object) i[1] = s(i[1]);
      return i;
    });
  };

  return JSON.stringify(s(a)) === JSON.stringify(s(b));
};

var setSuccess = function setSuccess(state, module) {
  store.update(function (currentState) {
    return deepMerge(currentState, !module ? {
      state: _objectSpread({}, state),
      loading: false,
      error: null
    } : {
      state: _defineProperty({}, module, state),
      loading: false,
      error: null
    });
  });
};

var mountInitialState = function mountInitialState(initialState, modules) {
  var state = initialState;
  Object.keys(modules || {}).forEach(function (module) {
    if (!modules[module].initialState) throwError("initialState of module ".concat(module, " must be of type Object"));
    state[module] = _objectSpread({}, modules[module].initialState);
  });
  return state;
};

var mountActions = function mountActions(actions, modules) {
  var moduleName = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : null;
  return deepMerge(Object.keys(actions).reduce(function (memo, key) {
    return _objectSpread({}, memo, {}, _defineProperty({}, key, function () {
      for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
        args[_key] = arguments[_key];
      }

      return executeAction.apply(void 0, [actions[key], moduleName].concat(args));
    }));
  }, {}), Object.keys(modules || {}).reduce(function (memo, key) {
    return deepMerge(_objectSpread({}, memo), _defineProperty({}, key, mountActions(modules[key].actions, {}, key) || {}));
  }, {}));
};

var executeAction = /*#__PURE__*/function () {
  var _ref = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee(action) {
    var module,
        currentState,
        newState,
        _len2,
        args,
        _key2,
        response,
        _args = arguments;

    return regeneratorRuntime.wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            module = _args.length > 1 && _args[1] !== undefined ? _args[1] : null;
            _context.prev = 1;
            currentState = getState().state;

            if (module) {
              currentState = currentState[module];
            }

            for (_len2 = _args.length, args = new Array(_len2 > 2 ? _len2 - 2 : 0), _key2 = 2; _key2 < _len2; _key2++) {
              args[_key2 - 2] = _args[_key2];
            }

            response = action.apply(void 0, [currentState].concat(args));

            if (!(response instanceof Promise)) {
              _context.next = 13;
              break;
            }

            setLoading(module);
            _context.next = 10;
            return Promise.resolve(response);

          case 10:
            newState = _context.sent;
            _context.next = 14;
            break;

          case 13:
            newState = response;

          case 14:
            if (!isDeepEqual(getSchema(deepMerge(currentState, newState)), getSchema(currentState))) {
              throwError("action '".concat(action, "'").concat(module ? " of module " + module + " " : "", " returned schema [ ").concat(JSON.stringify(getSchema(newState)), " ] differs from current state schema [ ").concat(JSON.stringify(getSchema(currentState)), " ] "));
            }

            setSuccess(newState, module);
            _context.next = 21;
            break;

          case 18:
            _context.prev = 18;
            _context.t0 = _context["catch"](1);
            setError(_context.t0, module);

          case 21:
          case "end":
            return _context.stop();
        }
      }
    }, _callee, null, [[1, 18]]);
  }));

  return function executeAction(_x) {
    return _ref.apply(this, arguments);
  };
}();

export var createStore = function createStore(_ref2) {
  var _ref2$initialState = _ref2.initialState,
      initialState = _ref2$initialState === void 0 ? null : _ref2$initialState,
      _ref2$actions = _ref2.actions,
      actions = _ref2$actions === void 0 ? null : _ref2$actions,
      _ref2$modules = _ref2.modules,
      modules = _ref2$modules === void 0 ? null : _ref2$modules;
  if (!isObject(initialState)) throwError("initialState must be of type Object");
  if (!actions) throwError("no actions provided");
  if (!isObject(actions)) throwError("actions must be of type Object");
  store = writable({
    state: mountInitialState(initialState, modules),
    loading: false,
    error: null
  });
  var storeActions = mountActions(actions, modules);
  return _objectSpread({
    subscribe: store.subscribe
  }, storeActions);
};