import { Ecosystem } from '../classes/Ecosystem'
import { addEcosystem, globalStore } from '../store'
import { getEcosystem } from '../store/public-api'
import { EcosystemConfig } from '../types'

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

  // yep. Dispatch this here. We'll make sure no component can ever be updated
  // synchronously from this call (causing update-during-render react warnings)
  globalStore.dispatch(addEcosystem(ecosystem))

  return ecosystem
}
