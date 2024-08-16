// The following is an implementation of the cellx benchmark https://github.com/Riim/cellx/blob/master/perf/perf.html
import { logPerfResult } from './util/perfLogging'
import { Computed, ReactiveFramework } from './util/reactiveFramework'

const cellx = (framework: ReactiveFramework, layers: number) => {
  return framework.withBuild(() => {
    const start = {
      prop1: framework.signal(1),
      prop2: framework.signal(2),
      prop3: framework.signal(3),
      prop4: framework.signal(4),
    }

    let layer: {
      prop1: Computed<number>
      prop2: Computed<number>
      prop3: Computed<number>
      prop4: Computed<number>
    } = start

    for (let i = layers; i > 0; i--) {
      const m = layer
      const s = {
        prop1: framework.computed(() => m.prop2.read()),
        prop2: framework.computed(() => m.prop1.read() - m.prop3.read()),
        prop3: framework.computed(() => m.prop2.read() + m.prop4.read()),
        prop4: framework.computed(() => m.prop3.read()),
      }

      framework.effect(() => s.prop1.read())
      framework.effect(() => s.prop2.read())
      framework.effect(() => s.prop3.read())
      framework.effect(() => s.prop4.read())

      s.prop1.read()
      s.prop2.read()
      s.prop3.read()
      s.prop4.read()

      layer = s
    }

    const end = layer

    const startTime = performance.now()

    const before = [
      end.prop1.read(),
      end.prop2.read(),
      end.prop3.read(),
      end.prop4.read(),
    ] as const

    framework.withBatch(() => {
      start.prop1.write(4)
      start.prop2.write(3)
      start.prop3.write(2)
      start.prop4.write(1)
    })

    const after = [
      end.prop1.read(),
      end.prop2.read(),
      end.prop3.read(),
      end.prop4.read(),
    ] as const

    const endTime = performance.now()
    const elapsedTime = endTime - startTime

    return [elapsedTime, before, after] as const
  })
}

const arraysEqual = (a: readonly number[], b: readonly number[]) => {
  if (a.length !== b.length) return false

  for (let i = 0; i < a.length; ++i) {
    if (a[i] !== b[i]) return false
  }

  return true
}

type BenchmarkResults = [
  readonly [number, number, number, number],
  readonly [number, number, number, number]
]

export const cellxbench = (framework: ReactiveFramework) => {
  const expected: Record<number, BenchmarkResults> = {
    1000: [
      [-3, -6, -2, 2],
      [-2, -4, 2, 3],
    ],
    2500: [
      [-3, -6, -2, 2],
      [-2, -4, 2, 3],
    ],
    5000: [
      [2, 4, -1, -6],
      [-2, 1, -4, -4],
    ],
  }

  const results: Record<number, BenchmarkResults> = {}

  for (const layers in expected) {
    let total = 0
    for (let i = 0; i < 10; i++) {
      const [elapsed, before, after] = cellx(framework, Number(layers))

      results[layers] = [before, after]

      total += elapsed
    }
    logPerfResult({
      framework: framework.name,
      test: `cellx${layers}`,
      time: total.toFixed(2),
    })
  }

  for (const layers in expected) {
    const [before, after] = results[layers]
    const [expectedBefore, expectedAfter] = expected[layers]

    console.assert(
      arraysEqual(before, expectedBefore),
      `Expected first layer ${expectedBefore}, found first layer ${before}`
    )

    console.assert(
      arraysEqual(after, expectedAfter),
      `Expected last layer ${expectedAfter}, found last layer ${after}`
    )
  }
}
