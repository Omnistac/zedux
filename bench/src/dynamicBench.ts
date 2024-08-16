import v8 from 'v8-natives'
import { makeGraph, runGraph } from './util/dependencyGraph'
import { logPerfResult, perfRowStrings } from './util/perfLogging'
import { verifyBenchResult } from './util/perfTests'
import { FrameworkInfo } from './util/frameworkTypes'
import { perfTests } from './config'
import { fastestTest } from './util/benchRepeat'

/** benchmark a single test under single framework.
 * The test is run multiple times and the fastest result is logged to the console.
 */
export async function dynamicBench(
  frameworkTest: FrameworkInfo,
  testRepeats = 5
): Promise<void> {
  const { framework } = frameworkTest
  for (const config of perfTests) {
    const { iterations, readFraction } = config

    const { graph, counter } = makeGraph(framework, config)

    function runOnce(): number {
      return runGraph(graph, iterations, readFraction, framework)
    }

    // warm up
    v8.optimizeFunctionOnNextCall(runOnce)
    runOnce()

    const timedResult = await fastestTest(testRepeats, () => {
      counter.count = 0
      const sum = runOnce()
      return { sum, count: counter.count }
    })

    logPerfResult(perfRowStrings(framework.name, config, timedResult))
    verifyBenchResult(frameworkTest, config, timedResult)
  }
}
