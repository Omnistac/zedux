import { Selector } from '@zedux/core'
import { AtomInstanceStateType, AtomParamsType, AtomStateType } from '../types'
import { useAtomInstance } from './useAtomInstance'
import { useEffect, useRef, useState } from 'react'
import { GraphEdgeSignal } from '../utils'
import { Atom, AtomInstance } from '../classes'

const useAtomInstanceSelector = <
  AI extends AtomInstance<any, any, any, any>,
  D extends any = any
>(
  instance: AI,
  selector: (state: AtomInstanceStateType<AI>) => D
) => {
  const [state, setState] = useState(() => selector(instance.store.getState()))
  const [, forceRender] = useState<any>()
  const selectorRef = useRef(selector)
  selectorRef.current = selector

  useEffect(() => {
    let lastResult: D

    const unregister = instance.ecosystem._graph.registerExternalDependent(
      instance,
      (signal, val: AtomInstanceStateType<AI>) => {
        if (signal === GraphEdgeSignal.Destroyed) {
          forceRender({})
          return
        }

        const newResult = selectorRef.current(val)
        if (newResult === lastResult) return

        setState((lastResult = newResult))
      },
      'useAtomInstanceSelector',
      false
    )

    return unregister
  }, [])

  return state
}

export const useAtomSelector: {
  <A extends Atom<any, [], any>, D = any>(
    atom: A,
    selector: Selector<AtomStateType<A>, D>
  ): D

  <A extends Atom<any, [...any], any>, D = any>(
    atom: A,
    params: AtomParamsType<A> | Selector<AtomStateType<A>, D>,
    selector: Selector<AtomStateType<A>, D>
  ): D

  <AI extends AtomInstance<any, [...any], any, any>, D = any>(
    instance: AI,
    selector: Selector<AtomInstanceStateType<AI>, D>
  ): D
} = <A extends Atom<any, [...any], any>, D = any>(
  atom: A,
  paramsArg?: AtomParamsType<A> | Selector<AtomStateType<A>, D>,
  selectorArg?: Selector<AtomStateType<A>, D>
): D => {
  const params = selectorArg
    ? (paramsArg as AtomParamsType<A>)
    : (([] as unknown) as AtomParamsType<A>)

  const selector = selectorArg || (paramsArg as Selector<AtomStateType<A>, D>)

  const instance = useAtomInstance(atom, params, false) as AtomInstance<
    AtomStateType<A>,
    [...any],
    any,
    any
  >

  return useAtomInstanceSelector(instance, selector)
}
