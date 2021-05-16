import { diContext } from '../utils/csContexts'

export const injectEcosystem = () => {
  const { instance } = diContext.consume()

  return instance.ecosystem
}
