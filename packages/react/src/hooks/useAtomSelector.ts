import { AtomSelector, AtomSelectorOrConfig, MaybeCleanup } from '../types'
import { useLayoutEffect, useRef, useState } from 'react'
import { Dep, generateAtomSelectorId } from '../utils'
import { useEcosystem } from './useEcosystem'
import { runAtomSelector } from '../utils/runAtomSelector'

const OPERATION = 'useAtomSelector'

export const useAtomSelector = <T, Args extends any[]>(
  atomSelector: AtomSelectorOrConfig<T, Args>,
  ...args: Args
): T => {
  const ecosystem = useEcosystem()
  const [, forceRender] = useState<any>()
  const prevArgs = useRef<Args>() // don't populate initially
  const prevDeps = useRef<Record<string, Dep>>({})
  const prevResult = useRef<T>()
  const prevSelector = useRef<AtomSelector<T, Args>>() // don't populate initially
  const idRef = useRef<string>()
  const hasEffectRun = useRef(false)
  hasEffectRun.current = false

  // doesn't matter if fibers/suspense mess this id up - it's just for some
  // consistency when inspecting dependencies created by this selector in
  // development
  if (!idRef.current) idRef.current = generateAtomSelectorId()

  let effect: MaybeCleanup = undefined
  const result = runAtomSelector<T, Args>(
    atomSelector,
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
    materializeDeps => {
      // during render, we don't want to create any deps outside an effect.
      // After render, just update the deps immediately
      if (!hasEffectRun.current) effect = materializeDeps
      else materializeDeps()
    }
  )

  // run this effect every render
  useLayoutEffect(() => {
    hasEffectRun.current = true
    if (effect) effect()
  })

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
