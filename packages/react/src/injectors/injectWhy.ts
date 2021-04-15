import {
  EvaluationReason,
  InjectorType,
  split,
  WhyInjectorDescriptor,
} from '../utils'

export const injectWhy = (
  callback: (reasons: EvaluationReason[]) => unknown
) => {
  if (typeof callback !== 'function') {
    throw new TypeError('Zedux Error - injectWhy callback must be a function')
  }

  split<WhyInjectorDescriptor>(
    'injectWhy',
    InjectorType.Why,
    () => ({
      callback,
      type: InjectorType.Why,
    }),
    prevDescriptor => {
      prevDescriptor.callback = callback
      return prevDescriptor
    }
  )
}
