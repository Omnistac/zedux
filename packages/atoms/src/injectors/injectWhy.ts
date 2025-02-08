import { makeReasonsReadable } from '../utils/general'
import { injectSelf } from './injectSelf'

/**
 * An "unrestricted" injector (can actually be used in loops and if statements).
 * An alias for:
 *
 * ```ts
 * const ecosystem = injectEcosystem()
 * const reasons = ecosystem.why()
 * ```
 */
export const injectWhy = () => makeReasonsReadable(injectSelf())!
