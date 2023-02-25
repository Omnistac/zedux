import { createContext } from 'react'

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
