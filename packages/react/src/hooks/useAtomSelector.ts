import { AtomSelectorOrConfig, MaybeCleanup } from '../types'
import { useEffect, useRef, useState } from 'react'
import { AtomSelectorCache, generateAtomSelectorId } from '../utils'
import { useEcosystem } from './useEcosystem'
import { runAtomSelector } from '../utils/runAtomSelector'

const OPERATION = 'useAtomSelector'

export const useAtomSelector = <T, Args extends any[]>(
  atomSelector: AtomSelectorOrConfig<T, Args>,
  ...args: Args
): T => {
  const ecosystem = useEcosystem()
  const [, forceRender] = useState<any>()
  const cache = useRef<AtomSelectorCache<T, Args>>({
    id: '',
    prevDeps: {},
  })
  const hasEffectRun = useRef(false)
  hasEffectRun.current = false

  // doesn't matter if fibers/suspense mess this id up - it's just for some
  // consistency when inspecting dependencies created by this selector in
  // development
  if (!cache.current.id) {
    cache.current.id = `react-component-${generateAtomSelectorId()}`
  }

  let effect: MaybeCleanup = undefined
  const result = runAtomSelector<T, Args>(
    atomSelector,
    args,
    ecosystem,
    cache.current,
    () => forceRender({}),
    OPERATION,
    !!cache.current.prevArgs,
    materializeDeps => {
      // during render, we don't want to create any deps outside an effect.
      // After render, just update the deps immediately
      if (!hasEffectRun.current) effect = materializeDeps
      else materializeDeps()
    }
  )

  // run this effect every render
  useEffect(() => {
    hasEffectRun.current = true
    if (effect) {
      effect()
      effect = undefined
    }
  })

  cache.current.prevResult = result

  // Final cleanup on unmount
  useEffect(
    () => () => {
      if (!cache.current.prevDeps) return

      Object.values(cache.current.prevDeps).forEach(dep => {
        dep.cleanup?.()
      })
    },
    []
  )

  return result
}
