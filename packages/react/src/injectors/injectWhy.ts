import {
  EvaluationReason,
  InjectorType,
  validateInjector,
  WhyInjectorDescriptor,
} from '../utils'
import { diContext } from '../utils/csContexts'

export const injectWhy = (
  callback: (reasons: EvaluationReason[]) => unknown
) => {
  if (typeof callback !== 'function') {
    throw new TypeError('Zedux Error - injectWhy callback must be a function')
  }

  const context = diContext.consume()

  validateInjector<WhyInjectorDescriptor>(
    'injectWhy',
    InjectorType.Why,
    context
  )

  const descriptor: WhyInjectorDescriptor = {
    callback,
    type: InjectorType.Why,
  }

  context.injectors.push(descriptor)
}
