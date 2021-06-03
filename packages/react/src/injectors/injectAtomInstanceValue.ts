import { AtomInstanceBase } from '../classes'
import { InjectorDescriptor, InjectorType, split } from '../utils'

const operation = 'injectAtomInstanceValue'

export const injectAtomInstanceValue = <
  AI extends AtomInstanceBase<any, any, any>
>(
  instance: AI
) => {
  split<InjectorDescriptor>(operation, InjectorType.Value, ({ instance }) => {
    const edge = instance.ecosystem._graph.addDependency(
      instance.keyHash,
      instance.keyHash,
      operation,
      false
    )

    const cleanup = () => {
      instance.ecosystem._graph.removeDependency(
        instance.keyHash,
        instance.keyHash,
        edge
      )
    }

    return {
      cleanup,
      type: InjectorType.Value,
    }
  })

  return instance._stateStore.getState()
}
