import { ReactiveFramework } from '../util/reactiveFramework'
import { batch, Observable, observable, observe } from '@legendapp/state'

export const legendFramework: ReactiveFramework = {
  name: 'Legend',
  signal: initialValue => {
    const s = observable(initialValue)
    return {
      write: v => (s as Observable<any>).set(v),
      read: () => s.get(),
    }
  },
  computed: <T>(fn: () => T) => {
    const memo = observable(fn)
    return {
      read: () => memo.get() as T,
    }
  },
  effect: fn => observe(fn),
  withBatch: fn => batch(fn),
  withBuild: fn => fn(),
}
