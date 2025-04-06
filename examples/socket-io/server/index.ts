import { Server, Socket } from 'socket.io'
import { SimpleUnaryDef, UnaryMessage, UnaryRequest } from '@/shared/api'

const io = new Server(5174, {})

const handleUnary = <RequestType extends UnaryRequest>(
  socket: Socket,
  eventName: RequestType['eventName'],
  callback: (payload: UnaryMessage<RequestType['requestPayload']>) => void
) => {
  socket.on(eventName, ((
    payload: UnaryMessage<RequestType['requestPayload']>
  ) => {
    callback(payload)
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

io.on('connection', socket => {
  console.log('got connection!')

  handleUnary(socket, 'simple-unary', ({ payload, requestId }) => {
    console.log('got message', payload)

    socket.emit(
      'simple-unary' satisfies SimpleUnaryDef['eventName'],
      makeUnaryMessage(requestId, `Hello from the server, ${payload}!`)
    )
  })
})
