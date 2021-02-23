import { injectMemo } from './injectMemo'

export const injectCallback = <Args extends any[] = [], Ret = any>(
  callback: (...args: Args) => Ret,
  deps?: any[]
) => injectMemo(() => callback, deps)
