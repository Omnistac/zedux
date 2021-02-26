import { haveDepsChanged, validateInjector } from '../utils'
import { diContext } from '../utils/csContexts'
import { InjectorType, MemoInjectorDescriptor } from '../utils/types'

export const injectMemo = <State = any>(factory: () => State, deps?: any[]) => {
  const context = diContext.consume()

  const prevDescriptor = validateInjector<MemoInjectorDescriptor<State>>(
    'injectMemo',
    InjectorType.Memo,
    context
  )

  const depsHaveChanged = haveDepsChanged(prevDescriptor?.deps, deps)

  const memoizedVal = depsHaveChanged ? factory() : prevDescriptor.memoizedVal

  const descriptor: MemoInjectorDescriptor<State> = {
    deps,
    memoizedVal,
    type: InjectorType.Memo,
  }

  context.injectors.push(descriptor)

  return memoizedVal
}
