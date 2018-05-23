/**
 * 检查某个对象是否为JS普通对象
 * @param {any} obj 要检查的对象
 * @returns {boolean} 如果是普通对象，返回true
 */
export default function isPlainObject(obj) {
  if (typeof obj !== 'object' || obj === null) return false

  // 递归原型链，得到除null外，最内层的__proto__（对于引用类型而言，通常是Object.prototype）
  let proto = obj
  while (Object.getPrototypeOf(proto) !== null) {
    proto = Object.getPrototypeOf(proto)
  }

  return Object.getPrototypeOf(obj) === proto
}
