import { TestConfig } from "./frameworkTypes";
import { TestResult, TimingResult } from "./perfTests";

export function logPerfResult(row: PerfRowStrings): void {
  const line = Object.values(trimColumns(row)).join(" , ");
  console.log(line);
}

export interface PerfRowStrings {
  framework: string;
  test: string;
  time: string;
  gcTime?: string;
}

const columnWidth = {
  framework: 16,
  test: 60,
  time: 8,
  gcTime: 6,
};

export function perfReportHeaders(): PerfRowStrings {
  const keys: (keyof PerfRowStrings)[] = Object.keys(columnWidth) as any;
  const kv = keys.map((key) => [key, key]);
  const untrimmed = Object.fromEntries(kv);
  return trimColumns(untrimmed);
}

export function perfRowStrings(
  frameworkName: string,
  config: TestConfig,
  timed: TimingResult<TestResult>
): PerfRowStrings {
  const { timing } = timed;

  return {
    framework: frameworkName,
    test: `${makeTitle(config)} (${config.name || ""})`,
    time: timing.time.toFixed(2),
    gcTime: (timing.gcTime || 0).toFixed(2),
  };
}

export function makeTitle(config: TestConfig): string {
  const { width, totalLayers, staticFraction, nSources, readFraction } = config;
  const dyn = staticFraction < 1 ? " - dynamic" : "";
  const read = readFraction < 1 ? ` - read ${percent(readFraction)}` : "";
  const sources = ` - ${nSources} sources`;
  return `${width}x${totalLayers}${sources}${dyn}${read}`;
}

function percent(n: number): string {
  return Math.round(n * 100) + "%";
}

function trimColumns(row: PerfRowStrings): PerfRowStrings {
  const keys: (keyof PerfRowStrings)[] = Object.keys(columnWidth) as any;
  const trimmed = { ...row };
  for (const key of keys) {
    const length = columnWidth[key];
    const value = (row[key] || "").slice(0, length).padEnd(length);
    trimmed[key] = value;
  }
  return trimmed;
}
