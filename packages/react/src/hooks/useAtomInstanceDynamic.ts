import { useLayoutEffect, useMemo, useState } from 'react'
import { AtomBase } from '../classes/atoms/AtomBase'
import { AtomParamsType, AtomStateType } from '../types'
import { GraphEdgeSignal } from '../utils'
import { useEcosystem } from './useEcosystem'
import { useStableReference } from './useStableReference'

/**
 * useAtomInstanceDynamic
 *
 * Creates an atom instance for the passed atom based on the passed params. If
 * an instance has already been created for the passed params, reuses the
 * existing instance.
 *
 * Creates a dynamic graph edge that receives updates when the atom instance's
 * state changes
 *
 * This is a low-level hook that probably shouldn't be used directly. Use
 * higher-level hooks like useAtomValue, useAtomState, and useAtomSelector
 *
 * ```ts
 * const [state, setState] = useAtomState(myAtom)
 * ```
 *
 * @param atom The atom to instantiate (or reuse an instantiation of)
 * @param params The params to pass the atom and calculate its keyHash
 */
export const useAtomInstanceDynamic = <A extends AtomBase<any, any, any>>(
  atom: A,
  params: AtomParamsType<A>
) => {
  const [, setReactState] = useState<AtomStateType<A>>()
  const [force, forceRender] = useState<any>()
  const ecosystem = useEcosystem()
  const stableParams = useStableReference(params)

  const [atomInstance, unregister] = useMemo(() => {
    const instance = ecosystem.load(atom, stableParams)

    const unregister = ecosystem._graph.registerExternalDependent(
      instance,
      (signal, val: AtomStateType<A>) => {
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
