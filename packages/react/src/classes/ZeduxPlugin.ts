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
import { Ghost } from './Ghost'

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
        // string if `edge.isExternal` or the atom instance hasn't been created
        // yet ('cause the edge was created while the instance was initializing.
        // TODO: maybe make it so atom instances can be added to the ecosystem
        // before being fully initialized):
        dependent: AnyAtomInstanceBase | string
        edge: DependentEdge // external means a ghost edge materialized
      },
      'edgeCreated'
    >('edgeCreated'),
    edgeRemoved: createActor<
      {
        dependency: AnyAtomInstanceBase
        dependent: AnyAtomInstanceBase | string // string if `edge.isExternal`
        edge: DependentEdge
      },
      'edgeRemoved'
    >('edgeRemoved'),
    ghostEdgeCreated: createActor<{ ghost: Ghost }, 'ghostEdgeCreated'>(
      'ghostEdgeCreated'
    ),
    ghostEdgeDestroyed: createActor<{ ghost: Ghost }, 'ghostEdgeDestroyed'>(
      'ghostEdgeDestroyed'
    ),
    instanceActiveStateChanged: createActor<
      {
        instance: AnyAtomInstanceBase
        newActiveState: ActiveState
        oldActiveState: ActiveState
      },
      'instanceActiveStateChanged'
    >('instanceActiveStateChanged'),
    instanceStateChanged: createActor<
      {
        action: ActionChain
        instance: AnyAtomInstanceBase
        newState: any
        oldState: any
        reasons: EvaluationReason[]
      },
      'instanceStateChanged'
    >('instanceStateChanged'),
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

    this.registerEcosystem = registerEcosystem || (() => {})
  }
}
