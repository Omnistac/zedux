import { Selector } from '@zedux/core'
import {
  AtomInstanceStateType,
  AtomParamsType,
  AtomSelector,
  AtomStateType,
} from '../types'
import { useLayoutEffect, useRef, useState } from 'react'
import { Dep } from '../utils'
import { AtomBase, AtomInstanceBase } from '../classes'
import { useEcosystem } from './useEcosystem'
import { runAtomSelector } from '../utils/runAtomSelector'
import { useAtomInstanceDynamic } from '.'

const OPERATION = 'useAtomSelector'

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
  const instance = useAtomInstanceDynamic(atom as A, params, OPERATION, val => {
    const newResult = selectorRef.current(val)
    if (newResult === prevResultRef.current) return false

    prevResultRef.current = newResult
    return true
  }) as AtomInstanceBase<AtomStateType<A>, [...any], any>

  const selectorRef = useRef(selector)
  const prevResultRef = useRef(
    useState(() => selector(instance.store.getState()))[0]
  )

  selectorRef.current = selector

  return prevResultRef.current
}
