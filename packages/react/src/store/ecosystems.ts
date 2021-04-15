import { createReducer } from '@zedux/core'
import { AtomBaseProperties, AtomContext, AtomContextInstance } from '../types'
import {
  addApp,
  addAtomInstance,
  removeApp,
  removeAtomInstance,
  updateApp,
  wipe,
} from './actions'

const initialState = {
  global: {
    // the global pool can't have atomContexts, overrides, or flags - those are
    // only specified in app scopes
    instances: [],
  },
}

export const ecosystemsReducer = createReducer<{
  [appId: string]: {
    atomContexts?: Map<AtomContext, AtomContextInstance>
    flags?: string[]
    instances: string[]
    overrides?: {
      [atomKey: string]: AtomBaseProperties<any, any[]>
    }
  }
}>(initialState)
  .reduce(addApp, (state, { appId, atoms, atomContexts, flags }) => ({
    ...state,
    [appId]: {
      atomContexts,
      flags,
      instances: [],
      overrides: atoms
        ? atoms.reduce(
            (map, atom) => ({
              ...map,
              [atom.key]: atom,
            }),
            {}
          )
        : {},
    },
  }))
  .reduce(removeApp, (state, { appId }) => {
    const newState = { ...state }
    delete newState[appId]

    return newState
  })
  .reduce(addAtomInstance, (state, { appId, atomInstance }) => ({
    ...state,
    [appId]: {
      ...state[appId],
      instances: [...state[appId].instances, atomInstance.internals.keyHash],
    },
  }))
  .reduce(removeAtomInstance, (state, { appId, keyHash }) => {
    return {
      ...state,
      [appId]: {
        ...state[appId],
        instances: state[appId].instances.filter(
          instance => instance !== keyHash
        ),
      },
    }
  })
  .reduce(updateApp, (state, { appId, atoms, atomContexts, flags }) => ({
    ...state,
    [appId]: {
      atomContexts,
      flags,
      instances: [], // ... yeah ... no. Need to intelligently update all deps everywhere on any updated atomContexts and overrides
      overrides: atoms
        ? atoms.reduce(
            (map, atom) => ({
              ...map,
              [atom.key]: atom,
            }),
            {}
          )
        : {},
    },
  }))
  .reduce(wipe, () => initialState)
