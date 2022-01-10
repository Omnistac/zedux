import { Ecosystem } from '../classes/Ecosystem'
import { EcosystemConfig } from '../types'

export const createEcosystem = <
  Context extends Record<string, any> | undefined = any
>(
  config: EcosystemConfig<Context> = {}
) => new Ecosystem<Context>(config)
