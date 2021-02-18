import {
  createActorFactory,
  createReducer,
  createStore,
  Store,
} from '@zedux/core'
import { Atom, AtomInstance, Molecule } from '../types'

const createActor = createActorFactory('@@react-zedux', 'global')
export const addApp = createActor<{
  appId: string
  atoms?: Atom[]
  testMode?: boolean
}>('addApp')
export const addAtomImplementation = createActor<Atom>('addAtomImplementation')
export const addAtomInstance = createActor<{
  appId: string
  atomInstance: AtomInstance
}>('addAtomInstance')
export const addMolecule = createActor<Molecule>('addMolecule')
export const atomInstanceReady = createActor<{
  dependencies: [string, string][]
  internalId: string
  key: string
  stateStore: Store
}>('atomInstanceReady')
export const removeApp = createActor<{
  appId: string
  instances: Record<string, string>
}>('removeApp')
export const removeAtomInstance = createActor<{
  appId: string
  fullKey: string
  internalId: string
  key: string
}>('removeAtomInstance')

const atomsReducer = createReducer<{
  [key: string]: {
    implementations: {
      [key: string]: Atom
    }
    instances: {
      [key: string]: AtomInstance
    }
  }
}>({})
  .reduce(addAtomImplementation, (state, atom) => ({
    ...state,
    [atom.key]: {
      ...state[atom.key],
      implementations: {
        ...state[atom.key]?.implementations,
        [atom.internalId]: atom,
      },
    },
  }))
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
  .reduce(
    atomInstanceReady,
    (state, { dependencies, internalId, key, stateStore }) => ({
      ...state,
      [key]: {
        ...state[key],
        instances: {
          ...state[key].instances,
          [internalId]: {
            ...state[key].instances[internalId],
            dependencies,
            stateStore,
          },
        },
      },
    })
  )
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

const moleculesReducer = createReducer<Record<string, Molecule>>({}).reduce(
  addMolecule,
  (state, molecule) => ({
    ...state,
    [molecule.key]: molecule,
  })
)

const poolsReducer = createReducer<{
  [appId: string]: {
    instances: {
      [fullKey: string]: string
    }
    isTestMode?: boolean
    overrides?: {
      [key: string]: string
    }
  }
}>({
  global: {
    // the global pool can't have overrides - they're only specified in app scopes (but can apply to global atoms)
    instances: {},
  },
})
  .reduce(addApp, (state, { appId, atoms, testMode }) => ({
    ...state,
    [appId]: {
      instances: {},
      isTestMode: !!testMode,
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
        [atomInstance.fullKey]: atomInstance.internalId,
      },
    },
  }))
  .reduce(removeAtomInstance, (state, { appId, fullKey }) => {
    const newInstances = { ...state[appId].instances }
    delete newInstances[fullKey]

    return {
      ...state,
      [appId]: {
        ...state[appId],
        instances: newInstances,
      },
    }
  })

export const globalStore: Store<{
  atoms: ReturnType<typeof atomsReducer>
  molecules: ReturnType<typeof moleculesReducer>
  pools: ReturnType<typeof poolsReducer>
}> = createStore({
  atoms: atomsReducer,
  molecules: moleculesReducer,
  pools: poolsReducer,
})
;(window as any).globalStore = globalStore

globalStore.subscribe({
  effects: ({ action }) => console.log('global store got action:', action),
})
globalStore.subscribe(newState =>
  console.log('global store state change', newState)
)
