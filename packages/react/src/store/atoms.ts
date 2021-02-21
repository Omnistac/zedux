import { createReducer } from '@zedux/core'
import { Atom, AtomInstanceBase } from '../types'
import { addAtomInstance, removeApp, removeAtomInstance, wipe } from './actions'

export const atomsReducer = createReducer<{
  [key: string]: {
    implementations: {
      [key: string]: Atom
    }
    instances: {
      [key: string]: AtomInstanceBase
    }
  }
}>({})
  .reduce(addAtomInstance, (state, { atomInstance }) => ({
    ...state,
    [atomInstance.key]: {
      ...state[atomInstance.key],
      instances: {
        ...state[atomInstance.key]?.instances,
        [atomInstance.internalId]: atomInstance,
      },
    },
  }))
  .reduce(removeApp, (state, { instances }) => {
    const newState = { ...state }

    Object.entries(instances).forEach(([key, instanceId]) => {
      newState[key] = {
        ...newState[key],
        instances: {
          ...newState[key].instances,
        },
      }

      delete newState[key].instances[instanceId]
    })

    return newState
  })
  .reduce(removeAtomInstance, (state, { internalId, key }) => {
    const newInstances = { ...state[key].instances }
    delete newInstances[internalId]

    return {
      ...state,
      [key]: {
        ...state[key],
        instances: newInstances,
      },
    }
  })
  .reduce(wipe, () => ({}))
