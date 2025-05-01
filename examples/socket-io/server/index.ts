import { Server, Socket } from 'socket.io'
import {
  BidiStream,
  BidiStreamMessage,
  SimpleBidiStreamDef,
  SimpleUnaryDef,
  UnaryMessage,
  UnaryRequest,
} from '@/shared/api'

const io = new Server(5174, {})

const handleBidi = <StreamType extends BidiStream>(
  socket: Socket,
  eventName: StreamType['eventName'],
  onMessage: (payload: BidiStreamMessage<StreamType['clientPayload']>) => void,
  onInit?: (payload: BidiStreamMessage<StreamType['initialPayload']>) => void
) => {
  let initialized = false

  socket.on(eventName, ((
    payload:
      | BidiStreamMessage<StreamType['initialPayload']>
      | BidiStreamMessage<StreamType['clientPayload']>,
    ack: () => void
  ) => {
    if (initialized) {
      onMessage(payload as BidiStreamMessage<StreamType['clientPayload']>)
    } else {
      initialized = true
      onInit?.(payload)
      ack()
    }
  }) as any)
}

const handleUnary = <RequestType extends UnaryRequest>(
  socket: Socket,
  eventName: RequestType['eventName'],
  onRequest: (payload: UnaryMessage<RequestType['requestPayload']>) => void
) => {
  socket.on(eventName, ((
    payload: UnaryMessage<RequestType['requestPayload']>
  ) => {
    onRequest(payload)
  }) as any)
}

const makeUnaryMessage = (
  requestId: string,
  payload: unknown
): UnaryMessage => ({
  payload,
  requestId,
  timestamp: Date.now(),
})

const makeBidiMessage = (
  requestId: string,
  streamId: string,
  payload: unknown
): BidiStreamMessage => ({
  payload,
  requestId,
  streamId,
  timestamp: Date.now(),
})

io.on('connection', socket => {
  console.log('got connection!')

  handleUnary(socket, 'simple-unary', ({ payload, requestId }) => {
    console.log('got simple-unary message', payload)

    socket.emit(
      'simple-unary' satisfies SimpleUnaryDef['eventName'],
      makeUnaryMessage(
        requestId,
        `Hello from the server, ${payload}!` satisfies SimpleUnaryDef['responsePayload']
      )
    )
  })

  handleBidi(
    socket,
    'simple-bidi-stream',
    ({ payload, requestId, streamId }) => {
      console.log('got simple-bidi-stream message', payload)

      socket.emit(
        'simple-bidi-stream' satisfies SimpleBidiStreamDef['eventName'],
        makeBidiMessage(
          requestId,
          streamId,
          `${payload} message 1` satisfies SimpleBidiStreamDef['serverPayload']
        )
      )

      socket.emit(
        'simple-bidi-stream' satisfies SimpleBidiStreamDef['eventName'],
        makeBidiMessage(
          requestId,
          streamId,
          `${payload} message 2` satisfies SimpleBidiStreamDef['serverPayload']
        )
      )
    }
  )
})
