/**
 * These are private action types reserved by Redux.
 * For any unknown actions, you must return the current state.
 * If the current state is undefined, you must return the initial state.
 * Do not reference these action types directly in your code.
 */
/**
 * 这些是Redux内部预留的私有action
 * 对于任何未知的action，必须返回当前的state树。
 * 如果当前的state树还是undefined，那就返回初始state（每个reducer要定义好它负责的部分state的初始值）。
 * 不要在代码中直接访问这些action types。
 */

const randomString = () =>
  Math.random()
    .toString(36)
    .substring(7)
    .split('')
    .join('.')

const ActionTypes = {
  INIT: `@@redux/INIT${randomString()}`,
  REPLACE: `@@redux/REPLACE${randomString()}`,
  PROBE_UNKNOWN_ACTION: () => `@@redux/PROBE_UNKNOWN_ACTION${randomString()}`
}

export default ActionTypes
