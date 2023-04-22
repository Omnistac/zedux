import { createContext } from 'react'

export const ecosystemContext = createContext('@@global')

/**
 * These are copied from packages/atoms/src/utils/general.ts
 *
 * IMPORTANT: keep these in-sync with the ones in the atoms package
 */
export const Explicit = 1
export const External = 2
export const Static = 4
// export const Deferred = 8

export const destroyed = Symbol.for(`@@zedux/destroyed`)
