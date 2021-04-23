import { split } from '../utils'
import { InjectorType, ExportsInjectorDescriptor } from '../utils/types'

/**
 * injectExports()
 *
 * Allows an atom to expose references to consumers. All exported properties
 * should be functions, ref objects, or otherwise stable references.
 *
 * Refs should be used if any atom state or injected values need to be used in
 * an exported function.
 *
 * While exported values don't _have_ to be the same reference on every atom
 * evaluation, it's good practice. Exported values are never updated. If a
 * different e.g. function reference is exported on a subsequent evaluation, the
 * new function will be discarded.
 *
 * Example:
 *
 * ```ts
 * import { atom, injectExports, injectStore } from '@zedux/react'
 *
 * interface Exports {
 *   decrement(): number
 *   increment(): number
 * }
 *
 * atom<number, [], Exports>('counter', () => {
 *   const store = injectStore(0, false)
 *
 *   // say we have another atom that stores the increment "step" size:
 *   const step = stepAtom.injectValue()
 *   const stepRef = injectRef(step)
 *
 *   // mutating refs like this is fine (no React CM to worry about here)
 *   stepRef.current = step
 *
 *   // `store` is a stable reference and we've made `step` stable with a ref.
 *   // Note that these function references change on every evaluation.
 *   // Only the initial references will be stored.
 *   injectExports<Exports>({
 *     decrement: () => store.setState(state => state - stepRef.current)
 *     increment: () => store.setState(state => state + stepRef.current)
 *   })
 *
 *   return store
 * })
 * ```
 *
 * @param {Exports} exports - An object of all exposed properties
 * @returns Exports
 */
export const injectExports = <Exports extends Record<string, any>>(
  exports: Exports
) => {
  const descriptor = split<ExportsInjectorDescriptor<Exports>>(
    'injectExports',
    InjectorType.Exports,
    () => ({
      exports,
      type: InjectorType.Exports,
    })
  )

  return descriptor.exports
}
