import { readInstance } from '../classes/EvaluationStack'

/**
 * A fake injector (can actually be used in loops and if statements). An alias
 * for:
 *
 * ```ts
 * const { ecosystem } = injectAtomGetters()
 * const reasons = ecosystem.why()
 * ```
 */
export const injectWhy = () => readInstance().nextReasons
