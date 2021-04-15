import { createReducer } from '@zedux/core'
import { AtomBaseProperties } from '../types'
import { wipe } from './actions'

// TODO: This (how will tracking atom implementations work with hot reloading)
export const atomsReducer = createReducer<{
  [atomKey: string]: {
    [implementationId: string]: AtomBaseProperties<any, any[]>
  }
}>({}).reduce(wipe, () => ({}))
