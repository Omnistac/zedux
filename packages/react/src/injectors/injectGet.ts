import { AtomBase } from '../classes'
import { diContext } from '../utils/csContexts'

export const injectGet = () => {
  const { instance } = diContext.consume()

  const get: typeof instance._get = (
    ...args: [AtomBase<any, any, any>, any?, boolean?]
  ) => instance._get(...args)

  return get
}
