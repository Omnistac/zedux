import { haveDepsChanged, validateInjector } from '../utils'
import { diContext } from '../utils/csContexts'
import { InjectorType, MethodsInjectorDescriptor } from '../utils/types'

export const injectMethods = <
  Methods extends Record<string, () => any> = Record<string, () => any>
>(
  factory: () => Methods,
  deps?: any[]
) => {
  const context = diContext.consume()

  const prevDescriptor = validateInjector<MethodsInjectorDescriptor<Methods>>(
    'injectMethods',
    InjectorType.Methods,
    context
  )

  const depsHaveChanged = haveDepsChanged(prevDescriptor?.deps, deps)

  const methods = depsHaveChanged || !deps ? factory() : prevDescriptor.methods

  const descriptor: MethodsInjectorDescriptor<Methods> = {
    deps,
    methods,
    type: InjectorType.Methods,
  }

  context.injectors.push(descriptor)

  return methods
}
