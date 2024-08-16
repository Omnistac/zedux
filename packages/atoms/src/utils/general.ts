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
export const Static = 4
export const OutOfRange = 8 // not a flag; use a value bigger than any flag

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
