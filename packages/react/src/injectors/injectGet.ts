import { diContext } from '../utils/csContexts'

export const injectGet = () => {
  const { instance } = diContext.consume()

  const get: typeof instance._get = (...args: [any, any?]) =>
    instance._get(...args)

  return get
}
