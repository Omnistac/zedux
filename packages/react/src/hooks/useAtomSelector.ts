import { Selector } from '@zedux/core'
import { AtomBase, AtomInstanceBase } from '../classes'
import { AtomInstanceStateType, AtomParamsType, AtomStateType } from '../types'
import { useAtomInstance } from './useAtomInstance'
import { useEffect, useRef, useState } from 'react'
import { GraphEdgeSignal } from '../utils'

const useAtomInstanceSelector = <
  AI extends AtomInstanceBase<any, any, any>,
  D extends any = any
>(
  instance: AI,
  selector: (state: AtomInstanceStateType<AI>) => D
) => {
  const [state, setState] = useState(() =>
    selector(instance._stateStore.getState())
  )
  const [, forceRender] = useState<any>()
  const selectorRef = useRef(selector)
  selectorRef.current = selector

  useEffect(() => {
    const unregister = instance.ecosystem._graph.registerExternalDependent(
      instance,
      (signal, val: AtomInstanceStateType<AI>) => {
        if (signal === GraphEdgeSignal.Destroyed) {
          forceRender({})
          return
        }

        setState(selectorRef.current(val))
      },
      'useAtomInstanceSelector',
      false
    )

    return unregister
  }, [])

  return state
}

export const useAtomSelector: {
  <A extends AtomBase<any, [], any>, D = any>(
    atom: A,
    selector: Selector<AtomStateType<A>, D>
  ): D

  <A extends AtomBase<any, any, any>, D = any>(
    atom: A,
    params: AtomParamsType<A> | Selector<AtomStateType<A>, D>,
    selector: Selector<AtomStateType<A>, D>
  ): D

  <AI extends AtomInstanceBase<any, any, any>, D = any>(
    instance: AI | AtomBase<any, any, any>,
    selector: Selector<AtomInstanceStateType<AI>, D>
  ): D

  <AI extends AtomInstanceBase<any, any, any>, D = any>(
    instance: AI | AtomBase<any, any, any>,
    params: [],
    selector: Selector<AtomInstanceStateType<AI>, D>
  ): D
} = <A extends AtomBase<any, any, any>, D = any>(
  atom: A | AtomInstanceBase<any, any, any>,
  paramsArg?: AtomParamsType<A> | Selector<AtomStateType<A>, D>,
  selectorArg?: Selector<AtomStateType<A>, D>
): D => {
  const params = selectorArg
    ? (paramsArg as AtomParamsType<A>)
    : (([] as unknown) as AtomParamsType<A>)

  const selector = selectorArg || (paramsArg as Selector<AtomStateType<A>, D>)

  const instance = useAtomInstance(atom, params, false) as AtomInstanceBase<
    AtomStateType<A>,
    any,
    any
  >

  return useAtomInstanceSelector(instance, selector)
}
