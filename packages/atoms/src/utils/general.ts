import type { GraphNode } from '../classes/GraphNode'
import { EvaluationReason, InternalEvaluationReason } from '../types/index'

/**
 * The EdgeFlags. These are used as bitwise flags.
 *
 * The flag score determines job priority in the scheduler. Scores range from
 * 0-8. Lower score = higher prio. Examples:
 *
 * - 0 = eventAware-implicit-internal-dynamic (aka TopPrio)
 * - 3 = eventless-explicit-internal-dynamic
 * - 15 = eventless-explicit-external-static
 *
 * Event edges are (currently) never paired with other flags and are unique in
 * that they don't prevent node destruction.
 *
 * IMPORTANT: Keep these in-sync with the copies in the react package -
 * packages/react/src/utils.ts
 */
export const TopPrio = 0
export const Eventless = 1
export const Explicit = 2
export const External = 4
export const Static = 8
export const OutOfRange = 16 // not a flag; use a value bigger than any flag
export const ExplicitExternal = Explicit | External
export const EventlessStatic = Eventless | Static

/**
 * The InternalEvaluationTypes. These get translated to user-friendly
 * strings by `ecosytem.why`.
 *
 * IMPORTANT! Keep these in sync with `@zedux/stores/atoms-port.ts`
 */
export const Invalidate = 1
export const Cycle = 2 // only causes evaluations when status becomes Destroyed
export const PromiseChange = 3
export const EventSent = 4

export type InternalEvaluationType =
  | typeof Cycle
  | typeof EventSent
  | typeof Invalidate
  | typeof PromiseChange

/**
 * Compare two arrays for shallow equality. Returns true if they're "equal".
 * Returns false if either array is undefined
 */
export const compare = (nextDeps?: any[], prevDeps?: any[]) =>
  prevDeps &&
  nextDeps &&
  prevDeps.length === nextDeps.length &&
  !prevDeps.some((dep, i) => nextDeps[i] !== dep)

export const prefix = '@@zedux'

export const makeReasonReadable = (
  reason: InternalEvaluationReason,
  node?: GraphNode
): EvaluationReason => {
  const base = {
    operation: node?.s.get(reason.s!)?.operation,
    reasons: reason.r && makeReasonsReadable(reason.s, reason.r),
    source: reason.s,
  }

  return reason.t === Cycle
    ? {
        ...base,
        oldStatus: reason.o,
        newStatus: reason.n,
        type: 'cycle',
      }
    : reason.t === Invalidate
    ? {
        ...base,
        type: 'invalidate',
      }
    : reason.t === PromiseChange
    ? {
        ...base,
        type: 'promiseChange',
      }
    : reason.t === EventSent
    ? {
        ...base,
        type: 'event',
      }
    : {
        ...base,
        newState: reason.n,
        oldState: reason.o,
        type: 'change',
      }
}

export const makeReasonsReadable = (
  node?: GraphNode,
  internalReasons: InternalEvaluationReason[] | undefined = node?.w
): EvaluationReason[] | undefined =>
  internalReasons?.map(reason => makeReasonReadable(reason, node))
