import type { Ecosystem } from '../classes/Ecosystem'
import { injectSelf } from './injectSelf'

/**
 * injectEcosystem
 *
 * An injector that returns the ecosystem that owns the currently-evaluating
 * atom. Ecosystems have two methods that automatically register graph
 * dependencies when used in reactive contexts (like the function that called
 * `injectEcosystem`):
 *
 * - `get` - registers a dynamic graph edge on the resolved node
 * - `getNode` - registers a static graph edge on the resolved node
 *
 * ```ts
 * const exampleAtom = atom('example', () => {
 *   const { get, getNode, getOnce } = injectEcosystem()
 *   const dynamicVal = get(myAtom) // registers a dynamic graph edge
 *   const instance = getNode(myAtom) // registers a static graph edge
 *   const fromEcosystem = getOnce(myAtom) // doesn't register anything
 *
 *   injectEffect(() => {
 *     const dynamicVal2 = get(myAtom) // doesn't register anything
 *     const instance2 = getNode(myAtom) // doesn't register anything
 *     const fromEcosystem2 = getOnce(myAtom) // doesn't register anything
 *   }, []) // no need to pass `ecosystem` or `get`, etc as deps; they're stable references
 * })
 * ```
 *
 * @see Ecosystem
 */
export const injectEcosystem = (): Ecosystem => injectSelf().e
