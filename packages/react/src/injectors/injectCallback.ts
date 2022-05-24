import { InjectorDeps } from '../types'
import { injectMemo } from './injectMemo'

export const injectCallback = <Args extends any[] = [], Ret = any>(
  callback: (...args: Args) => Ret,
  deps?: InjectorDeps
) => injectMemo(() => callback, deps)
