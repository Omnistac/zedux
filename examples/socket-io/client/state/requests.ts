import { injectPromise, ion } from '@zedux/react'
import { socketControllerAtom } from './socket'
import { UnaryRequest } from '@/shared/api'

/**
 * An atom factory. Creates an atom that manages the state of a unary request
 */
const unaryRequestAtomFactory = <RequestType extends UnaryRequest>(
  eventName: RequestType['eventName']
) =>
  ion(
    `api/unary/${eventName}`,
    ({ getNode }, requestPayload: RequestType['requestPayload']) => {
      const socketControllerNode = getNode(socketControllerAtom)

      return injectPromise<RequestType['responsePayload']>(
        ({ controller }) =>
          socketControllerNode.exports.unaryRequest(eventName, requestPayload, {
            controller,
          }),
        [socketControllerNode],
        { runOnInvalidate: true }
      )
    }
  )

export const simpleUnaryRequestAtom = unaryRequestAtomFactory('simple-unary')
export const complexUnaryRequestAtom = unaryRequestAtomFactory('complex-unary')
