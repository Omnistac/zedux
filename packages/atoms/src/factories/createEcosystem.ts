import { Ecosystem } from '../classes/Ecosystem'
import { EcosystemConfig } from '../types/index'
import { prefix } from '../utils/general'

let globalEcosystem: Ecosystem | undefined

export const createEcosystem = <
  Context extends Record<string, any> | undefined = any
>(
  config: EcosystemConfig<Context> = {}
) => new Ecosystem<Context>(config)

export const getDefaultEcosystem = () =>
  (globalEcosystem ??= createEcosystem({ id: `${prefix}/default` }))

export const setDefaultEcosystem = (ecosystem: Ecosystem) => {
  globalEcosystem = ecosystem
}
