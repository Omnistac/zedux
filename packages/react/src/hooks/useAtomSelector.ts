import { Selector } from '@zedux/core'
import {
  AtomInstanceStateType,
  AtomParamsType,
  AtomSelector,
  AtomSelectorOrConfig,
  AtomStateType,
} from '../types'
import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { Dep, generateAtomSelectorId } from '../utils'
import { AtomBase, AtomInstanceBase } from '../classes'
import { useEcosystem } from './useEcosystem'
import { runAtomSelector } from '../utils/runAtomSelector'
import { useAtomInstanceDynamic } from '.'

const OPERATION = 'useAtomSelector'

const useStandaloneSelector = <T, Args extends any[]>(
  selector: AtomSelectorOrConfig<T, Args>,
  args: Args
) => {
  const ecosystem = useEcosystem()
  const [, forceRender] = useState<any>()
  const prevArgs = useRef<Args>() // don't populate initially
  const prevDeps = useRef<Record<string, Dep>>({})
  const prevResult = useRef<T>()
  const prevSelector = useRef<AtomSelector<T, Args>>() // don't populate initially
  const idRef = useRef<string>()

  // doesn't matter if fibers/suspense mess this id up - it's just for some
  // consistency when inspecting dependencies created by this selector in
  // development
  if (!idRef.current) idRef.current = generateAtomSelectorId()

  const result = runAtomSelector<T, Args>(
    selector,
    args,
    ecosystem,
    prevArgs,
    prevDeps,
    prevResult,
    prevSelector,
    () => forceRender({}),
    OPERATION,
    idRef.current,
    !!prevArgs.current,
    useEffect
  )

  prevResult.current = result

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
  <T, Args extends any[]>(
    selector: AtomSelectorOrConfig<T, Args>,
    ...args: Args
  ): T

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
} = <A extends AtomBase<any, [...any], any>, D = any>(
  atom:
    | A
    | AtomInstanceBase<any, [...any], any>
    | AtomSelectorOrConfig<any, any>,
  paramsArg?: AtomParamsType<A> | Selector<AtomStateType<A>, D>,
  selectorArg?: Selector<AtomStateType<A>, D>,
  ...rest: any[]
): D => {
  if (typeof atom === 'function' || 'selector' in atom) {
    // yes, this breaks the rules of hooks
    return useStandaloneSelector(atom, [paramsArg, selectorArg, ...rest])
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
