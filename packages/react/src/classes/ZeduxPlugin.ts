import {
  ActionChain,
  ActorActionType,
  ActorPayloadType,
  createActor,
  createStore,
  Store,
} from '@zedux/core'
import { Ecosystem } from './Ecosystem'
import {
  ActiveState,
  AnyAtomInstanceBase,
  DependentEdge,
  EvaluationReason,
  MaybeCleanup,
} from '../types'
import { AtomSelectorCache } from '../utils'

type ValuesOf<Rec extends Record<any, any>> = Rec extends Record<any, infer T>
  ? T
  : never

export type Mod = keyof ZeduxPlugin['constructor']['actions']
export type ModAction = ActorActionType<
  ValuesOf<ZeduxPlugin['constructor']['actions']>
>
export type ModPayloadMap = {
  [K in Mod]: ActorPayloadType<ZeduxPlugin['constructor']['actions'][K]>
}

export class ZeduxPlugin {
  ['constructor']: typeof ZeduxPlugin

  /**
   * These actions should only be dispatched to an ecosystem's modsMessageBus
   * store, so they don't need prefixes
   */
  public static actions = {
    activeStateChanged: createActor<
      {
        instance: AnyAtomInstanceBase
        newActiveState: ActiveState
        oldActiveState: ActiveState
      },
      'activeStateChanged'
    >('activeStateChanged'),
    ecosystemDestroyed: createActor<
      { ecosystem: Ecosystem },
      'ecosystemDestroyed'
    >('ecosystemDestroyed'),
    ecosystemWiped: createActor<{ ecosystem: Ecosystem }, 'ecosystemWiped'>(
      'ecosystemWiped'
    ),
    edgeCreated: createActor<
      {
        dependency: AnyAtomInstanceBase
        // string if `edge.flags & EdgeFlag.External` or the atom instance
        // hasn't been created yet ('cause the edge was created while the
        // instance was initializing. TODO: maybe make it so atom instances can
        // be added to the ecosystem before being fully initialized):
        dependent: AnyAtomInstanceBase | string
        edge: DependentEdge
      },
      'edgeCreated'
    >('edgeCreated'),
    edgeRemoved: createActor<
      {
        dependency: AnyAtomInstanceBase | AtomSelectorCache<any, any[]>
        dependent: AnyAtomInstanceBase | AtomSelectorCache<any, any[]> | string // string if edge is External
        edge: DependentEdge
      },
      'edgeRemoved'
    >('edgeRemoved'),
    // either instance or selectorCache will always be defined, depending on the node type
    stateChanged: createActor<
      {
        action?: ActionChain
        instance?: AnyAtomInstanceBase
        newState: any
        oldState: any
        reasons: EvaluationReason[]
        selectorCache?: AtomSelectorCache
      },
      'stateChanged'
    >('stateChanged'),
  }

  public modsStore: Store<Record<Mod, boolean>>
  public registerEcosystem: (ecosystem: Ecosystem) => MaybeCleanup

  constructor({
    // sure, default to All The Mods
    initialMods = Object.keys(ZeduxPlugin.actions) as Mod[],
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
    this.constructor = undefined as any // bleh

    this.registerEcosystem = registerEcosystem || (() => {})
  }
}
