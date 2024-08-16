import { FrameworkInfo, TestConfig } from "./frameworkTypes";

export interface TestResult {
  sum: number;
  count: number;
}

export interface TimingResult<T> {
  result: T;
  timing: TestTiming;
}

export interface TestTiming {
  time: number;
  gcTime?: number;
}

export function verifyBenchResult(
  perfFramework: FrameworkInfo,
  config: TestConfig,
  timedResult: TimingResult<TestResult>
): void {
  const { testPullCounts, framework } = perfFramework;
  const { expected } = config;
  const { result } = timedResult;

  if (expected.sum) {
    console.assert(
      result.sum == expected.sum,
      `sum ${framework.name} ${config.name} result:${result.sum} expected:${expected.sum}`
    );
  }
  if (expected.count && (config.readFraction === 1 || testPullCounts)) {
    console.assert(
      result.count === expected.count,
      `count ${framework.name} ${config.name} result:${result.count} expected:${expected.count}`
    );
  }
}
