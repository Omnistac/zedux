declare module 'v8-natives' {
  export interface V8 {
    isNative: () => boolean
    collectGarbage: () => void
    debugPrint: (data: any) => void
    optimizeFunctionOnNextCall: (fn: (...args: any[]) => any) => void
    getOptimizationStatus: (fn: (...args: any[]) => any) => number
    deoptimizeFunction: (fn: (...args: any[]) => any) => void
    deoptimizeNow: (fn: (...args: any[]) => any) => void
    ClearFunctionFeedback: (fn: (...args: any[]) => any) => void
    debugTrace: (fn: (...args: any[]) => any) => void
    getHeapUsage: (fn: (...args: any[]) => any) => void
    hasFastProperties: (fn: (...args: any[]) => any) => void
    hasFastPackedElements: (fn: (...args: any[]) => any) => void
    HasSmiElements: (fn: (...args: any[]) => any) => void
    hasDoubleElements: (fn: (...args: any[]) => any) => void
    hasDictionaryElements: (fn: (...args: any[]) => any) => void
    HasHoleyElements: (fn: (...args: any[]) => any) => void
    hasSmiOrObjectElements: (fn: (...args: any[]) => any) => void
    hasSloppyArgumentsElements: (fn: (...args: any[]) => any) => void
    haveSameMap: (fn: (...args: any[]) => any) => void
    getFunctionName: (fn: (...args: any[]) => any) => void
    functionGetName: (fn: (...args: any[]) => any) => void
    isSmi: (fn: (...args: any[]) => any) => void
    isValidSmi: (fn: (...args: any[]) => any) => void
    neverOptimizeFunction: (fn: (...args: any[]) => any) => void
    traceEnter: (fn: (...args: any[]) => any) => void
    traceExit: (fn: (...args: any[]) => any) => void
    CompileOptimized: (fn: (...args: any[]) => any) => void
    helpers: {
      printStatus: (fn: (...args: any[]) => any) => void
      testOptimization: (fn: (...args: any[]) => any) => void
      benchmark: (fn: (...args: any[]) => any) => void
    }
  }

  const v8: V8
  export default v8
}
