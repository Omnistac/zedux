import { DEV } from '@zedux/core/utils/general'
import { ZeduxPlugin } from '.'
import { AnyAtomInstanceBase } from '..'
import { Cleanup, DependentEdge } from '../types'
import { Ecosystem } from './Ecosystem'

type GhostStatus = 'destroyed' | 'materialized' | 'transparent'

export class Ghost {
  private callbackBuffer?: Parameters<NonNullable<DependentEdge['callback']>>
  private status: GhostStatus = 'transparent'
  private originalCallback: DependentEdge['callback']

  constructor(
    private readonly ecosystem: Ecosystem,
    public readonly dependency: AnyAtomInstanceBase,
    public readonly dependent: string,
    public readonly edge: DependentEdge,
    private readonly cleanup: Cleanup
  ) {
    this.originalCallback = edge.callback

    // store the latest call; we'll forward it when this ghost materializes
    edge.callback = (...args) => (this.callbackBuffer = args)
  }

  destroy() {
    this.cleanup()
    this.status = 'destroyed'
  }

  materialize() {
    // ignore duplicate materialize calls
    if (this.status === 'materialized') return

    // do nothing if ghost has been destroyed
    if (this.status === 'destroyed') {
      if (DEV) {
        console.warn(
          "Zedux: Tried materializing ghost dependency after it was destroyed. This probably means a React fiber took a long time to commit. Consider increasing the ecosystem's ghostTtlMs"
        )
      }

      return
    }

    // remove ghost from destruction queue
    this.ecosystem._scheduler.unscheduleGhostCleanup(this)

    if (this.ecosystem.mods.edgeCreated) {
      this.ecosystem.modsMessageBus.dispatch(
        ZeduxPlugin.actions.edgeCreated({
          dependency: this.dependency,
          dependent: this.dependent,
          edge: this.edge,
        })
      )
    }

    // the edge is not a ghost anymore
    delete this.edge.isGhost
    this.edge.callback = this.originalCallback

    // some deps may have updated between ghost creation and materialization. Send the last call through the callback
    if (this.callbackBuffer) {
      this.edge.callback?.(...this.callbackBuffer)
    }

    this.status = 'materialized'
    return this.cleanup
  }
}
