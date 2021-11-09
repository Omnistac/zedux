import { diContext } from '../utils/csContexts'

/**
 * injectSelect
 *
 * An injector that returns a function that can be used to select atom instance
 * values. The returned function can also be used to run AtomSelectors.
 *
 * The returned `select` function will register dynamic graph dependencies during
 * synchronous atom evaluation. If used asynchronously (e.g. in injectEffect),
 * it does not register a graph dependency; it simply returns the instance's
 * value.
 *
 * @returns A function that returns atom values
 */
export const injectSelect = () => {
  const { instance } = diContext.consume()

  const select: typeof instance._select = ((
    ...args: Parameters<typeof instance._select>
  ) => instance._select(...args)) as any

  return select
}
