import {
  atom,
  AtomInstanceType,
  injectAtomInstance,
  injectAtomSelector,
  injectEffect,
  injectRef,
  injectStore,
} from '@zedux/react'
import { ecosystemWrapper } from './ecosystemWrapper'
import { stateHub } from './stateHub'
import { toasts } from './toasts'

/**
 * If the currently-selected ecosystem is destroyed, we allow the dev to
 * continue to inspect the static last values of the destroyed ecosystem.
 *
 * This atom keeps the destroyed ecosystem and its wrapper around until the dev
 * selects a new ecosystem
 */
export const destroyedEcosystemWrapper = atom(
  'destroyedEcosystemWrapper',
  () => {
    const store = injectStore<
      AtomInstanceType<typeof ecosystemWrapper> | undefined
    >(undefined)

    const currentEcosystemId = injectAtomSelector(
      ({ get }) => get(stateHub).ecosystemId
    )

    const { showToast } = injectAtomInstance(toasts).exports

    const resolveToastRef = injectRef<(val: any) => void>()
    const wrappedInstance = store.getState()

    injectEffect(() => {
      if (!wrappedInstance) return resolveToastRef.current?.(null)

      showToast({
        description:
          'The current ecosystem has been destroyed. You may still view its final state. Or you could pick a new ecosystem from the dropdown. Your choice.',
        title: 'Ecosystem Destroyed',
        ttl: new Promise(resolve => {
          resolveToastRef.current = resolve
        }),
        type: 'warning',
      })
    }, [wrappedInstance]) // not showToast - just use the current value whenever this effect runs

    // when the dev selects a different ecosystem, clear this atom's state
    injectEffect(() => {
      store.setState(undefined)
    }, [currentEcosystemId])

    return store
  }
)
