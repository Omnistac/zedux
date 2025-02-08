import type { InjectorDescriptor } from '../classes/instances/AtomInstance'
import { EffectCallback, InjectorDeps } from '../types/index'
import { untrack } from '../utils/evaluationContext'
import { compare } from '../utils/general'
import { injectPrevDescriptor, setNextInjector } from './injectPrevDescriptor'

const TYPE = 'injectEffect'

/**
 * Runs a deferred side effect. This is just like React's `useEffect`. When
 * `deps` change on a subsequent reevaluation, the previous effect will be
 * cleaned up and the effect will rerun.
 *
 * Return a cleanup function to clean up resources when the effect reruns or the
 * current atom instance is destroyed.
 *
 * Unlike `useEffect`, you can return a promise from `injectEffect` (e.g. by
 * passing an async function). This is only for convenience in cases where you
 * don't have anything to cleanup, as you'll be unable to clean up resources if
 * you return a promise.
 */
export const injectEffect = (
  effect: EffectCallback,
  deps?: InjectorDeps,
  config?: { synchronous?: boolean }
) => {
  const prevDescriptor = injectPrevDescriptor<InjectorDeps>(TYPE)
  const depsUnchanged = compare(deps, prevDescriptor?.v)

  if (depsUnchanged) {
    setNextInjector(prevDescriptor!)

    return
  }

  const nextDescriptor: InjectorDescriptor<InjectorDeps> = {
    c: undefined,
    i: () => {
      prevDescriptor?.c?.()
      nextDescriptor.i = undefined // allow this closure to be garbage collected

      const cleanup = untrack(effect) // let this throw

      if (typeof cleanup === 'function') nextDescriptor.c = cleanup
    },
    t: TYPE,
    v: deps,
  }

  if (config?.synchronous) nextDescriptor.i!()

  setNextInjector(nextDescriptor)
}
