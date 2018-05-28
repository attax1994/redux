import $$observable from 'symbol-observable'

import ActionTypes from './utils/actionTypes'
import isPlainObject from './utils/isPlainObject'

/**
 * Creates a Redux store that holds the state tree.
 * The only way to change the data in the store is to call `dispatch()` on it.
 *
 * There should only be a single store in your app. To specify how different
 * parts of the state tree respond to actions, you may combine several reducers
 * into a single reducer function by using `combineReducers`.
 *
 * @param {Function} reducer A function that returns the next state tree, given
 * the current state tree and the action to handle.
 *
 * @param {any} [preloadedState] The initial state. You may optionally specify it
 * to hydrate the state from the server in universal apps, or to restore a
 * previously serialized user session.
 * If you use `combineReducers` to produce the root reducer function, this must be
 * an object with the same shape as `combineReducers` keys.
 *
 * @param {Function} [enhancer] The store enhancer. You may optionally specify it
 * to enhance the store with third-party capabilities such as middleware,
 * time travel, persistence, etc. The only store enhancer that ships with Redux
 * is `applyMiddleware()`.
 *
 * @returns {Store} A Redux store that lets you read the state, dispatch actions
 * and subscribe to changes.
 */
/**
 * 创建一个Redux store，用于保管 state 树
 * 只能使用`dispatch()`方法来改变状态
 *
 * 通常情况下，一个App对应一个store。
 * 为了描述 state 树上不同部分如何响应 actions，你需要将多个 reducer 合并（`combineReducers()`）成一个。
 *
 * @param reducer         合并后的rootReducer，用combineReducers()合并了所有子reducer
 * @param preloadedState  初始state，你可以在Server端渲染时，直接指定（前端渲染可以让reducer负责初始化）
 * @param enhancer        使用applyMiddleware()来创建enhancer，从而将对应Middleware的能力给予Redux
 * @return {*}            Redux的store实例，可以读取state，实施action，或是订阅（subscribe）其变化
 */
export default function createStore(reducer, preloadedState, enhancer) {
  // 第二个参数传入enhancer（function），而不是preloadedState（Object）时，两者交换
  if (typeof preloadedState === 'function' && typeof enhancer === 'undefined') {
    enhancer = preloadedState
    preloadedState = undefined
  }

  /**
   * 如果存在enhancer，将createStore和reducer, preloadedState传入，
   * 先构建store，然后改造其dispatch方法，从而在每次dispatch时能被middleware拦截
   */
  if (typeof enhancer !== 'undefined') {
    if (typeof enhancer !== 'function') {
      throw new Error('Expected the enhancer to be a function.')
    }

    return enhancer(createStore)(reducer, preloadedState)
  }

  // reducer类型检查
  if (typeof reducer !== 'function') {
    throw new Error('Expected the reducer to be a function.')
  }

  // 当前的reducer
  let currentReducer = reducer
  // 记录当前状态
  let currentState = preloadedState
  // 记录申请subscribe的目标
  let currentListeners = []
  let nextListeners = currentListeners
  // 标志是否正在执行一个action
  let isDispatching = false

  /**
   * 让nextListeners成为currentListeners的副本，而不是指向同一个Array
   */
  function ensureCanMutateNextListeners() {
    if (nextListeners === currentListeners) {
      nextListeners = currentListeners.slice()
    }
  }

  /**
   * 返回currentState，即当前的state树
   * @return {*}  当前的state树
   */
  function getState() {
    // 不要在dispatch action时调用这个方法，通常middleware和reducer都会得到一份dispatch前的state作为参数
    if (isDispatching) {
      throw new Error(
        'You may not call store.getState() while the reducer is executing. ' +
        'The reducer has already received the state as an argument. ' +
        'Pass it down from the top reducer instead of reading it from the store.'
      )
    }

    return currentState
  }

  /**
   * Adds a change listener. It will be called any time an action is dispatched,
   * and some part of the state tree may potentially have changed. You may then
   * call `getState()` to read the current state tree inside the callback.
   *
   * You may call `dispatch()` from a change listener, with the following
   * caveats:
   *
   * 1. The subscriptions are snapshotted just before every `dispatch()` call.
   * If you subscribe or unsubscribe while the listeners are being invoked, this
   * will not have any effect on the `dispatch()` that is currently in progress.
   * However, the next `dispatch()` call, whether nested or not, will use a more
   * recent snapshot of the subscription list.
   *
   * 2. The listener should not expect to see all state changes, as the state
   * might have been updated multiple times during a nested `dispatch()` before
   * the listener is called. It is, however, guaranteed that all subscribers
   * registered before the `dispatch()` started will be called with the latest
   * state by the time it exits.
   *
   * @param {Function} listener A callback to be invoked on every dispatch.
   * @returns {Function} A function to remove this change listener.
   */
  /**
   * 将一个监听器添加到currentListeners中。
   * 当action被dispatch，并且state树上某些state改变了，它就会被调用。
   *
   * 如果在listener中调用dispatch()方法，就需要注意：
   * 1. 如果在listeners被调用的时候去unsubscribe它，当前一次的执行并不会停止。
   * 2. listener不会监测到所有state的变化，因为在它被调用前，dispatch可能已经执行多次。
   *
   * @param listener {Function} 监听器函数
   * @return {unsubscribe}      unsubscribe()方法，解除订阅
   */
  function subscribe(listener) {
    if (typeof listener !== 'function') {
      throw new Error('Expected the listener to be a function.')
    }

    if (isDispatching) {
      throw new Error(
        'You may not call store.subscribe() while the reducer is executing. ' +
        'If you would like to be notified after the store has been updated, subscribe from a ' +
        'component and invoke store.getState() in the callback to access the latest state. ' +
        'See https://redux.js.org/api-reference/store#subscribe(listener) for more details.'
      )
    }

    // 记录当前listener是否有效
    let isSubscribed = true

    // 制造副本，添加该listener
    ensureCanMutateNextListeners()
    nextListeners.push(listener)

    // 返回unsubscribe()方法
    return function unsubscribe() {
      // 防止重复unsubscribe
      if (!isSubscribed) {
        return
      }

      if (isDispatching) {
        throw new Error(
          'You may not unsubscribe from a store listener while the reducer is executing. ' +
          'See https://redux.js.org/api-reference/store#subscribe(listener) for more details.'
        )
      }

      isSubscribed = false

      // 制造副本，移除该listener
      ensureCanMutateNextListeners()
      const index = nextListeners.indexOf(listener)
      nextListeners.splice(index, 1)
    }
  }

  /**
   * Dispatches an action. It is the only way to trigger a state change.
   *
   * The `reducer` function, used to create the store, will be called with the
   * current state tree and the given `action`. Its return value will
   * be considered the **next** state of the tree, and the change listeners
   * will be notified.
   *
   * The base implementation only supports plain object actions. If you want to
   * dispatch a Promise, an Observable, a thunk, or something else, you need to
   * wrap your store creating function into the corresponding middleware. For
   * example, see the documentation for the `redux-thunk` package. Even the
   * middleware will eventually dispatch plain object actions using this method.
   *
   * @param {Object} action A plain object representing “what changed”. It is
   * a good idea to keep actions serializable so you can record and replay user
   * sessions, or use the time travelling `redux-devtools`. An action must have
   * a `type` property which may not be `undefined`. It is a good idea to use
   * string constants for action types.
   *
   * @returns {Object} For convenience, the same action object you dispatched.
   *
   * Note that, if you use a custom middleware, it may wrap `dispatch()` to
   * return something else (for example, a Promise you can await).
   */
  /**
   * 执行action，只能通过dispatch()来改变state
   * @param action
   * @return {*}
   */
  function dispatch(action) {
    if (!isPlainObject(action)) {
      throw new Error(
        'Actions must be plain objects. ' +
        'Use custom middleware for async actions.'
      )
    }
    if (typeof action.type === 'undefined') {
      throw new Error(
        'Actions may not have an undefined "type" property. ' +
        'Have you misspelled a constant?'
      )
    }
    if (isDispatching) {
      throw new Error('Reducers may not dispatch actions.')
    }

    /**
     * 给reducer传入currentState和action，从而执行。
     * 忽略执行时可能产生的错误
     */
    try {
      isDispatching = true
      currentState = currentReducer(currentState, action)
    } finally {
      isDispatching = false
    }

    /**
     * 逐个调用listener
     */
    const listeners = (currentListeners = nextListeners)
    for (let i = 0; i < listeners.length; i++) {
      const listener = listeners[i]
      listener()
    }

    return action
  }

  /**
   * Replaces the reducer currently used by the store to calculate the state.
   *
   * You might need this if your app implements code splitting and you want to
   * load some of the reducers dynamically. You might also need this if you
   * implement a hot reloading mechanism for Redux.
   *
   * @param {Function} nextReducer The reducer for the store to use instead.
   * @returns {void}
   */
  /**
   * 热切换reducer
   * 触发保留的ActionTypes.REPLACE action去发出通知
   * @param nextReducer
   */
  function replaceReducer(nextReducer) {
    if (typeof nextReducer !== 'function') {
      throw new Error('Expected the nextReducer to be a function.')
    }

    currentReducer = nextReducer
    dispatch({ type: ActionTypes.REPLACE })
  }

  /**
   * Interoperability point for observable/reactive libraries.
   * @returns {observable} A minimal observable of state changes.
   * For more information, see the observable proposal:
   * https://github.com/tc39/proposal-observable
   */
  /**
   * ECMAScript中observable形式的实现
   */
  function observable() {
    const outerSubscribe = subscribe
    return {
      /**
       * The minimal observable subscription method.
       * @param {Object} observer Any object that can be used as an observer.
       * The observer object should have a `next` method.
       * @returns {subscription} An object with an `unsubscribe` method that can
       * be used to unsubscribe the observable from the store, and prevent further
       * emission of values from the observable.
       */
      subscribe(observer) {
        if (typeof observer !== 'object' || observer === null) {
          throw new TypeError('Expected the observer to be an object.')
        }

        function observeState() {
          if (observer.next) {
            observer.next(getState())
          }
        }

        observeState()
        const unsubscribe = outerSubscribe(observeState)
        return { unsubscribe }
      },

      [$$observable]() {
        return this
      }
    }
  }

  // When a store is created, an "INIT" action is dispatched so that every
  // reducer returns their initial state. This effectively populates
  // the initial state tree.
  dispatch({ type: ActionTypes.INIT })

  return {
    dispatch,
    subscribe,
    getState,
    replaceReducer,
    [$$observable]: observable
  }
}
