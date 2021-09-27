import { Selector } from '@zedux/core'
import {
  AtomInstanceStateType,
  AtomParamsType,
  AtomSelector,
  AtomStateType,
} from '../types'
import { useAtomInstance } from './useAtomInstance'
import { useLayoutEffect, useMemo, useRef, useState } from 'react'
import { GraphEdgeSignal } from '../utils'
import { AtomBase, AtomInstanceBase } from '../classes'
import { useEcosystem } from './useEcosystem'

interface Dep {
  instance: AtomInstanceBase<any, any, any>
  isStatic: boolean
}

const useAtomInstanceSelector = <
  AI extends AtomInstanceBase<any, any, any>,
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
      'useAtomSelector',
      false
    )
  }, [force, instance])

  useLayoutEffect(() => () => cleanupRef.current?.(), [])

  return state
}

const useStandaloneSelector = <T>(selector: AtomSelector<T>) => {
  const ecosystem = useEcosystem()
  const [, forceRender] = useState<any>()
  const prevDeps = useRef<{ cleanup: () => void; dep: Dep }[]>([])
  const prevResult = useRef<T>()
  const selectorRef = useRef<typeof selector>() // don't populate initially

  const runSelector = () => {
    const deps: Record<string, Dep> = {}
    let isExecuting = true

    const get = <AI extends AtomInstanceBase<any, any, any>>(
      atomOrInstance: AtomBase<any, any, AI> | AI,
      params?: any[]
    ) => {
      const instance =
        atomOrInstance instanceof AtomInstanceBase
          ? atomOrInstance
          : ecosystem.getInstance(atomOrInstance, params as any[])

      if (isExecuting) deps[instance.keyHash] = { instance, isStatic: false }

      return instance.store.getState()
    }

    const getInstance = <AI extends AtomInstanceBase<any, any, any>>(
      atomOrInstance: AtomBase<any, any, AI> | AI,
      params?: any[]
    ) => {
      const instance = ecosystem.getInstance(
        atomOrInstance as AtomBase<any, any, AI>,
        params as any[]
      )

      // don't override any dynamic deps on the same instance
      if (isExecuting && !deps[instance.keyHash]) {
        deps[instance.keyHash] = { instance, isStatic: true }
      }

      return instance.store.getState()
    }

    const selectorResult = selector({ ecosystem, get, getInstance })
    isExecuting = false

    // clean up any deps that are gone now
    prevDeps.current.forEach(prevDep => {
      if (
        deps[prevDep.dep.instance.keyHash]?.isStatic === prevDep.dep.isStatic
      ) {
        return
      }

      prevDep.cleanup()
    })

    const newDeps: typeof prevDeps.current = []

    // register new deps
    Object.values(deps).forEach(dep => {
      const index = prevDeps.current.findIndex(
        prevDep =>
          prevDep.dep.instance === dep.instance &&
          prevDep.dep.isStatic === dep.isStatic
      )
      if (index !== -1) {
        newDeps.push(prevDeps.current[index])
        return
      }

      const cleanup = ecosystem._graph.registerExternalDependent(
        dep.instance,
        signal => {
          if (signal === GraphEdgeSignal.Destroyed) {
            forceRender({})
            return
          }

          // only forceRender if the selector result changes
          const newResult = runSelector()

          if (newResult === prevResult.current) return

          forceRender({})
          prevResult.current = newResult
        },
        'useAtomSelector',
        false
      )

      newDeps.push({ cleanup, dep })
    })

    prevDeps.current = newDeps

    return selectorResult
  }

  const result =
    selector === selectorRef.current ? prevResult.current : runSelector()

  prevResult.current = result
  selectorRef.current = selector

  // Final cleanup on unmount
  useLayoutEffect(
    () => () => {
      prevDeps.current.forEach(dep => {
        dep.cleanup()
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
