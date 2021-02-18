import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react'
import { Settable } from '@zedux/core'
import { addAtomImplementation, globalStore } from './global/store'
import {
  AppAtom,
  Atom,
  AtomInstance,
  AtomMetadata,
  AtomConfig,
  GlobalAtom,
  LocalAtom,
  ReadyState,
  Scope,
} from './types'
import { useAtom } from './useAtom'
import { generateImplementationId } from './utils'

// creates App atoms by default. Other scopes must be specified with the `scope` property
export const createAtom: {
  <T = any, A extends any[] = []>(
    key: string,
    factory: (...params: A) => T
  ): AppAtom<T, A>
  <T = any, A extends any[] = []>(
    options: AtomConfig<T, A> & { scope: Scope.global }
  ): GlobalAtom<T, A>
  <T = any, A extends any[] = []>(
    options: AtomConfig<T, A> & { scope?: Scope.app }
  ): AppAtom<T, A>
  <T = any, A extends any[] = []>(
    options: AtomConfig<T, A> & { scope: Scope.local }
  ): LocalAtom<T, A>
} = <T, A extends any[]>(
  paramA: string | (AtomConfig<T> & { scope?: Scope }),
  maybeFactory?: AtomConfig<T>['factory']
) => {
  let options

  if (typeof paramA === 'object') {
    options = paramA
  } else {
    options = { factory: maybeFactory, key: paramA } as AtomConfig & {
      scope?: Scope
    }
  }

  const {
    enhancedFactory,
    factory,
    isTestSafe,
    key,
    molecules,
    scope = Scope.app,
    ttl,
  } = options
  const atom = ({
    enhancedFactory,
    factory,
    internalId: generateImplementationId(),
    isTestSafe,
    key,
    molecules,
    scope,
    ttl,
  } as unknown) as Atom

  atom.useApi = (...params: A) => {
    const atomInstance = useAtom(atom, params)
    const metaState = atomInstance?.metaStore.getState()

    return {
      activeState: metaState?.activeState,
      dispatch: atomInstance?.stateStore?.dispatch,
      readyState: metaState?.readyState || ReadyState.initializing,
      setState: atomInstance?.stateStore?.setState,
      state: atomInstance?.stateStore?.getState(),
    }
  }

  atom.useState = (...params: A) => {
    const atomInstance = useAtom(atom, params)
    const atomInstanceRef = useRef(atomInstance)
    atomInstanceRef.current = atomInstance // I know of no way cm could break this. But updating in an effect would be fine too

    const setState = useCallback((state: Settable<T>) => {
      if (atomInstanceRef.current?.stateStore) {
        return atomInstanceRef.current.stateStore.setState(state)
      }

      return { state } // just a useless default
    }, [])

    return [atomInstance?.stateStore?.getState(), setState]
  }

  atom.override = newFactory =>
    createAtom({
      factory: newFactory,
      key,
      molecules,
      scope: scope as any,
      ttl,
    })

  atom.enhancedOverride = newEnhancedFactory =>
    createAtom({
      enhancedFactory: newEnhancedFactory,
      key,
      molecules,
      scope: scope as any,
      ttl,
    })

  if (scope === Scope.local) {
    // local atoms get some extra stuff
    const context = createContext<[string, string]>(['', ''])

    ;(atom as LocalAtom).context = context
    ;(atom as LocalAtom).useLocalAtom = (...params: A) => {
      const atomInstance = useAtom(atom, params)
      const atomInstanceRef = useRef(atomInstance)
      atomInstanceRef.current = atomInstance // same comment as above..

      const Provider: React.FC = useCallback(
        ({ children }) => (
          <context.Provider
            value={
              atomInstanceRef.current
                ? [
                    atomInstanceRef.current.key,
                    atomInstanceRef.current.internalId,
                  ]
                : ['', '']
            }
          >
            {children}
          </context.Provider>
        ),
        []
      )

      return {
        ...atomInstance,
        Provider,
      }
    }

    const useLocalAtom = (key: string, localId: string) => {
      const [atomInstance, setAtomInstance] = useState<AtomInstance<T>>()
      const [, setReactState] = useState<AtomMetadata<T>>()

      useEffect(() => {
        if (!key || !localId) return

        const subscriber = (metadata: AtomMetadata<T>) =>
          setReactState(metadata)
        const targetAtomInstance = globalStore.getState().atoms[key].instances[
          localId
        ]
        const unsubscribe = targetAtomInstance.addSubscriber(subscriber)

        setAtomInstance(targetAtomInstance)

        return () => {
          console.log('unregistering subscriber', { atom })

          unsubscribe()
        }
      }, [atom, key, localId, setReactState])

      return atomInstance
    }

    atom.useApi = () => {
      const [key, localId] = useContext(context)
      const atomInstance = useLocalAtom(key, localId)

      const metaState = atomInstance?.metaStore.getState()

      return {
        activeState: metaState?.activeState,
        dispatch: atomInstance?.stateStore?.dispatch,
        readyState: metaState?.readyState || ReadyState.initializing,
        setState: atomInstance?.stateStore?.setState,
        state: atomInstance?.stateStore?.getState(),
      }
    }

    atom.useState = () => {
      const [key, localId] = useContext(context)
      const atomInstance = useLocalAtom(key, localId)
      const atomInstanceRef = useRef(atomInstance)
      atomInstanceRef.current = atomInstance

      const setState = useCallback((state: Settable<T>) => {
        if (atomInstanceRef.current?.stateStore) {
          return atomInstanceRef.current.stateStore.setState(state)
        }

        return { state } // just a useless default
      }, [])

      return [atomInstance?.stateStore?.getState(), setState]
    }
  }

  globalStore.dispatch(addAtomImplementation(atom))

  return atom as any // any - the overloads of this function give the caller all the types it needs
}
