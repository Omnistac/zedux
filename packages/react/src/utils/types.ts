import { AnyAtomInstance } from '@zedux/react/types'
import { SelectorCacheItem } from '../classes/SelectorCache'

export interface EvaluateNodeJob extends JobBase {
  flags: number
  keyHash: string
  type: JobType.EvaluateNode
}

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

export interface JobBase {
  task: () => void
  type: JobType
}

export type Job = EvaluateNodeJob | RunEffectJob | UpdateExternalDependentJob

export enum JobType {
  EvaluateNode = 'EvaluateNode',
  RunEffect = 'RunEffect',
  UpdateExternalDependent = 'UpdateExternalDependent',
}

export interface RunEffectJob extends JobBase {
  type: JobType.RunEffect
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

export interface UpdateExternalDependentJob extends JobBase {
  flags: number
  type: JobType.UpdateExternalDependent
}
