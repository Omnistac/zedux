import { TestConfig, FrameworkInfo } from './util/frameworkTypes'

import { angularFramework } from './frameworks/angularSignals'
import { compostateFramework } from './frameworks/compostate'
import { jotaiFramework } from './frameworks/jotai'
import { kairoFramework } from './frameworks/kairo'
import { mobxFramework } from './frameworks/mobx'
import { molWireFramework } from './frameworks/molWire'
import { obyFramework } from './frameworks/oby'
import { preactSignalFramework } from './frameworks/preactSignals'
import { reactivelyFramework } from './frameworks/reactively'
import { sFramework } from './frameworks/s'
import { solidFramework } from './frameworks/solid'
import { usignalFramework } from './frameworks/uSignal'
import { vueReactivityFramework } from './frameworks/vueReactivity'
import { xReactivityFramework } from './frameworks/xReactivity'
import { zeduxFramework } from './frameworks/zedux'

export const frameworkInfo: FrameworkInfo[] = [
  // { framework: angularFramework, testPullCounts: true },
  // { framework: compostateFramework, testPullCounts: true },
  // { framework: jotaiFramework, testPullCounts: true },
  // { framework: kairoFramework, testPullCounts: true },
  // { framework: mobxFramework, testPullCounts: true },
  // { framework: molWireFramework, testPullCounts: true },
  // { framework: obyFramework, testPullCounts: true },
  // { framework: preactSignalFramework, testPullCounts: true },
  // { framework: reactivelyFramework, testPullCounts: true },
  // { framework: sFramework },
  // { framework: solidFramework }, // solid can't testPullCounts because batch executes all leaf nodes even if unread
  // { framework: usignalFramework, testPullCounts: true },
  // { framework: vueReactivityFramework, testPullCounts: true },
  // { framework: xReactivityFramework, testPullCounts: true },
  { framework: zeduxFramework, testPullCounts: true },
]

export const perfTests: TestConfig[] = [
  {
    name: 'simple component',
    width: 10, // can't change for decorator tests
    staticFraction: 1, // can't change for decorator tests
    nSources: 2, // can't change for decorator tests
    totalLayers: 5,
    readFraction: 0.2,
    iterations: 600000,
    expected: {
      sum: 19199968,
      count: 3480000,
    },
  },
  {
    name: 'dynamic component',
    width: 10,
    totalLayers: 10,
    staticFraction: 3 / 4,
    nSources: 6,
    readFraction: 0.2,
    iterations: 15000,
    expected: {
      sum: 302310782860,
      count: 1155000,
    },
  },
  {
    name: 'large web app',
    width: 1000,
    totalLayers: 12,
    staticFraction: 0.95,
    nSources: 4,
    readFraction: 1,
    iterations: 7000,
    expected: {
      sum: 29355933696000,
      count: 1463000,
    },
  },
  {
    name: 'wide dense',
    width: 1000,
    totalLayers: 5,
    staticFraction: 1,
    nSources: 25,
    readFraction: 1,
    iterations: 3000,
    expected: {
      sum: 1171484375000,
      count: 732000,
    },
  },
  {
    name: 'deep',
    width: 5,
    totalLayers: 500,
    staticFraction: 1,
    nSources: 3,
    readFraction: 1,
    iterations: 500,
    expected: {
      sum: 3.0239642676898464e241,
      count: 1246500,
    },
  },
  {
    name: 'very dynamic',
    width: 100,
    totalLayers: 15,
    staticFraction: 0.5,
    nSources: 6,
    readFraction: 1,
    iterations: 2000,
    expected: {
      sum: 15664996402790400,
      count: 1078000,
    },
  },
]
