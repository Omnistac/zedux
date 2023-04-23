import { Ecosystem } from '../classes/Ecosystem'
import { getEcosystem, internalStore } from '../store/index'
import { EcosystemConfig } from '../types/index'

export const createEcosystem = <
  Context extends Record<string, any> | undefined = any
>(
  config: EcosystemConfig<Context> = {}
) => {
  if (config?.id) {
    const ecosystem = getEcosystem(config.id)

    if (ecosystem) return ecosystem
  }

  const ecosystem = new Ecosystem<Context>(config)

  // yep. Set this here. We'll make sure no component can ever be updated
  // synchronously from this call (causing update-during-render react warnings)
  internalStore.setStateDeep({ [ecosystem.id]: ecosystem })

  return ecosystem
}
