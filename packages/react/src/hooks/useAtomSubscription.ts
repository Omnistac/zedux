import { useContext, useLayoutEffect, useMemo, useState } from 'react'
import { appContext } from '../components/AppProvider'
import { AtomBaseProperties, AtomInstance, Scope } from '../types'
import { getKeyHash } from '../utils'
import { getAtomInstance } from '../utils/getAtomInstance'

/*
  useAtomSubscription is a low-level hook that probably shouldn't be used directly.
  Use the hooks built into atoms - e.g. `myAtom.useState()`
*/
export const useAtomSubscription: <
  State = any,
  Params extends any[] = [],
  Methods extends Record<string, () => any> = Record<string, () => any>
>(
  atom: AtomBaseProperties<State, Params>,
  params?: Params
) => AtomInstance<State, Methods> | undefined = <
  State = any,
  Params extends any[] = [],
  Methods extends Record<string, () => any> = Record<string, () => any>
>(
  atom: AtomBaseProperties<State, Params>,
  params?: Params
) => {
  const appId = useContext(appContext)

  const keyHash = useMemo(
    () => getKeyHash(atom, params),
    atom.scope === Scope.Local ? [atom] : [atom, params]
  )

  // NOTE: We don't want to re-run when params change - the array could change every time
  // Calculate the full key from the params and use that to determine when items in the params list change.
  const atomInstance = useMemo(
    () => getAtomInstance<State, Params, Methods>(appId, atom, keyHash, params),
    [appId, atom, keyHash] // TODO: Changing the atom is _probably_ not supported. Maybe. Mmmm maybe.
  )

  const [, setReactState] = useState<State>()

  useLayoutEffect(() => {
    const subscriber = (state: State) => setReactState(state)
    const subscription = atomInstance.stateStore.subscribe(subscriber)

    return () => subscription.unsubscribe()
  }, [atomInstance])

  return atomInstance
}
