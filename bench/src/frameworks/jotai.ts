import { atom, createStore } from 'jotai/vanilla'
import { Computed, ReactiveFramework } from '../util/reactiveFramework'

const store = createStore()
let globalGet: any

export const jotaiFramework: ReactiveFramework = {
  name: 'Jotai',
  signal: initialValue => {
    const theAtom = atom(initialValue)

    return {
      write: v => store.set(theAtom, v),
      read: () => globalGet(theAtom),
    }
  },
  computed: <T>(fn: () => T): Computed<T> => {
    const theAtom = atom(get => {
      globalGet = get
      return fn()
    })

    return {
      read: () => globalGet(theAtom),
    }
  },
  effect: fn => {
    const theAtom = atom(get => {
      globalGet = get
      fn()
    })

    store.sub(theAtom, () => {})
  },
  withBatch: fn => fn(),
  withBuild: fn => fn(),
}
