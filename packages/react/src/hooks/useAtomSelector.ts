import { ParamsOf, Selectable, StateOf } from '@zedux/atoms'
import { useAtomValue } from './useAtomValue'

/**
 * Get the result of running a selector in the current ecosystem.
 *
 * If the exact selector function (or object if it's an AtomSelectorConfig
 * object) reference + params combo has been used in this ecosystem before,
 * return the cached result.
 *
 * Register a dynamic graph dependency between this React component (as a new
 * external node) and the selector.
 *
 * @deprecated use `useAtomValue` instead:
 *
 * ```ts
 * useAtomSelector(mySelector, arg1, arg2) // before
 * useAtomValue(mySelector, [arg1, arg2]) // after
 * ```
 */
export const useAtomSelector = <S extends Selectable>(
  template: S,
  ...args: ParamsOf<S>
): StateOf<S> => useAtomValue(template, args, { operation: 'useAtomSelector' })
