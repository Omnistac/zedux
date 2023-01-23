import {
  ActionFactoryActionType,
  ActionFactoryPayloadType,
  createStore,
  Store,
} from '@zedux/core'
import { Ecosystem } from './Ecosystem'
import { MaybeCleanup } from '../types'
import { pluginActions } from '../utils/plugin-actions'

type ValuesOf<Rec extends Record<any, any>> = Rec extends Record<any, infer T>
  ? T
  : never

export type Mod = keyof typeof pluginActions
export type ModAction = ActionFactoryActionType<ValuesOf<typeof pluginActions>>
export type ModPayloadMap = {
  [K in Mod]: ActionFactoryPayloadType<typeof pluginActions[K]>
}

export class ZeduxPlugin {
  /**
   * These actions should only be dispatched to an ecosystem's modBus
   * store, so they don't need prefixes
   */
  public static actions = pluginActions

  public modsStore: Store<Record<Mod, boolean>>
  public registerEcosystem: (ecosystem: Ecosystem) => MaybeCleanup

  constructor({
    initialMods = [],
    registerEcosystem,
  }: {
    initialMods?: Mod[]
    registerEcosystem?: (ecosystem: Ecosystem) => MaybeCleanup
  } = {}) {
    this.modsStore = createStore(
      null,
      initialMods.reduce((hash, mod) => {
        hash[mod] = true
        return hash
      }, {} as Record<Mod, boolean>)
    )

    this.registerEcosystem = registerEcosystem || (() => {})
  }
}
