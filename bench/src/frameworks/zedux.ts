import { Ecosystem, atom, createEcosystem } from '@zedux/atoms'
import { Computed, ReactiveFramework } from '../util/reactiveFramework'

let ecosystem: Ecosystem
let counter = 0

export const zeduxFramework: ReactiveFramework = {
  name: 'Zedux',
  signal: initialValue => {
    const instance = ecosystem.getInstance(
      atom((counter++).toString(), initialValue)
    )

    return {
      write: v => instance.setState(v),
      read: () => ecosystem.live.get(instance),
    }
  },
  computed: <T>(fn: () => T): Computed<T> => {
    const instance = ecosystem.getNode(fn)

    return {
      read: () => ecosystem.live.select(instance),
    }
  },
  effect: fn => ecosystem.getNode(fn),
  withBatch: fn => ecosystem.batch(fn),
  withBuild: fn => {
    if (ecosystem) {
      ecosystem.reset()
    }
    ecosystem = createEcosystem()
    return fn()
  },
}
