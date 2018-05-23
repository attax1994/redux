import compose from './compose'

/**
 * Creates a store enhancer that applies middleware to the dispatch method
 * of the Redux store. This is handy for a variety of tasks, such as expressing
 * asynchronous actions in a concise manner, or logging every action payload.
 *
 * See `redux-thunk` package as an example of the Redux middleware.
 *
 * Because middleware is potentially asynchronous, this should be the first
 * store enhancer in the composition chain.
 *
 * Note that each middleware will be given the `dispatch` and `getState` functions
 * as named arguments.
 *
 * @param {...Function} middlewares The middleware chain to be applied.
 * @returns {Function} A store enhancer applying the middleware.
 */

/**
 * 创建一个enhancer，将middleware的应用于dispatch方法。
 * 由于middleware可能是异步的，所以这个方法应当在最前面使用。
 * 每个dispatch都能在第一个传入的参数（middlewareAPI）中访问dispatch和getState
 * @param middlewares
 * @return {function(*): function(...[*]): {dispatch: dispatch}}
 */
export default function applyMiddleware(...middlewares) {
  // 先传入createStore，后面再传入reducer和preloadedState
  return createStore => (...args) => {
    // 创建store
    const store = createStore(...args)

    // 不允许在构建middleware时调用dispatch
    let dispatch = () => {
      throw new Error(
        `Dispatching while constructing your middleware is not allowed. ` +
        `Other middleware would not be applied to this dispatch.`
      )
    }

    /**
     * 构建middlewareAPI，替代store
     */
    const middlewareAPI = {
      getState: store.getState,
      dispatch: (...args) => dispatch(...args)
    }
    /**
     *  给每个middleware传入第一个参数store（使用middlewareAPI，而不是暴露整个store实例）
     */
    const chain = middlewares.map(middleware => middleware(middlewareAPI))

    /**
     * 将传入store的middleware互相嵌套起来，并传入第二个参数next
     * 最内层传入dispatch，从最内层开始运行，一级一级向外返回闭包，成为外层的第二个参数next
     */
    dispatch = compose(...chain)(store.dispatch)

    /**
     * 等到进行真正的dispatch的时候，传入第三个参数action
     */
    return {
      ...store,
      dispatch
    }
  }
}

/**
 * 一个典型的Middleware的形式
 * store其实是改造过的middlewareAPI
 * next表示内部一层的middleware，用来移交控制权。最内层的是dispatch
 * action在运行时被传入，传递真正的action
 */
export const crashReporter = store => next => action => {
  try {
    return next(action)
  } catch (err) {
    if (process.env.NODE_ENV !== 'production') {
      console.log('Caught an exception in Redux', err)
    }
  }
}
