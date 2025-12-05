import { AtomTemplateBase, injectSelf, NodeOf } from '@zedux/atoms'
import { Context } from 'react'

/**
 * Retrieves a contextual value from a provided scope.
 *
 * Any atom that calls this becomes "scoped". Its id will change to reflect the
 * retrieved context and it can only be accessed in a scoped context - either
 * from React hooks or in an `ecosystem.withScope` call.
 *
 * Any atom that uses a scoped atom is also scoped, inheriting the scope
 * dependency of the scoped atom.
 *
 * An atom and all transitive dependencies it creates can access the provided
 * scope.
 *
 * - When created from React hooks, `inject` can access provided React context
 *   values or atom instances.
 * - When created in an `ecosystem.withScope` callback, `inject` can access the
 *   provided scope values.
 *
 * NOTE: `inject` is currently an injector. But it doesn't have to be. We may
 * update this to work with selectors too. In that case, this will become a
 * "utility" function, not an injector. This is similar to React's `use` utility
 * which isn't a hook.
 */
export const inject = <T extends Context<any> | AtomTemplateBase>(
  context: T
): T extends Context<infer V>
  ? V
  : T extends AtomTemplateBase
  ? NodeOf<T>
  : never => {
  const instance = injectSelf()
  instance.V ??= new Map()
  const prevValue = instance.V.get(context)

  const resolvedPrevValue =
    prevValue?.constructor?.name === WeakRef.name
      ? (prevValue as WeakRef<any>).deref()
      : prevValue

  // if there's a cached context value, it's the value cached previously (we
  // create a new instance if a scoped atom is accessed in a scoped context
  // with different context values)
  if (typeof resolvedPrevValue !== 'undefined') return resolvedPrevValue

  if (!instance.e.S) {
    throw new Error(
      `Scoped atom was used outside a scoped context. This atom needs to be used by a React component or inside \`ecosystem.withScope\``
    )
  }

  // This atom is initializing in a scoped context (e.g. a React hook or
  // `ecosystem.withScope` call). Get the provided value
  const value = instance.e.S(instance.e, context)

  if (typeof value === 'undefined') {
    throw new Error(
      `Value was not provided to scoped atom. See attached cause`,
      {
        cause: context,
      }
    )
  }

  // use a WeakRef if possible
  let weakValue

  try {
    weakValue = new WeakRef(value)
  } catch (err) {
    weakValue = value
  }

  instance.V.set(context, weakValue)

  return value
}
