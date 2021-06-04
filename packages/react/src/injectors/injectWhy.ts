import { InjectorType, split, WhyInjectorDescriptor } from '../utils'
import { diContext } from '../utils/csContexts'

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

  return diContext.consume().instance._evaluationReasons
}
