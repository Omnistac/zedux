import { readInstance } from '../utils/evaluationContext'

/**
 * An "unrestricted" injector (can actually be used in loops and if statements).
 * An alias for:
 *
 * ```ts
 * const { ecosystem } = injectAtomGetters()
 * const reasons = ecosystem.why()
 * ```
 */
export const injectWhy = () => readInstance().w
