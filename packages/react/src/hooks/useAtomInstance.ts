import { useLayoutEffect, useMemo, useState } from 'react'
import {
  AtomBase,
  AtomInstance,
  AtomInstanceBase,
  StandardAtomBase,
} from '../classes'
import {
  AtomInstanceType,
  AtomParamsType,
  GraphEdgeSignal,
  PromiseStatus,
} from '../types'
import { is } from '../utils'
import { useEcosystem } from './useEcosystem'

/**
 * useAtomInstance
 *
 * Creates an atom instance for the passed atom based on the passed params. If
 * an instance has already been created for the passed params, reuses the
 * existing instance.
 *
 * Registers a static graph dependency on the atom instance. This means
 * components that use this hook will not rerender when this atom instance's
 * state changes.
 *
 * If the params are large, serializing them every render can cause some
 * overhead. This can be alleviated by memoizing the params array yourself
 * before passing it to useAtomInstance
 *
 * @param atom The atom to instantiate or reuse an instantiation of
 * @param params The params for generating the instance's key.
 */
export const useAtomInstance: {
  <A extends AtomBase<any, [], any>>(atom: A): AtomInstanceType<A>

  <A extends AtomBase<any, [...any], any>>(
    atom: A,
    params: AtomParamsType<A>
  ): AtomInstanceType<A>

  <AI extends AtomInstance<any, [...any], any>>(instance: AI, params?: []): AI
} = <A extends AtomBase<any, [...any], any>>(
  atom: A | AtomInstanceBase<any, [...any], any>,
  params?: AtomParamsType<A>
) => {
  const ecosystem = useEcosystem()
  const [, forceRender] = useState<any>()

  // it should be fine for this to run every render. It's possible to change
  // approaches if it is too heavy sometimes. But don't memoize this call:
  const instance = ecosystem.getInstance(atom as A, params as AtomParamsType<A>)

  // Suspense!
  if (instance.promise) {
    if (instance._promiseStatus === PromiseStatus.Pending) {
      throw instance.promise
    } else if (instance._promiseStatus === PromiseStatus.Rejected) {
      throw instance._promiseError
    }
  }

  const ghostSubscription = useMemo(
    () =>
      ecosystem._graph.registerGhostDependent(
        instance,
        signal => {
          if (signal === GraphEdgeSignal.Destroyed) {
            forceRender({})
          }
        },
        'useAtomInstance',
        true
      ),
    [instance]
  )

  useLayoutEffect(() => {
    return ghostSubscription.materialize()
  }, [ghostSubscription])

  // sync React contexts across realms (e.g. windows) - if an atom instance was
  // created in one realm and used in another, the atom used to create the
  // instance is different from the atom used to get the existing instance in
  // the current realm. This only causes a problem with React context since we
  // store the context object on the atom object itself (for now)
  if (instance.atom !== atom && !is(atom, AtomInstanceBase)) {
    ;((atom as unknown) as StandardAtomBase<
      any,
      any,
      any
    >)._reactContext = instance.atom.getReactContext()
  }

  return instance
}
