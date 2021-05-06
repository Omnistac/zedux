import { useLayoutEffect, useMemo, useState } from 'react'
import { AtomBaseProperties, AtomInstanceBase } from '../types'
import { useEcosystem } from './useEcosystem'
import { useStableReference } from './useStableReference'

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
export const useAtomWithSubscription = <
  State = any,
  Params extends any[] = [],
  InstanceType extends AtomInstanceBase<State, Params> = AtomInstanceBase<
    State,
    Params
  >
>(
  atom: AtomBaseProperties<State, Params, InstanceType>,
  params: Params
) => {
  const [, setReactState] = useState<State>()
  const ecosystem = useEcosystem()
  const stableParams = useStableReference(params)

  const [atomInstance, unregister] = useMemo(() => {
    const instance = ecosystem.load(atom, stableParams)

    const unregister = ecosystem.graph.registerExternalDynamicDependency(
      instance,
      val => setReactState(val)
    )

    return [instance, unregister] as const
  }, [ecosystem, atom, stableParams])

  useLayoutEffect(() => unregister, [unregister])

  // useLayoutEffect(() => {
  //   let timeoutId: ReturnType<typeof setTimeout> | undefined

  //   const subscriber = () => {
  //     if (timeoutId) return

  //     timeoutId = setTimeout(() => {
  //       setReactState(atomInstance.internals.stateStore.getState())
  //       timeoutId = undefined
  //     })
  //   }

  //   const subscription = atomInstance.internals.stateStore.subscribe(subscriber)

  //   return () => {
  //     if (timeoutId) clearTimeout(timeoutId)
  //     subscription.unsubscribe()
  //   }
  // }, [atomInstance])

  return atomInstance
}
