import { dynamicBench } from './dynamicBench'
import { cellxbench } from './cellxBench'
import { sbench } from './sBench'
import { frameworkInfo } from './config'
import { logPerfResult, perfReportHeaders } from './util/perfLogging'
import { molBench } from './molBench'
import { kairoBench } from './kairoBench'
import { createInterface } from 'node:readline/promises'

async function main() {
  logPerfResult(perfReportHeaders())

  for (const { framework } of frameworkInfo) {
    await kairoBench(framework)
  }

  for (const { framework } of frameworkInfo) {
    await molBench(framework)
  }

  for (const { framework } of frameworkInfo) {
    sbench(framework)
  }

  for (const { framework } of frameworkInfo) {
    cellxbench(framework)
  }

  // for (const frameworkTest of frameworkInfo) {
  //   await dynamicBench(frameworkTest)
  // }

  // When running chrome profiler, line level profiling numbers disappear when
  // the process exits. Keep it alive
  if (process.env.DEBUG) {
    const rl = createInterface({ input: process.stdin, output: process.stdout })

    const response =
      (await rl.question('Finished benchmarks. Rerun? [Y/n] ')) || 'y'

    if (response.toLowerCase().startsWith('y')) {
      main()
    }

    rl.close()
  }
}

main()
