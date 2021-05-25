import { MutableRefObject, RefObject } from '@zedux/react/types'
import { InjectorType, RefInjectorDescriptor, split } from '@zedux/react/utils'

export const injectRef: {
  <T>(initialVal: T): MutableRefObject<T>
  <T>(initialVal: T | null): RefObject<T>
  <T = undefined>(): MutableRefObject<T | undefined>
} = <T>(initialVal?: T) => {
  const { ref } = split<RefInjectorDescriptor<T>>(
    'injectRef',
    InjectorType.Ref,
    () => ({
      ref: { current: initialVal as T },
      type: InjectorType.Ref,
    })
  )

  return ref
}
