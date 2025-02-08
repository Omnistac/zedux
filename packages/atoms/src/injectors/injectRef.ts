import type { MutableRefObject, RefObject } from '../types/index'
import { injectPrevDescriptor, setNextInjector } from './injectPrevDescriptor'

const TYPE = 'injectRef'

export const injectRef: {
  <T>(initialVal: T): MutableRefObject<T>
  <T>(initialVal: T | null): RefObject<T>
  <T = undefined>(): MutableRefObject<T | undefined>
} = <T>(initialVal?: T) =>
  setNextInjector(
    injectPrevDescriptor<{ current: T }>(TYPE) || {
      c: undefined,
      i: undefined,
      t: TYPE,
      v: { current: initialVal as T },
    }
  ).v
