import {
  api,
  As,
  type Cleanup,
  injectEffect,
  injectMemo,
  injectRef,
  injectSignal,
  ion,
} from '@zedux/react'
import { io, type Socket } from 'socket.io-client'
import { apiConfigAtom } from './config'
import {
  type BidiStreamMessage,
  type UnaryMessage,
  type UnaryRequest,
} from '@/shared/api'

export type ConnectionStatus = 'closed' | 'connected' | 'connecting' | 'error'

interface ConnectionState {
  /**
   * map request ids to the ISO timestamp when they were sent. Response streams
   * will remain in this record until unrequested. Unary requests will be
   * removed when the first response comes back matching the request id. Bidi
   * and request streams will store a single entry marking when we started
   * streaming that event.
   */
  // inFlightRequests: Record<string, string>

  resolvable: PromiseWithResolvers<null>

  socket: Socket

  status: ConnectionStatus
}

export const socketConnectionAtom = ion('socketConnection', ({ get }) => {
  const { wsUrl } = get(apiConfigAtom)
  const socket = injectMemo(() => io(wsUrl, { autoConnect: false }), [wsUrl])

  const signal = injectSignal(
    () =>
      ({
        // inFlightRequests: {},
        resolvable: Promise.withResolvers(),
        socket,
        status: 'connecting',
      } as ConnectionState),
    {
      events: {
        message: As<(UnaryMessage | BidiStreamMessage) & { eventName: string }>,
      },
    }
  )

  if (signal.get().socket !== socket) {
    // updating state during evaluation inside a condition like this is fine
    signal.mutate({ socket })
  }

  // listen to socket events and essentially synchronize the socket's internal
  // state with the local signal's state
  injectEffect(() => {
    socket.connect()

    socket.on('connect', () => {
      signal.mutate({ status: 'connected' })
      signal.get().resolvable.resolve(null)
    })

    socket.on('connect_error', () => {
      signal.mutate({ status: 'error' })
      signal.get().resolvable.reject(null)
    })

    socket.on('disconnect', () => {
      if (socket.active) {
        signal.mutate({ status: 'connecting' })
      } else {
        signal.mutate({ resolvable: Promise.withResolvers(), status: 'closed' })
      }
    })

    socket.onAny((eventName, payload) => {
      signal.send('message', { ...payload, eventName })
    })

    // close the socket if this atom is destroyed
    return () => {
      socket.close()
      signal.mutate({ status: 'closed' })
    }
  }, [socket])

  return api(signal).setPromise(signal.get().resolvable.promise)
})

export const socketControllerAtom = ion('socketController', ({ getNode }) => {
  const idCounterRef = injectRef(0)
  const socketConnectionNode = getNode(socketConnectionAtom)

  /**
   * The server can initialize its own requests. Those have a `server-` prefix.
   * Requests originating from the client get a `client-` prefix.
   */
  const makeId = (type: 'stream' | 'request') =>
    `client-${type}-${idCounterRef.current++}`

  // NOTE: if using JWT auth, you can attach the token to each request here
  const makeStreamMessage = (
    streamId: string,
    requestId: string,
    payload: unknown
  ) => ({ payload, requestId, streamId, timestamp: Date.now() })

  // NOTE: if using JWT auth, you can attach the token to each request here
  const makeUnaryMessage = (requestId: string, payload: unknown) => ({
    payload,
    requestId,
    timestamp: Date.now(),
  })

  const stream = async <RequestType extends UnaryRequest>(
    eventName: RequestType['eventName'],
    requestPayload: RequestType['requestPayload'],
    responseHandler: (response: RequestType['responsePayload']) => void
  ): Promise<Cleanup> => {
    // read the socketConnection's state inside the export to avoid closing over
    // stale values:
    const { resolvable, socket, status } = socketConnectionNode.get()

    if (status !== 'connected') {
      await resolvable.promise
    }

    const streamId = makeId('stream')
    const requestId = makeId('request')

    const cleanup = socketConnectionNode.on('message', message => {
      if ((message as BidiStreamMessage).streamId === streamId) {
        responseHandler(message.payload as RequestType['responsePayload'])
      }
    })

    socket.emit(
      eventName,
      makeStreamMessage(streamId, requestId, requestPayload)
    )

    return cleanup
  }

  /**
   * Send a one-off request over the socket and wait for a response matching the
   * request's id
   */
  const unaryRequest = async <RequestType extends UnaryRequest>(
    eventName: RequestType['eventName'],
    requestPayload: RequestType['requestPayload'],
    {
      controller,
      timeout = 10000,
    }: {
      controller?: AbortController
      timeout?: number
    } = {}
  ): Promise<RequestType['responsePayload']> => {
    // read the socketConnection's state inside the export to avoid closing over
    // stale values:
    const { resolvable, socket, status } = socketConnectionNode.get()

    if (status !== 'connected') {
      await resolvable.promise
    }

    const requestId = makeId('request')
    const { promise, reject, resolve } =
      Promise.withResolvers<RequestType['responsePayload']>()

    // Handle all these cases:
    // 1) request times out
    // 2) request is aborted before resolving or timing out
    // 3) request comes back successfully before timing out

    const cleanup = () => {
      reject(controller?.signal.reason) // does nothing if already resolved
      cleanupMessageListener()
      clearTimeout(timeoutId)
      controller?.signal.removeEventListener('abort', cleanup)
    }

    const timeoutId = setTimeout(cleanup, timeout) // case 1
    controller?.signal.addEventListener('abort', cleanup) // case 2

    const cleanupMessageListener = socketConnectionNode.on(
      'message',
      message => {
        if (message.requestId === requestId) {
          resolve(message.payload as RequestType['responsePayload']) // case 3
          cleanup()
        }
      }
    )

    // setup is done. Send the request
    socket.emit(eventName, makeUnaryMessage(requestId, requestPayload))

    return promise
  }

  // make socketConnection atom instance control this atom's state as well
  return api(socketConnectionNode).setExports({
    stream,
    unaryRequest,
  })
})
