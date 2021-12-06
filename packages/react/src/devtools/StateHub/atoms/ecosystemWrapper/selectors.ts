import {
  AtomGetters,
  Ecosystem,
  injectEffect,
  injectStore,
  ion,
  Mod,
} from '@zedux/react'
import { stateHubEcosystemId } from '../../stateHubEcosystem'
import { AtomInstanceSnapshot } from '../../types'
import { destroyedEcosystemWrapper } from '../destroyedEcosystemWrapper'
import { stateHub } from '../stateHub'
import { ecosystemWrapper } from './atom'

const createReactiveIon = <T>(
  key: string,
  getState: (ecosystem?: Ecosystem, prevState?: T) => T,
  events: Mod[]
) => {
  return ion(
    key,
    getters => {
      return injectReactiveState(getters, getState, events)
    },
    { ttl: 30000 }
  )
}

const injectReactiveState = <T>(
  { select }: AtomGetters,
  getState: (ecosystem?: Ecosystem, prevState?: T) => T,
  events: Mod[]
) => {
  const ecosystemWrapper = select(getCurrentEcosystemWrapperInstance)
  const store = injectStore(getState(ecosystemWrapper.exports.getEcosystem()))

  injectEffect(() => {
    // set atoms again when wrapped ecosystem instance changes and in case some
    // were added between render and this effect running
    store.setState(state =>
      getState(ecosystemWrapper.exports.getEcosystem(), state)
    )

    return ecosystemWrapper.exports.subscribeTo(events, () => {
      store.setState(state =>
        getState(ecosystemWrapper.exports.getEcosystem(), state)
      )
    })
  }, [ecosystemWrapper])

  return store
}

export const ecosystemAtoms = createReactiveIon(
  'ecosystemAtoms',
  ecosystem => {
    if (!ecosystem) return []

    const atoms = new Set<string>()

    Object.values(ecosystem._instances).forEach(instance => {
      atoms.add(instance.atom.key)
    })

    return [...atoms]
  },
  ['ecosystemWiped', 'instanceActiveStateChanged']
)

export const ecosystemAtomFlags = createReactiveIon(
  'ecosystemAtomFlags',
  ecosystem => {
    if (!ecosystem) return []

    const flags = new Set<string>()

    Object.values(ecosystem._instances).forEach(instance => {
      instance.atom.flags?.forEach(flag => flags.add(flag))
    })

    return [...flags]
  },
  ['ecosystemWiped', 'instanceActiveStateChanged']
)

export const ecosystemAtomInstances = createReactiveIon(
  'ecosystemAtomInstances',
  ecosystem => {
    if (!ecosystem) return []

    return Object.values(ecosystem._instances)
  },
  ['ecosystemWiped', 'instanceActiveStateChanged']
)

export const ecosystemAtomInstance = ion(
  'ecosystemAtomInstance',
  (getters, keyHash: string) => {
    return injectReactiveState<AtomInstanceSnapshot | undefined>(
      getters,
      (ecosystem, oldSnapshot) => {
        // the stateHub would get in an infinite setState loop if inspecting its
        // own atoms were reactive
        if (ecosystem?.ecosystemId === stateHubEcosystemId && oldSnapshot) {
          return oldSnapshot
        }

        const instance = ecosystem?._instances[keyHash]
        if (!instance) return oldSnapshot

        const newSnapshot: AtomInstanceSnapshot = {
          activeState: instance?._activeState,
          instance,
          state: instance?.store.getState(),
        }

        if (
          oldSnapshot &&
          Object.entries(newSnapshot).every(
            ([key, val]) =>
              val === oldSnapshot[key as keyof AtomInstanceSnapshot]
          )
        ) {
          return oldSnapshot
        }

        return newSnapshot
      },
      ['ecosystemWiped', 'instanceActiveStateChanged', 'instanceStateChanged']
    )
  },
  { ttl: 60000 }
)

/**
 * Expose an AtomSelector to get the ecosystemWrapper instance for the dev's
 * currently selected ecosystem
 */
export const getCurrentEcosystemWrapper = ({ get }: AtomGetters) => {
  const destroyedWrapper = get(destroyedEcosystemWrapper)
  if (destroyedWrapper) return destroyedWrapper.store.getState()

  const currentEcosystemId = get(stateHub).ecosystemId

  return get(ecosystemWrapper, [currentEcosystemId])
}

export const getCurrentEcosystemWrapperInstance = ({
  get,
  getInstance,
}: AtomGetters) => {
  const destroyedWrapper = get(destroyedEcosystemWrapper)
  if (destroyedWrapper) return destroyedWrapper

  const currentEcosystemId = get(stateHub).ecosystemId

  return getInstance(ecosystemWrapper, [currentEcosystemId])
}

export const getLogLength = ({ select }: AtomGetters) =>
  select(getCurrentEcosystemWrapper).log.length

export const getNumEvents = ({ select }: AtomGetters) =>
  select(getCurrentEcosystemWrapper).numEvents

export const getNumUpdates = ({ select }: AtomGetters) =>
  select(getCurrentEcosystemWrapper).numUpdates
