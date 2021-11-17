import { DEV } from '@zedux/core/utils/general'
import { DependentEdge } from '../utils'
import { Ecosystem } from './Ecosystem'

export class Ghost {
  private callbackBuffer?: Parameters<NonNullable<DependentEdge['callback']>>
  private isDestroyed?: boolean
  private originalCallback: DependentEdge['callback']

  constructor(
    private readonly ecosystem: Ecosystem,
    public readonly edge: DependentEdge,
    private readonly cleanup: () => void
  ) {
    this.originalCallback = edge.callback

    // store the latest call; we'll forward it when this ghost materializes
    edge.callback = (...args) => (this.callbackBuffer = args)
  }

  destroy() {
    this.cleanup()
    this.isDestroyed = true
  }

  materialize() {
    // do nothing if ghost has been destroyed
    if (this.isDestroyed) {
      if (DEV) {
        console.warn(
          "Zedux - tried materializing ghost dependency after it was destroyed. This probably means a React fiber took a long time to commit. Consider increasing the ecosystem's ghostTtlMs"
        )
      }

      return
    }

    // remove ghost from destruction queue
    this.ecosystem._scheduler.unscheduleGhostCleanup(this)

    // the edge is not a ghost anymore
    delete this.edge.isGhost
    this.edge.callback = this.originalCallback

    // some deps may have updated between ghost creation and materialization. Send the last call through the callback
    if (this.callbackBuffer) {
      this.edge.callback?.(...this.callbackBuffer)
    }

    return this.cleanup
  }
}
