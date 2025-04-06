import { None, Prettify } from '@zedux/react'

/**
 * Basic request/response breakdown from the client's perspective:
 *
 * unary:
 *
 * - send { requestId, timestamp, payload } on eventName
 * - receive { requestId, timestamp, payload } on eventName (requestId matches initial client-sent requestId)
 *
 * client streaming
 *
 * - send { requestId, timestamp, payload } on eventName (new requestId for each message)
 *
 * server streaming:
 *
 * - send ONE { requestId, streamId, timestamp, initialPayload } on eventName to start
 * - receive { requestId, streamId, timestamp, serverPayload } on eventName (streamId matches initial client-sent streamId)
 *
 * bidirectional streaming:
 *
 * - send ONE { requestId, streamId, timestamp, initialPayload } on eventName to start
 * - send { requestId, streamId, timestamp, clientPayload } on eventName (streamId matches initial client-sent streamId)
 * - receive { requestId, messageId, timestamp, serverPayload } on eventName (streamId matches initial client-sent streamId)
 */

// Some Type Helpers

export interface UnaryMessage<Payload = unknown> {
  requestId: string
  timestamp: number
  payload: Payload
}

export type ClientStreamMessage = UnaryMessage

export interface ServerStreamMessage extends UnaryMessage {
  streamId: string
}

export type BidiStreamMessage = ServerStreamMessage

export type UnaryDef<
  EventName extends string,
  RequestPayload,
  ResponsePayload
> = Prettify<{
  eventName: EventName
  requestPayload: RequestPayload
  responsePayload: ResponsePayload
}>

export type ClientStreamDef<
  EventName extends string,
  RequestPayload
> = Prettify<{
  eventName: EventName
  requestPayload: RequestPayload
}>

export type ServerStreamDef<
  EventName extends string,
  InitialPayload,
  ResponsePayload
> = Prettify<{
  eventName: EventName
  initialPayload: InitialPayload
  serverPayload: ResponsePayload
}>

export type BidiStreamDef<
  EventName extends string,
  InitialPayload,
  ClientPayload,
  ResponsePayload
> = Prettify<{
  eventName: EventName
  initialPayload: InitialPayload
  clientPayload: ClientPayload
  serverPayload: ResponsePayload
}>

// Unary Requests

export type SimpleUnaryDef = UnaryDef<'simple-unary', string, string>
export type ComplexUnaryDef = UnaryDef<'complex-unary', string, string>

export type UnaryRequest = SimpleUnaryDef | ComplexUnaryDef

// Client Streams

export type SimpleClientStreamDef = ClientStreamDef<
  'simple-client-stream',
  string
>
export type ComplexClientStreamDef = ClientStreamDef<
  'complex-client-stream',
  string
>

export type ClientStream = SimpleClientStreamDef | ComplexClientStreamDef

// Server Streams

export type SimpleServerStreamDef = ServerStreamDef<
  'simple-server-stream',
  None,
  string
>

export type ComplexServerStreamDef = ServerStreamDef<
  'complex-server-stream',
  string,
  string
>

export type ServerStream = SimpleServerStreamDef | ComplexServerStreamDef

// Bidi Streams

export type SimpleBidiStreamDef = BidiStreamDef<
  'simple-client-stream',
  None,
  string,
  string
>

export type ComplexBidiStreamDef = BidiStreamDef<
  'complex-client-stream',
  string,
  string,
  string
>

export type BidiStream = SimpleBidiStreamDef | ComplexBidiStreamDef
