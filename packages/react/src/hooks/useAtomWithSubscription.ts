import { useLayoutEffect, useState } from 'react'
import { AtomBaseProperties, AtomInstance } from '../types'
import { useAtomWithoutSubscription } from './useAtomWithoutSubscription'

/**
 * useAtomWithSubscription
 *
 * Creates an atom instance for the passed atom based on the passed params. If
 * an instance has already been created for the passed params, reuses the
 * existing instance.
 *
 * Does **not** subscribe to the instance's store.
 *
 * This is a low-level hook that probably shouldn't be used directly. Use the
 * hooks built into atoms - e.g.
 *
 * ```ts
 * const [state, setState] = myAtom.useState()
 * ```
 *
 * @param atom The atom to instantiate (or reuse an instantiation of)
 * @param params The params to pass the atom and calculate its keyHash
 */
export const useAtomWithSubscription: <
  State = any,
  Params extends any[] = [],
  Methods extends Record<string, () => any> = Record<string, () => any>
>(
  atom: AtomBaseProperties<State, Params>,
  params?: Params
) => AtomInstance<State, Params, Methods> | undefined = <
  State = any,
  Params extends any[] = [],
  Methods extends Record<string, () => any> = Record<string, () => any>
>(
  atom: AtomBaseProperties<State, Params>,
  params?: Params
) => {
  const atomInstance = useAtomWithoutSubscription<State, Params, Methods>(
    atom,
    params
  )

  const [, setReactState] = useState<State>()

  useLayoutEffect(() => {
    const subscriber = (state: State) => setReactState(state)
    const subscription = atomInstance.stateStore.subscribe(subscriber)

    return () => subscription.unsubscribe()
  }, [atomInstance])

  return atomInstance
}
