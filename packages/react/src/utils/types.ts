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

export interface StackItem {
  /**
   * The atom instance or selector cache that's currently evaluating
   */
  node: AnyAtomInstance | SelectorCache

  /**
   * The high-def timestamp of when the item was pushed onto the stack
   */
  start?: number
}
