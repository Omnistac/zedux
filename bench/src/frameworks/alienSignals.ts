import { computed, effect, endBatch, signal, startBatch } from 'alien-signals'
import { ReactiveFramework } from '../util/reactiveFramework'

export const alienFramework: ReactiveFramework = {
  name: 'alien-signals',
  signal: initial => {
    const data = signal(initial)
    return {
      read: () => data(),
      write: v => data(v),
    }
  },
  computed: fn => {
    const c = computed(fn)
    return {
      read: () => c(),
    }
  },
  effect: fn => effect(fn),
  withBatch: fn => {
    startBatch()
    fn()
    endBatch()
  },
  withBuild: fn => fn(),
}
