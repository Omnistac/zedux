import type { AtomInstance } from '../classes/instances/AtomInstance'
import type { AtomTemplateBase } from '../classes/templates/AtomTemplateBase'
import type { AtomApi } from '../classes/AtomApi'
import type { SelectorInstance } from '../classes/SelectorInstance'
import type { ZeduxNode } from '../classes/ZeduxNode'
import type { AtomTemplate } from '../classes/templates/AtomTemplate'
import type {
  EvaluationReason,
  InternalEvaluationReason,
  LifecycleStatus,
} from '../types/index'

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

/**
 * Lifecycle statuses
 */
export const INITIALIZING = 1
export const ACTIVE = 2
export const STALE = 3
export const DESTROYED = 4

export type InternalLifecycleStatus =
  | typeof ACTIVE
  | typeof DESTROYED
  | typeof INITIALIZING
  | typeof STALE

/**
 * Event names
 */
export const CATCH_ALL = '' // TIL empty string can be an object key
export const CHANGE = 'change'
export const CYCLE = 'cycle'
export const EDGE = 'edge'
export const ERROR = 'error'
export const INVALIDATE = 'invalidate'
export const MUTATE = 'mutate'
export const PROMISE_CHANGE = 'promiseChange'
export const RESET_END = 'resetEnd'
export const RESET_START = 'resetStart'
export const RUN_END = 'runEnd'
export const RUN_START = 'runStart'

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

/**
 * is() - Checks if a value is an instance of a class
 *
 * We can't use instanceof 'cause that breaks across realms - e.g. when an atom
 * instance is shared between a parent and child window, that instance's object
 * reference will be different in both windows (since each window creates its
 * own copy of Zedux).
 *
 * The classToCheck should have a static $$typeof property whose value is a
 * symbol created with Symbol.for() (sharing the symbol reference across realms)
 *
 * This works no matter how deep the inheritance tree is for either object
 * passed.
 *
 * @param val anything - the thing we're checking
 * @param classToCheck a class with a static $$typeof property
 * @returns boolean - whether val is an instanceof classToCheck
 */
export const is: {
  (value: any, classToCheck: typeof AtomInstance): value is AtomInstance
  (value: any, classToCheck: typeof AtomTemplateBase): value is AtomTemplate
  (value: any, classToCheck: typeof AtomApi): value is AtomApi<any>
  (value: any, classToCheck: typeof SelectorInstance): value is SelectorInstance
} = (val: any, classToCheck: { $$typeof: symbol }): val is any =>
  val?.constructor?.$$typeof === classToCheck.$$typeof

export const makeReasonReadable = (
  reason: InternalEvaluationReason,
  node?: ZeduxNode,
  includeOperation = false
): EvaluationReason => {
  // when a node gets 2 or more reasons at once, we start wrapping them in these
  // wrapper reasons so they can be mutated per-node to avoid mutation bugs.
  // Unwrap them
  if (reason.r && !reason.s) {
    return makeReasonReadable(reason.r, node, includeOperation)
  }

  const base = {
    operation: includeOperation ? node?.s.get(reason.s!)?.operation : undefined,
    reasons:
      reason.r && makeReasonsReadable(reason.s, reason.r, includeOperation),
    source: reason.s,
  }

  const readableReason =
    reason.t === Cycle
      ? ({
          ...base,
          oldStatus: StatusMap[reason.o as InternalLifecycleStatus],
          newStatus: StatusMap[reason.n as InternalLifecycleStatus],
          type: CYCLE,
        } as const)
      : reason.t === Invalidate
      ? ({
          ...base,
          type: INVALIDATE,
        } as const)
      : reason.t === PromiseChange
      ? ({
          ...base,
          type: PROMISE_CHANGE,
        } as const)
      : reason.t === EventSent
      ? ({
          ...base,
          type: 'event',
        } as const)
      : ({
          ...base,
          newState: reason.n,
          oldState: reason.o,
          type: CHANGE,
        } as const)

  // only mutate this when not including `operation` - that requires different
  // reason objects for each observer, depending on its operation
  if (!reason.f && !includeOperation) {
    reason.f = { ...reason.e, [readableReason.type]: readableReason }
  }

  return readableReason
}

export const makeReasonsReadable = (
  node?: ZeduxNode,
  reason: InternalEvaluationReason | undefined = node?.w,
  includeOperation = true
): EvaluationReason[] | undefined => {
  if (!node) return

  const reasons: EvaluationReason[] = []

  if (!reason) return reasons

  do {
    reasons.push(makeReasonReadable(reason, node, includeOperation))
  } while ((reason = reason.l))

  return reasons
}

export const StatusMap: Record<InternalLifecycleStatus, LifecycleStatus> = {
  [ACTIVE]: 'Active',
  [DESTROYED]: 'Destroyed',
  [INITIALIZING]: 'Initializing',
  [STALE]: 'Stale',
}
