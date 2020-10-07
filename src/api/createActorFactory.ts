import { createActor } from './createActor'

/**
  Wraps createActor(). Prefixes all created actors with the given namespace

  This will prefix all actors created with the returned createActor() function
  with the given namespace (joined by slashes - "/").

  Example:
    const createActor = createActorFactory('@todos')
    const addTodo = createActor<Todo>('add') // addTodo.type === '@todos/add'
*/
export const createActorFactory = (...namespaceNodes: string[]) => <
  Payload = undefined
>(
  actionType: string
) => {
  const namespacedActionType = [...namespaceNodes, actionType].join('/')

  return createActor<Payload>(namespacedActionType)
}
