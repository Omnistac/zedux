import type { InjectorDescriptor } from '../classes/instances/AtomInstance'
import { EffectCallback, InjectorDeps } from '../types/index'
import { scheduleAsync } from '../utils/ecosystem'
import { untrack } from '../utils/evaluationContext'
import { compare } from '../utils/general'
import { injectPrevDescriptor, setNextInjector } from './injectPrevDescriptor'
import { injectSelf } from './injectSelf'

const TYPE = 'effect'

/**
 * Runs a deferred side effect. This is just like React's `useEffect`. When
 * `deps` change on a subsequent reevaluation, the previous effect will be
 * cleaned up and the effect will rerun.
 *
 * On initial evaluation, the effect runs as soon as it's "safe" to do so. When
 * atoms are initialized in React hooks, effects run in a microtask to make sure
 * they don't trigger React state updates during render. Outside React, effects
 * run immediately after all nodes are created from an `ecosystem.get*` call.
 *
 * You can always know effects have already run when using atoms anywhere but
 * during React component renders.
 *
 * Some effects are safe to run during React renders, e.g. effects that just
 * register event listeners. Or sometimes you want to use a value created in the
 * effect immediately during atom evaluation, e.g. to set an atom's promise. For
 * these cases, you can pass `{ synchronous: true }` as the third argument to
 * make the effect run immediately.
 *
 * Return a cleanup function to clean up resources when the effect reruns or the
 * current atom instance is destroyed.
 *
 * Unlike `useEffect`, you can return a promise from `injectEffect` (e.g. by
 * passing an async function). This is only for convenience in cases where you
 * don't have anything to cleanup, as you'll be unable to clean up resources if
 * you return a promise. Because of this, `injectPromise` may be preferable when
 * using promises so you can use the passed AbortController to cleanup.
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

  const { e } = injectSelf()
  const isUsingAsyncScheduler = e.S?.t === 'react'

  const nextDescriptor: InjectorDescriptor<InjectorDeps> = {
    c: () => {
      prevDescriptor?.c?.()
      ;(isUsingAsyncScheduler ? e.asyncScheduler : e.syncScheduler).unschedule(
        job
      )
    },
    t: TYPE,
    v: deps,
  }

  const job = {
    j: () => {
      prevDescriptor?.c?.()

      const cleanup = untrack(() => e.batch(effect)) // let this throw

      nextDescriptor.c = typeof cleanup === 'function' ? cleanup : undefined
    },
    T: 4 as const,
  }

  if (config?.synchronous) {
    job.j()
  } else if (!e.ssr) {
    scheduleAsync(e, job)
  }

  setNextInjector(nextDescriptor)
}
