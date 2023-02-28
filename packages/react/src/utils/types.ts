import { AnyAtomInstance } from '@zedux/react/types'
import { SelectorCacheItem } from '../classes/SelectorCache'

export type InjectorDescriptor<T = any> = T extends undefined
  ? {
      cleanup?: () => void
      result?: T
      type: string
    }
  : {
      cleanup?: () => void
      result: T
      type: string
    }

export interface StackItemBase {
  /**
   * The cacheKey of the instance or selectorCache
   */
  key: string

  /**
   * the high-def timestamp of when the item was pushed onto the stack
   */
  start?: number
}

export interface InstanceStackItem extends StackItemBase {
  instance: AnyAtomInstance
}

export interface SelectorStackItem extends StackItemBase {
  cache: SelectorCacheItem
}

export type StackItem = InstanceStackItem | SelectorStackItem
