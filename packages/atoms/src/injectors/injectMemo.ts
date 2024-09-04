import { createInjector } from '../factories/createInjector'
import { InjectorDeps, PartialAtomInstance } from '../types/index'
import { compare, prefix } from '../utils/general'

type MemoInjectorDescriptor<T> = {
  deps: InjectorDeps
  result: T
  type: string
}

export const injectMemo: <Value = any>(
  valueFactory: () => Value,
  deps?: InjectorDeps
) => Value = createInjector(
  'injectMemo',
  <Value = any>(
    instance: PartialAtomInstance,
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
    instance: PartialAtomInstance,
    valueFactory: () => Value,
    deps?: InjectorDeps
  ) => {
    const depsUnchanged = compare(prevDescriptor.deps, deps)

    const result = depsUnchanged ? prevDescriptor.result : valueFactory()

    prevDescriptor.deps = deps
    prevDescriptor.result = result

    return prevDescriptor
  }
)
