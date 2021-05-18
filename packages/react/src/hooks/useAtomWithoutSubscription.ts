import { useLayoutEffect, useMemo, useState } from 'react'
import { AtomBase } from '../classes/atoms/AtomBase'
import { AtomInstanceBase } from '../classes/instances/AtomInstanceBase'
import { GraphEdgeSignal } from '../utils'
import { useEcosystem } from './useEcosystem'
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
  InstanceType extends AtomInstanceBase<
    State,
    Params,
    AtomBase<State, Params, any>
  >
>(
  atom: AtomBase<State, Params, InstanceType>,
  params: Params
) => {
  const ecosystem = useEcosystem()
  const stableParams = useStableReference(params)
  const [force, forceRender] = useState<any>()

  const [atomInstance, unregister] = useMemo(() => {
    const instance = ecosystem.load(atom, stableParams)

    const unregister = ecosystem._graph.registerExternalDependent(
      instance,
      signal => {
        if (signal === GraphEdgeSignal.Destroyed) {
          forceRender({})
        }
      },
      'a static React hook',
      true
    )

    return [instance, unregister] as const
  }, [atom, ecosystem, force, stableParams])

  useLayoutEffect(() => unregister, [unregister])

  return (atomInstance as unknown) as InstanceType
}
