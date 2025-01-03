import type { GraphNode } from '../classes/GraphNode'
import { EvaluationReason, InternalEvaluationReason } from '../types/index'

/**
 * The EdgeFlags. These are used as bitwise flags.
 *
 * The flag score determines job priority in the scheduler. Scores range from
 * 0-7. Lower score = higher prio. Examples:
 *
 * 0 = implicit-internal-dynamic
 * 3 = explicit-external-dynamic
 * 7 = explicit-external-static
 *
 * IMPORTANT: Keep these in-sync with the copies in the react package -
 * packages/react/src/utils.ts
 */
export const Explicit = 1
export const External = 2
export const ExplicitExternal = Explicit | External
export const Static = 4
export const OutOfRange = 8 // not a flag; use a value bigger than any flag

/**
 * The InternalEvaluationTypes. These get translated to user-friendly
 * EvaluationTypes by `ecosytem.why`.
 */
export const Invalidate = 1
export const Destroy = 2
export const PromiseChange = 3
export const EventSent = 4

export type InternalEvaluationType =
  | typeof Destroy
  | typeof Invalidate
  | typeof PromiseChange
  | typeof EventSent

export const isZeduxNode = 'isZeduxNode'

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

const reasonTypeMap = {
  [Destroy]: 'node destroyed',
  [Invalidate]: 'cache invalidated',
  [PromiseChange]: 'promise changed',
  4: 'state changed',
} as const

export const makeReasonsReadable = (
  node?: GraphNode,
  internalReasons: InternalEvaluationReason[] | undefined = node?.w
): EvaluationReason[] | undefined =>
  internalReasons?.map(reason => ({
    newState: reason.s?.get(),
    oldState: reason.p,
    operation: node?.s.get(reason.s!)?.operation,
    reasons: reason.r && makeReasonsReadable(reason.s, reason.r),
    source: reason.s,
    type: reasonTypeMap[reason.t ?? 4],
  }))
