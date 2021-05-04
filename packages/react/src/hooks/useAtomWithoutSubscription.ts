import { useContext, useLayoutEffect, useMemo } from 'react'
import { ecosystemContext } from '../classes/Ecosystem'
import { getEcosystem } from '../store/public-api'
import { AtomBaseProperties, AtomInstanceBase } from '../types'
import { useStableReference } from './useStableReference'

/**
 * useAtomWithoutSubscription
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
export const useAtomWithoutSubscription = <
  State,
  Params extends any[],
  InstanceType extends AtomInstanceBase<State, Params>
>(
  atom: AtomBaseProperties<State, Params, InstanceType>,
  params: Params
) => {
  const ecosystemId = useContext(ecosystemContext)
  const ecosystem = getEcosystem(ecosystemId)
  const stableParams = useStableReference(params)

  const [atomInstance, unregister] = useMemo(() => {
    const instance = ecosystem.load(atom, stableParams)

    const unregister = ecosystem.graph.registerExternalStaticDependency(
      instance
    )

    return [instance, unregister] as const
  }, [ecosystem, atom, stableParams])

  useLayoutEffect(() => unregister, [unregister])

  return (atomInstance as unknown) as InstanceType
}
