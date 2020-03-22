"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.createStore = void 0;

var _store = require("svelte/store");

function _typeof(obj) { "@babel/helpers - typeof"; if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

function asyncGeneratorStep(gen, resolve, reject, _next, _throw, key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { Promise.resolve(value).then(_next, _throw); } }

function _asyncToGenerator(fn) { return function () { var self = this, args = arguments; return new Promise(function (resolve, reject) { var gen = fn.apply(self, args); function _next(value) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "next", value); } function _throw(err) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "throw", err); } _next(undefined); }); }; }

function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); if (enumerableOnly) symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; }); keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; if (i % 2) { ownKeys(Object(source), true).forEach(function (key) { _defineProperty(target, key, source[key]); }); } else if (Object.getOwnPropertyDescriptors) { Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)); } else { ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } } return target; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

var throwError = function throwError(msg) {
  throw new Error("[svelte-createstore error] : ".concat(msg));
};

var isObject = function isObject(obj) {
  return obj === Object(obj);
};

var isProvided = function isProvided(value) {
  return value !== null && value !== undefined;
};

var get__store = function get__store(store) {
  var $val;
  store.subscribe(function ($) {
    return $val = $;
  })();
  return $val;
};

var setLoading = function setLoading(store) {
  if (!get__store(store).loading) store.update(function (currentState) {
    return _objectSpread({}, currentState, {
      loading: true,
      error: null
    });
  });
};

var setError = function setError(store, error) {
  if (get__store(store).error !== error) store.update(function (currentState) {
    return _objectSpread({}, currentState, {
      error: error,
      loading: false
    });
  });
};

var setSuccess = function setSuccess(store, state) {
  store.update(function (currentState) {
    return _objectSpread({}, currentState, {
      state: state,
      loading: false,
      error: null
    });
  });
};

var createStore = function createStore(_ref) {
  var _ref$initialState = _ref.initialState,
      initialState = _ref$initialState === void 0 ? null : _ref$initialState,
      _ref$actions = _ref.actions,
      actions = _ref$actions === void 0 ? null : _ref$actions;
  if (!isProvided(initialState)) throwError("no initialState provided");
  if (!actions) throwError("no actions provided");
  if (!isObject(actions)) throw new Error("actions must be of type Object");
  var store = (0, _store.writable)({
    state: initialState,
    loading: false,
    error: null
  });
  var storeActions = Object.keys(actions).reduce(function (memo, action) {
    return _objectSpread({}, memo, _defineProperty({}, action, _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee() {
      var newState,
          currentState,
          _len,
          args,
          _key,
          actionResponse,
          _args = arguments;

      return regeneratorRuntime.wrap(function _callee$(_context) {
        while (1) {
          switch (_context.prev = _context.next) {
            case 0:
              _context.prev = 0;
              currentState = get__store(store).state;

              for (_len = _args.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
                args[_key] = _args[_key];
              }

              actionResponse = actions[action].apply(actions, [currentState].concat(args));

              if (!(actionResponse instanceof Promise)) {
                _context.next = 11;
                break;
              }

              setLoading(store);
              _context.next = 8;
              return Promise.resolve(actionResponse);

            case 8:
              newState = _context.sent;
              _context.next = 12;
              break;

            case 11:
              newState = actionResponse;

            case 12:
              if (_typeof(newState) !== _typeof(currentState)) {
                throwError("action '".concat(action, "' returned type ").concat(_typeof(newState), " differ from initialState type  ").concat(_typeof(currentState)));
              }

              setSuccess(store, newState);
              _context.next = 20;
              break;

            case 16:
              _context.prev = 16;
              _context.t0 = _context["catch"](0);
              if (_context.t0.name === "Error") console.error(_context.t0);
              setError(store, _context.t0.message);

            case 20:
            case "end":
              return _context.stop();
          }
        }
      }, _callee, null, [[0, 16]]);
    }))));
  }, {});
  return _objectSpread({
    subscribe: store.subscribe
  }, storeActions);
};

exports.createStore = createStore;