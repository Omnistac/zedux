import type { Ecosystem } from '../classes/Ecosystem'
import type { ZeduxNode } from '../classes/ZeduxNode'
import {
  CatchAllListener,
  EcosystemEvent,
  EcosystemEvents,
  InternalEvaluationReason,
  ListenableEvents,
  ListenerConfig,
  SingleEventListener,
} from '../types/index'
import { CATCH_ALL, ERROR, EventSent, makeReasonReadable } from './general'

export const isListeningTo = (
  ecosystem: Ecosystem,
  eventName: keyof EcosystemEvents
) => ecosystem.C[CATCH_ALL] || ecosystem.C[eventName]

export const sendEcosystemEvent = (
  ecosystem: Ecosystem,
  event: EcosystemEvent
) => {
  if (ecosystem.C[CATCH_ALL] || ecosystem.C[event.type]) {
    for (const listener of ecosystem.L) {
      listener({ f: { [event.type]: event } })
    }
  }
}

export const sendEcosystemErrorEvent = (source: ZeduxNode, error: unknown) => {
  sendEcosystemEvent(source.e, {
    error:
      error instanceof Error
        ? error
        : new Error(error?.toString?.() || 'unknown error'),
    source: source,
    type: ERROR,
  })
}

export const sendImplicitEcosystemEvent = (
  ecosystem: Ecosystem,
  reason: InternalEvaluationReason
) => {
  if (shouldScheduleImplicit(ecosystem, reason)) {
    for (const listener of ecosystem.L) {
      listener(reason)
    }
  }
}

export const shouldScheduleImplicit = (
  node: { C: Record<string, number> },
  reason: InternalEvaluationReason
) => {
  reason.f || (reason.t !== EventSent && makeReasonReadable(reason))

  return (
    node.C[CATCH_ALL] ||
    Object.keys(reason.f ?? reason.e ?? {}).some(key => node.C[key])
  )
}

export const parseOnArgs = (
  eventNameOrCallback: PropertyKey | ((eventMap: any) => void),
  callbackOrConfig?: SingleEventListener<any, any> | ListenerConfig,
  maybeConfig?: ListenerConfig
) => {
  const isSingleListener = typeof eventNameOrCallback === 'string'
  const eventName = isSingleListener ? eventNameOrCallback : ''

  const callback = isSingleListener
    ? (callbackOrConfig as SingleEventListener<any, any>)
    : (eventNameOrCallback as CatchAllListener<any>)

  const { active } = ((isSingleListener ? maybeConfig : callbackOrConfig) ||
    {}) as ListenerConfig

  const notify = (reason: InternalEvaluationReason) => {
    const eventMap = (reason.f || reason.e || {}) as Partial<
      ListenableEvents<any>
    >

    try {
      // if it's a single event listener and the event isn't in the map, ignore
      eventName in eventMap
        ? callback(eventMap[eventName] as any, eventMap)
        : isSingleListener || (callback as CatchAllListener<any>)(eventMap)
    } catch (err) {
      console.error('Zedux: Error while running event listener:', err)

      // we shouldn't need to re-throw these
    }
  }

  return [active, eventName, notify] as const
}
