import { useLayoutEffect, useMemo, useState } from 'react'
import { AtomBase } from '../classes/atoms/AtomBase'
import { AtomInstanceType, AtomParamsType } from '../types'
import { GraphEdgeSignal } from '../utils'
import { useEcosystem } from './useEcosystem'
import { useStableReference } from './useStableReference'

/**
 * useAtomInstance
 *
 * Creates an atom instance for the passed atom based on the passed params. If
 * an instance has already been created for the passed params, reuses the
 * existing instance.
 *
 * Creates a static dependency on the atom instance. This means components that
 * use this hook will *not* rerender when this atom instance's state changes.
 *
 * @param atom The atom to instantiate (or reuse an instantiation of)
 * @param params The params to pass the atom and calculate its keyHash
 */
export const useAtomInstance: {
  <A extends AtomBase<any, [], any>>(atom: A): AtomInstanceType<A>
  <A extends AtomBase<any, any, any>>(
    atom: A,
    params: AtomParamsType<A>
  ): AtomInstanceType<A>
} = <A extends AtomBase<any, any, any>>(
  atom: A,
  params?: AtomParamsType<A>
) => {
  const ecosystem = useEcosystem()
  const stableParams = useStableReference(params)
  const [force, forceRender] = useState<any>()

  const [atomInstance, unregister] = useMemo(() => {
    const instance = ecosystem.load(atom, stableParams as AtomParamsType<A>)

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

  return atomInstance
}
