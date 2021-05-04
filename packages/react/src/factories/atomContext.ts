import { createStore, Store } from '@zedux/core'
import { useMemo } from 'react'
import { useAtomContext } from '../hooks/useAtomContext'
import { injectAtomContext } from '../injectors'
import { AtomContext } from '../types'
import { instantiateAtomContext } from '../utils/instantiateAtomContext'

/**
 * atomContext()
 *
 * The factory for creating AtomContext objects.
 *
 * @see AtomContext
 *
 * @param [storeFactory] - Optional - A factory for creating the store for this
 * context. Receives the initialState (if any) passed to
 * `thisAtomContext.useInstance()`. Must return a store. If not supplied, this
 * factory defaults to:
 *
 * ```ts
 * (initialState: T) => createStore(null, initialState)
 * ```
 */
export const atomContext = <T = any>(
  storeFactory: (initialState?: T) => Store<T> = (initialState?: T) =>
    createStore<T>(null, initialState)
) => {
  const injectConsumer = () => injectAtomContext(newAtomContext)

  const injectDispatch = () => injectAtomContext(newAtomContext).store.dispatch

  const injectSelector = <D = any>(selector: (state: T) => D) =>
    injectAtomContext(newAtomContext).injectSelector(selector)

  const injectSetState = () => injectAtomContext(newAtomContext).store.setState

  const injectState = () => injectAtomContext(newAtomContext).injectState()

  const injectStore = () => injectAtomContext(newAtomContext).store

  const injectValue = () => injectAtomContext(newAtomContext).injectValue()

  const useConsumer = () => useAtomContext(newAtomContext)

  const useDispatch = () => useAtomContext(newAtomContext).store.dispatch

  const useInstance = (initialState: T) =>
    useMemo(() => instantiateAtomContext(newAtomContext, initialState), [])

  const useSelector = <D = any>(selector: (state: T) => D) =>
    useAtomContext(newAtomContext).useSelector(selector)

  const useSetState = () => useAtomContext(newAtomContext).store.setState

  const useState = () => useAtomContext(newAtomContext).useState()

  const useStore = () => useAtomContext(newAtomContext).store

  const useValue = () => useAtomContext(newAtomContext).useValue()

  const newAtomContext: AtomContext<T> = {
    injectDispatch,
    injectConsumer,
    injectSelector,
    injectSetState,
    injectState,
    injectStore,
    injectValue,
    storeFactory,
    useConsumer,
    useDispatch,
    useInstance,
    useSelector,
    useSetState,
    useState,
    useStore,
    useValue,
  }

  return newAtomContext
}
