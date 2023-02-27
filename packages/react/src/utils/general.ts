import { createContext } from 'react'

/**
 * The EdgeFlags. These are used as bitwise flags.
 *
 * The flag score determines job priority in the scheduler. Scores range from
 * 0-7. Lower score = higher prio. Examples:
 *
 * 0 = implicit-internal-dynamic
 * 3 = explicit-external-dynamic
 * 7 = explicit-external-static
 */
export const Explicit = 1
export const External = 2
export const Static = 4
// export const Deferred = 8

export const ecosystemContext = createContext('@@global')

/**
 * Compare two arrays and see if any elements are different (===). Returns true
 * by default if either array is undefined
 */
export const haveDepsChanged = (prevDeps?: any[], nextDeps?: any[]) =>
  !prevDeps ||
  !nextDeps ||
  prevDeps.length !== nextDeps.length ||
  prevDeps.some((dep, i) => nextDeps[i] !== dep)

export const prefix = '@@zedux'

export const destroyed = Symbol(`${prefix}/destroyed`)
