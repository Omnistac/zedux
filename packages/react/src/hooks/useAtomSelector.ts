import { Selector } from '@zedux/core'
import {
  AnyAtomInstanceBase,
  AtomInstanceStateType,
  AtomParamsType,
  AtomSelector,
  AtomStateType,
} from '../types'
import { useAtomInstance } from './useAtomInstance'
import { useLayoutEffect, useMemo, useRef, useState } from 'react'
import { Dep, GraphEdgeSignal } from '../utils'
import { AtomBase, AtomInstanceBase } from '../classes'
import { useEcosystem } from './useEcosystem'
import { runAtomSelector } from '../utils/runAtomSelector'

const OPERATION = 'useAtomSelector'

const useAtomInstanceSelector = <
  AI extends AnyAtomInstanceBase,
  D extends any = any
>(
  instance: AI,
  selector: (state: AtomInstanceStateType<AI>) => D
) => {
  const [state, setState] = useState(() => selector(instance.store.getState()))
  const [force, forceRender] = useState<any>()
  const selectorRef = useRef(selector)
  selectorRef.current = selector
  const cleanupRef = useRef<() => void>()

  useMemo(() => {
    if (cleanupRef.current) {
      cleanupRef.current()
      cleanupRef.current = undefined
    }

    let lastResult: D

    cleanupRef.current = instance.ecosystem._graph.registerExternalDependent(
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
      OPERATION,
      false
    )
  }, [force, instance])

  useLayoutEffect(() => () => cleanupRef.current?.(), [])

  return state
}

const useStandaloneSelector = <T>(selector: AtomSelector<T>) => {
  const ecosystem = useEcosystem()
  const [, forceRender] = useState<any>()
  const prevDeps = useRef<Record<string, Dep>>({})
  const prevResult = useRef<T>()
  const selectorRef = useRef<typeof selector>() // don't populate initially

  const result =
    selector === selectorRef.current
      ? prevResult.current
      : runAtomSelector(
          selector,
          ecosystem,
          prevDeps,
          prevResult,
          () => forceRender({}),
          OPERATION
        )

  prevResult.current = result
  selectorRef.current = selector

  // Final cleanup on unmount
  useLayoutEffect(
    () => () => {
      Object.values(prevDeps.current).forEach(dep => {
        dep.cleanup?.()
      })
    },
    []
  )

  return result
}

export const useAtomSelector: {
  <A extends AtomBase<any, [], any>, D = any>(
    atom: A,
    selector: Selector<AtomStateType<A>, D>
  ): D

  <A extends AtomBase<any, [...any], any>, D = any>(
    atom: A,
    params: AtomParamsType<A> | Selector<AtomStateType<A>, D>,
    selector: Selector<AtomStateType<A>, D>
  ): D

  <AI extends AtomInstanceBase<any, [...any], any>, D = any>(
    instance: AI,
    selector: Selector<AtomInstanceStateType<AI>, D>
  ): D

  <T>(selector: AtomSelector<T>): T
} = <A extends AtomBase<any, [...any], any>, D = any>(
  atom: A | AtomInstanceBase<any, [...any], any> | AtomSelector<any>,
  paramsArg?: AtomParamsType<A> | Selector<AtomStateType<A>, D>,
  selectorArg?: Selector<AtomStateType<A>, D>
): D => {
  if (typeof atom === 'function') {
    // yes, this breaks the rules of hooks
    return useStandaloneSelector(atom)
  }

  const params = selectorArg
    ? (paramsArg as AtomParamsType<A>)
    : (([] as unknown) as AtomParamsType<A>)

  const selector = selectorArg || (paramsArg as Selector<AtomStateType<A>, D>)

  const instance = useAtomInstance(
    atom as A,
    params,
    false
  ) as AtomInstanceBase<AtomStateType<A>, [...any], any>

  return useAtomInstanceSelector(instance, selector)
}
