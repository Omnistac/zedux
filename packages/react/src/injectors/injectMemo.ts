import { createInjector } from '../factories'
import { AnyAtomInstance, InjectorDeps } from '../types'
import { haveDepsChanged, prefix } from '../utils'

type MemoInjectorDescriptor<T> = {
  deps: InjectorDeps
  result: T
  type: string
}

export const injectMemo = createInjector(
  'injectMemo',
  <Value = any>(
    instance: AnyAtomInstance,
    valueFactory: () => Value,
    deps?: InjectorDeps
  ) =>
    ({
      type: `${prefix}/memo`,
      deps,
      result: valueFactory(),
    } as MemoInjectorDescriptor<Value>),
  <Value = any>(
    prevDescriptor: MemoInjectorDescriptor<Value>,
    instance: AnyAtomInstance,
    valueFactory: () => Value,
    deps?: InjectorDeps
  ) => {
    const depsHaveChanged = haveDepsChanged(prevDescriptor.deps, deps)

    const result = depsHaveChanged ? valueFactory() : prevDescriptor.result

    prevDescriptor.deps = deps
    prevDescriptor.result = result

    return prevDescriptor
  }
)
