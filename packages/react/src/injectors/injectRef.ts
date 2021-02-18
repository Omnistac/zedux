import { RefObject } from '@zedux/react/types'
import {
  InjectorType,
  RefInjectorDescriptor,
  validateInjector,
} from '@zedux/react/utils'
import { diContext } from '@zedux/react/utils/diContext'

export const injectRef = <T = any>(initialVal?: T) => {
  const context = diContext.consume()

  let descriptor = validateInjector<RefInjectorDescriptor<T>>(
    'injectRef',
    InjectorType.Ref,
    context
  )

  if (context.isInitializing) {
    const ref: RefObject<T> = { current: initialVal }

    descriptor = {
      ref,
      type: InjectorType.Ref,
    }
  }

  context.injectors.push(descriptor)

  return descriptor.ref
}
