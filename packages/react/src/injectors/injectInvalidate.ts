import { diContext } from '../utils/csContexts'

export const injectInvalidate = () => {
  const { instance } = diContext.consume()

  return () => instance.invalidate('injectInvalidate', 'Injector')
}
