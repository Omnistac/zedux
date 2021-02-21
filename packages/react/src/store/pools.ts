import { createReducer } from '@zedux/core'
import { AtomContext, AtomContextInstance } from '../types'
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
    // the global pool can't have overrides - they're only specified in app scopes (but can apply to global atoms)
    instances: {},
  },
}

export const poolsReducer = createReducer<{
  [appId: string]: {
    atomContexts?: Map<AtomContext, AtomContextInstance>
    flags?: string[]
    instances: {
      [keyHash: string]: string
    }
    overrides?: {
      [key: string]: string
    }
  }
}>(initialState)
  .reduce(addApp, (state, { appId, atoms, atomContexts, flags }) => ({
    ...state,
    [appId]: {
      atomContexts,
      flags,
      instances: {},
      overrides: atoms
        ? atoms.reduce(
            (map, atom) => ({
              ...map,
              [atom.key]: atom.internalId,
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
      instances: {
        ...state[appId].instances,
        [atomInstance.keyHash]: atomInstance.internalId,
      },
    },
  }))
  .reduce(removeAtomInstance, (state, { appId, keyHash }) => {
    const newInstances = { ...state[appId].instances }
    delete newInstances[keyHash]

    return {
      ...state,
      [appId]: {
        ...state[appId],
        instances: newInstances,
      },
    }
  })
  .reduce(updateApp, (state, { appId, atoms, atomContexts, flags }) => ({
    ...state,
    [appId]: {
      atomContexts,
      flags,
      instances: {},
      overrides: atoms
        ? atoms.reduce(
            (map, atom) => ({
              ...map,
              [atom.key]: atom.internalId,
            }),
            {}
          )
        : {},
    },
  }))
  .reduce(wipe, () => initialState)
