import { readInstance } from '../classes/EvaluationStack'
import { InjectorType, split, WhyInjectorDescriptor } from '../utils'

export const injectWhy = () => {
  split<WhyInjectorDescriptor>(
    'injectWhy',
    InjectorType.Why,
    () => ({
      type: InjectorType.Why,
    }),
    prevDescriptor => {
      return prevDescriptor
    }
  )

  return readInstance()._nextEvaluationReasons
}
