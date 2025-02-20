import { Ecosystem } from '../classes/Ecosystem'
import { EcosystemConfig } from '../types/index'
import { prefix } from '../utils/general'

let globalEcosystem: Ecosystem | undefined

export const createEcosystem = <
  Context extends Record<string, any> | undefined = any
>(
  config: EcosystemConfig<Context> = {}
) => new Ecosystem<Context>(config)

export const getGlobalEcosystem = () =>
  (globalEcosystem ??= createEcosystem({ id: `${prefix}/global` }))

export const setGlobalEcosystem = (ecosystem: Ecosystem) => {
  globalEcosystem = ecosystem
}
