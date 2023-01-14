import { InjectorDeps } from '../types'
import { haveDepsChanged, split } from '../utils'
import { InjectorType, MemoInjectorDescriptor } from '../utils/types'

export const injectMemo = <Value = any>(
  valueFactory: () => Value,
  deps?: InjectorDeps
) => {
  const { memoizedVal } = split<MemoInjectorDescriptor<Value>>(
    'injectMemo',
    InjectorType.Memo,
    () => ({
      type: InjectorType.Memo,
      deps: deps,
      memoizedVal: valueFactory(),
    }),
    prevDescriptor => {
      const depsHaveChanged = haveDepsChanged(prevDescriptor.deps, deps)

      const memoizedVal = depsHaveChanged
        ? valueFactory()
        : prevDescriptor.memoizedVal

      prevDescriptor.deps = deps
      prevDescriptor.memoizedVal = memoizedVal

      return prevDescriptor
    }
  )

  return memoizedVal
}
