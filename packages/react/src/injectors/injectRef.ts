import { RefObject } from '@zedux/react/types'
import { InjectorType, RefInjectorDescriptor, split } from '@zedux/react/utils'

export const injectRef = <T>(initialVal?: T): RefObject<T> => {
  const { ref } = split<RefInjectorDescriptor<T>>(
    'injectRef',
    InjectorType.Ref,
    () => ({
      ref: { current: initialVal ?? null },
      type: InjectorType.Ref,
    })
  )

  return ref
}
