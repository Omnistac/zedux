import { getEcosystem } from '../store/public-api'
import { diContext } from '../utils/csContexts'

export const injectEcosystem = () => {
  const { ecosystemId } = diContext.consume()

  return getEcosystem(ecosystemId)
}
