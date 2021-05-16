import { useLayoutEffect, useMemo, useState } from 'react'
import { AtomBase } from '../classes/atoms/AtomBase'
import { AtomInstanceBase } from '../classes/instances/AtomInstanceBase'
import { GraphEdgeSignal } from '../utils'
import { useEcosystem } from './useEcosystem'
import { useStableReference } from './useStableReference'

/**
 * useAtomWithSubscription
 *
 * Creates an atom instance for the passed atom based on the passed params. If
 * an instance has already been created for the passed params, reuses the
 * existing instance.
 *
 * Creates a dynamic graph edge that receives updates when the atom instance's
 * store's state changes
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
  InstanceType extends AtomInstanceBase<
    State,
    Params,
    AtomBase<State, Params, any>
  > = AtomInstanceBase<State, Params, AtomBase<State, Params, any>>
>(
  atom: AtomBase<State, Params, InstanceType>,
  params: Params
) => {
  const [, setReactState] = useState<State>()
  const [force, forceRender] = useState<any>()
  const ecosystem = useEcosystem()
  const stableParams = useStableReference(params)

  const [atomInstance, unregister] = useMemo(() => {
    const instance = ecosystem.load(atom, stableParams)

    const unregister = ecosystem.graph.registerExternalDependent(
      instance,
      (signal, val) => {
        if (signal === GraphEdgeSignal.Destroyed) {
          forceRender({})
          return
        }

        setReactState(val)
      },
      'a dynamic React hook',
      false
    )

    return [instance, unregister] as const
  }, [atom, ecosystem, force, stableParams])

  useLayoutEffect(() => unregister, [unregister])

  return atomInstance
}
