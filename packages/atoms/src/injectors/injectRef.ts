import {
  MutableRefObject,
  PartialAtomInstance,
  RefObject,
} from '@zedux/atoms/types'
import { createInjector } from '../factories/createInjector'
import { prefix } from '../utils'

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
