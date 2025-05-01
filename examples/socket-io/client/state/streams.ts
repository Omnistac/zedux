import {
  api,
  As,
  Cleanup,
  injectEffect,
  injectRef,
  injectSelf,
  injectSignal,
  ion,
} from '@zedux/react'
import { socketControllerAtom } from './socket'
import { SimpleBidiStreamDef } from '@/shared/api'

export const simpleBidiStreamAtom = ion(
  'api/bidi/simpleBidi',
  ({ getNode }) => {
    const { stream } = getNode(socketControllerAtom).exports
    const signal = injectSignal([] as string[], {
      events: {
        message: As<string>,
      },
    })

    const emitRef =
      injectRef<(payload: SimpleBidiStreamDef['clientPayload']) => void>()

    // since the `injectEffect` has no deps, this promise will only be set once
    // for the lifetime of this atom instance
    const promiseRef = injectRef<ReturnType<typeof stream>>()

    // kick off the stream as soon as this atom mounts
    injectEffect(
      () => {
        let cleanup: Cleanup
        promiseRef.current = stream('simple-bidi-stream', {}, message => {
          signal.mutate(
            state => {
              state.push(message)
            },
            // also send the message as an event so listeners can handle it
            // directly rather than relying on the typical reactive state flow.
            // This may be a necessary escape hatch in extreme situations. For
            // example, we use this to update ag grid rows directly for our
            // heaviest data grids. It's brittle though; avoid if possible.
            { message }
          )
        })

        // no need to handle promise rejection here. Since this atom is made _the_
        // promise for this atom (via `.setPromise` below), Zedux handles
        // rejection
        promiseRef.current.then(result => {
          cleanup = result.cleanup
          emitRef.current = result.emit
        })

        return () => cleanup?.()
      },
      [],
      // use `synchronous: true` so the promise is defined immediately
      { synchronous: true }
    )

    const self = injectSelf()

    return api(signal)
      .setExports({
        emit: async (message: SimpleBidiStreamDef['clientPayload']) => {
          // could also just check if `emitRef.current` here:
          if (self.promiseStatus !== 'success') {
            await promiseRef.current
          }

          emitRef.current?.(message)
        },
      })
      .setPromise(promiseRef.current)
  }
)
