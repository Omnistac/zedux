import { atom, createStore } from 'jotai/vanilla'
import { Computed, ReactiveFramework } from '../util/reactiveFramework'

const store = createStore()
let globalGet: any

export const jotaiFramework: ReactiveFramework = {
  name: 'Jotai',
  signal: initialValue => {
    const signal = atom(initialValue)

    return {
      write: v => store.set(signal, v),
      read: () => globalGet(signal),
    }
  },
  computed: <T>(fn: () => T): Computed<T> => {
    const computed = atom(get => {
      globalGet = get
      return fn()
    })

    return {
      read: () => globalGet(computed),
    }
  },
  effect: fn => {
    const effect = atom(get => {
      globalGet = get
      fn()
    })

    store.sub(effect, () => {})
  },
  withBatch: fn => fn(),
  withBuild: fn => fn(),
}
