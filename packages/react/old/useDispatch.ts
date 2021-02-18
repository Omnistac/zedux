import { useContext, useEffect, useRef, useState } from 'react'
import { Store } from '@zedux/core'
import { appContext } from './AppProvider'
import { getAtomInstance } from './global/getAtomInstance'
import { Atom, AtomInstance, AtomMetadata, ReadyState } from './types'

// yes, this is all copied from useAtom rn. TODO: fix this duplication
export const useDispatch: <T = any, A extends any[] = []>(
  atom: Atom<T, A>,
  params?: A
) => [T | undefined, Store<T>['dispatch'], ReadyState] = <
  T = any,
  A extends any[] = []
>(
  atom: Atom<T>,
  params?: A
) => {
  const atomInstanceRef = useRef<AtomInstance<T>>(null)
  const appId = useContext(appContext)
  const [reactState, setReactState] = useState<AtomMetadata<T>>()
  const isMountedRef = useRef(true)

  useEffect(() => {
    const subscriber = (metadata: AtomMetadata<T>) => setReactState(metadata)
    const atomInstance = getAtomInstance(appId, atom, params || [])
    const unsubscribe = atomInstance.addSubscriber(subscriber)

    ;(atomInstanceRef as any).current = atomInstance

    return () => {
      console.log('unregistering subscriber', { atom })
      isMountedRef.current = false

      unsubscribe()
    }
  }, [appId, atom, setReactState])

  return [
    reactState?.state,
    atomInstanceRef.current?.stateStore?.dispatch || (() => {}),
    atomInstanceRef.current?.metaStore.getState().readyState ||
      ReadyState.initializing,
  ] as [T | undefined, Store<T>['dispatch'], ReadyState]
}
