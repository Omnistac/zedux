import {
  Ecosystem,
  SelectorInstance,
  Signal,
  createEcosystem,
  // } from '../../../packages/atoms/dist/zedux-atoms.es.min'
} from '../../../packages/atoms'
import { Computed, ReactiveFramework } from '../util/reactiveFramework'

let ecosystem: Ecosystem
let counter = 0

class BenchmarkableSelector extends SelectorInstance {
  /**
   * Zedux is a cache manager. Unlike other signals-libs, it cleans up graph
   * nodes when it detects they're no longer in use. These benchmarks don't
   * expect that behavior. Making `node.m`aybeDestroy a noop is all that's
   * needed to prevent automatic destruction, while still allowing manual
   * destruction via `node.destroy()`.
   */
  m() {}
}

class BenchmarkableSignal extends Signal {
  m() {}
}

export const zeduxFramework: ReactiveFramework = {
  name: 'Zedux',
  signal: initialValue => {
    const s = new BenchmarkableSignal(
      ecosystem,
      (counter++).toString(),
      initialValue
    )

    return {
      read: () => s.get(),
      write: v => s.set(v),
    }
  },
  computed: <T>(fn: () => T): Computed<T> => {
    const s = new BenchmarkableSelector(
      ecosystem,
      (counter++).toString(),
      fn,
      []
    )

    return {
      read: () => s.get(),
    }
  },
  effect: fn =>
    new BenchmarkableSelector(ecosystem, (counter++).toString(), fn, []),
  withBatch: fn => ecosystem.batch(fn),
  withBuild: fn => {
    if (ecosystem) ecosystem.reset()

    ecosystem = createEcosystem()
    globalThis.ecosystem = ecosystem
    return fn()
  },
}
