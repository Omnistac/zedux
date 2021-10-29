import { diContext } from '../utils/csContexts'

/**
 * injectGet
 *
 * An injector that returns a function that can be used to get atom instance
 * values.
 *
 * The returned `get` function will register dynamic graph dependencies during
 * synchronous atom evaluation. If used asynchronously (e.g. in injectEffect),
 * it does not register a graph dependency; it simply returns the instance's
 * value.
 *
 * @returns A function that returns atom values
 */
export const injectGet = () => {
  const { instance } = diContext.consume()

  const get: typeof instance._get = (
    ...args: Parameters<typeof instance._get>
  ) => instance._get(...args)

  return get
}
