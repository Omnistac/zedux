import { AtomGetters } from '../types'
import { diContext } from '../utils/csContexts'

/**
 * injectAtomGetters
 *
 * An injector that returns an AtomGetters object. The returned AtomGetters
 * dynamically register dependencies for the current atom instance when called
 * synchronously during atom evaluation.
 *
 * ```ts
 * const exampleAtom = atom('example', () => {
 *   const { ecosystem, get, getInstance } = injectAtomGetters()
 *   const dynamicVal = get(myAtom) // registers a dynamic graph edge
 *   const instance = getInstance(myAtom) // registers a static graph edge
 *   const fromEcosystem = ecosystem.get(myAtom) // doesn't register anything
 *
 *   injectEffect(() => {
 *     const dynamicVal2 = get(myAtom) // doesn't register anything
 *     const instance2 = getInstance(myAtom) // doesn't register anything
 *     const fromEcosystem2 = ecosystem.get(myAtom) // doesn't register anything
 *   }, []) // no need to pass AtomGetters as deps; they're stable references
 * })
 * ```
 *
 * @see AtomGetters
 */
export const injectAtomGetters = () => {
  const { instance } = diContext.consume()

  const atomGetters: AtomGetters = {
    ecosystem: instance.ecosystem,
    get: instance.get.bind(instance),
    getInstance: instance.getInstance.bind(instance),
    select: instance.select.bind(instance),
  }

  return atomGetters
}
