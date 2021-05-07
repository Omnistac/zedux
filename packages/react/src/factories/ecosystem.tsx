import { Ecosystem } from '../classes/Ecosystem'
import { EcosystemConfig } from '../types'

export const ecosystem = (config: EcosystemConfig) => new Ecosystem(config)
