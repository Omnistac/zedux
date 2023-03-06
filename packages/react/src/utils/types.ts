import { AnyAtomInstance } from '@zedux/react/types'
import { SelectorCache } from '../classes/Selectors'

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
   * The id of the instance or SelectorCache
   */
  id: string

  /**
   * the high-def timestamp of when the item was pushed onto the stack
   */
  start?: number
}

export interface InstanceStackItem extends StackItemBase {
  instance: AnyAtomInstance
}

export interface SelectorStackItem extends StackItemBase {
  cache: SelectorCache
}

export type StackItem = InstanceStackItem | SelectorStackItem
