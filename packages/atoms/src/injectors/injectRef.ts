import { createInjector } from '../factories/createInjector'
import type {
  MutableRefObject,
  PartialAtomInstance,
  RefObject,
} from '../types/index'
import { prefix } from '../utils/general'

export const injectRef: {
  <T>(initialVal: T): MutableRefObject<T>
  <T>(initialVal: T | null): RefObject<T>
  <T = undefined>(): MutableRefObject<T | undefined>
} = createInjector(
  'injectRef',
  <T>(instance: PartialAtomInstance, initialVal?: T) => ({
    result: { current: initialVal as T },
    type: `${prefix}/ref`,
  })
)
