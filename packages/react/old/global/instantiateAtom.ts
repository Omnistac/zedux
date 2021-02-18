import { Observable } from 'rxjs'
import {
  applyMachineHooks,
  createStore,
  isZeduxStore,
  Store,
} from '@zedux/core'
import {
  ActiveState,
  Atom,
  AtomInstance,
  AtomMetadata,
  AtomValue,
  AtomValueResolved,
  ReadyState,
  Subscriber,
} from '../types'
import { generateInstanceId } from '../utils'
import { getAtomInstance } from './getAtomInstance'
import {
  atomInitFailure,
  atomInitSkip,
  atomInitSuccess,
  createMetaStore,
  destroy,
  destroyTimeout,
  scheduleDestroy,
  subscriberAdded,
  subscriberRemoved,
  wait,
} from './metaStore'
import {
  addAtomInstance,
  atomInstanceReady,
  globalStore,
  removeAtomInstance,
} from './store'

enum FactoryTypes {
  observable,
  promise,
  store,
  value,
}

const getFactoryType = (val: Observable<any> | Promise<any> | Store | any) => {
  if (!val) return FactoryTypes.value

  if (isZeduxStore(val)) return FactoryTypes.store
  if (typeof val.subscribe === 'function') return FactoryTypes.observable
  if (typeof val.then === 'function') return FactoryTypes.promise

  return FactoryTypes.value
}

export const instantiateAtom = <T, A extends any[]>(
  appId: string,
  atom: Atom<T, A>,
  fullKey: string,
  params: A = ([] as unknown) as A
): AtomInstance<T> => {
  const metaStore = createMetaStore<T>()

  const addSubscriber = (subscriber: Subscriber<AtomMetadata>) => {
    const metaState = metaStore.getState()

    if (metaState.activeState === ActiveState.destroyed) {
      return () => {}
    }

    const { unsubscribe } = metaStore.subscribe(subscriber)
    metaStore.dispatch(subscriberAdded())

    return () => {
      unsubscribe()
      const { state } = metaStore.dispatch(subscriberRemoved())

      // TODO: this could be moved to a store side effect based on subscriberCount
      if (!state.subscriberCount) {
        scheduleDestruction()
      }
    }
  }

  const scheduleDestruction = () => {
    const { ttl } = atom

    // By default, atoms live forever.
    if (ttl == null) return

    if (ttl === 0) {
      return metaStore.dispatch(destroy())
    }

    // schedule destruction (if ttl is > 0)
    if (typeof ttl === 'number') {
      const timeoutId = setTimeout(
        () => metaStore.dispatch(destroyTimeout()),
        ttl
      )
      metaStore.dispatch(scheduleDestroy(timeoutId))
    }
  }

  // Boot up the atom!
  let factoryResult: AtomValue<T>
  let dependencies: [string, string][] = []

  if (typeof atom.factory === 'function') {
    // TODO: error handling
    factoryResult = atom.factory(...params)
  } else if (typeof atom.enhancedFactory === 'function') {
    // Dependency Injection

    const injectStore = <T, A extends any[]>(atom: Atom<T, A>, params: A) => {
      const atomInstance = getAtomInstance(appId, atom, params)

      // Currently, when the atom instance is ready, there's always a stateStore
      if (atomInstance.metaStore.getState().readyState !== ReadyState.ready) {
        throw new Promise(resolve => {
          applyMachineHooks(
            atomInstance.metaStore,
            state => state.readyState
          ).onEnter(ReadyState.ready, resolve)
        })
      }

      dependencies.push([atomInstance.key, atomInstance.internalId])

      return atomInstance.stateStore as Store<T>
    }

    const injectState = <T, A extends any[]>(atom: Atom<T, A>, params: A) => {
      const store = injectStore(atom, params)
      return store.getState()
    }

    const factory = atom.enhancedFactory({ injectState, injectStore } as any) // ... overloads ruin types ...

    try {
      factoryResult = factory(...params)
    } catch (maybePromise) {
      // propagate real errors
      if (typeof maybePromise.then !== 'function') throw maybePromise

      const awaitDepPromise = async (
        depPromise: Promise<Store>
      ): Promise<AtomValueResolved<T>> => {
        // When the dependency is ready, retry the factory
        // TODO: error handling on this promise
        await depPromise

        try {
          dependencies = [] // reset dependencies for the injectors
          return factory(...params)
        } catch (maybePromise) {
          // propagate real errors
          if (typeof maybePromise.then !== 'function') throw maybePromise

          return awaitDepPromise(maybePromise)
        }
      }

      factoryResult = awaitDepPromise(maybePromise)
    }
  } else {
    throw new TypeError(
      'Zedux - atom must specify either `factory` or `enhancedFactory`'
    )
  }

  const factoryType = getFactoryType(factoryResult)

  const newAtomInstance: AtomInstance<T> = {
    addSubscriber,
    fullKey,
    implementation: atom.internalId,
    internalId: generateInstanceId(),
    key: atom.key,
    metaStore,
    ttl: atom.ttl,
  }

  globalStore.dispatch(
    addAtomInstance({ appId, atomInstance: newAtomInstance })
  )

  applyMachineHooks(metaStore, state => state.activeState)
    .onEnter(ActiveState.destroyed, () => {
      globalStore.dispatch(
        removeAtomInstance({
          appId,
          fullKey,
          internalId: atom.internalId,
          key: atom.key,
        })
      )
      // TODO: any other cleanup items? (subscriptions to remove, timeouts to cancel, etc)
    })
    .onLeave(ActiveState.destroying, ({ newState }) => {
      // unschedule destruction of this atom
      clearTimeout(newState.destructionTimeout)
    })

  const onReady = (result: T | Store<T> | Observable<T>) => {
    const resultType = getFactoryType(result)

    const stateStore =
      resultType === FactoryTypes.store
        ? (result as Store<T>)
        : createStore<T>()

    // define how we populate our store (doesn't apply to user-supplied stores)
    if (resultType === FactoryTypes.observable) {
      // TODO: track this subscription and unsubscribe on atom destroy
      ;(result as Observable<T>).subscribe(
        val => stateStore.setState(val as any) // no idea why this type is broke. Also: TODO: could make some nicer way to pipe observables to store state
      )
    } else if (resultType === FactoryTypes.value) {
      stateStore.setState(result as any) // same type issue..
    }

    metaStore.use({ state: stateStore })
    globalStore.dispatch(
      atomInstanceReady({
        dependencies,
        internalId: newAtomInstance.internalId,
        key: atom.key,
        stateStore,
      })
    )

    // um. These potentially async mutations are probably fine. TODO: Kill:
    newAtomInstance.dependencies = dependencies
    newAtomInstance.stateStore = stateStore

    return stateStore
  }

  if (factoryType === FactoryTypes.promise) {
    metaStore.dispatch(wait())
    ;(factoryResult as Promise<AtomValueResolved<T>>)
      .then(result => {
        const stateStore = onReady(result)
        metaStore.dispatch(atomInitSuccess({ dependencies, stateStore }))
      })
      .catch(error => {
        console.log('caught factoryResult error', { atom, error })
        metaStore.dispatch(atomInitFailure(error))
      })
  } else {
    onReady(factoryResult as AtomValueResolved<T>)
    metaStore.dispatch(atomInitSkip(factoryResult))
  }

  if (atom.molecules) {
    atom.molecules.forEach(molecule => molecule.addAtom(newAtomInstance))
  }

  // const map = new WeakMap();
  // map.set(newAtomInstance, true);
  // map.set({ control: true }, true);
  // console.log({ key: atom.key, map });

  return newAtomInstance
}
