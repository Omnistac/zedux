import { Action, Actor, HierarchyConfig } from '@src/types'
import { detailedTypeof, isPlainObject } from './general'

const isProd = process.env.NODE_ENV === 'production'
const PREFIX = 'Zedux Error -'

// No worries! We are going to overhaul the whole error message system to be
// efficient and useful in both dev and prod environments. This is temporary:
const prodErr = () =>
  'Zedux is currently running in production mode. ' +
  'To see this error message, run Zedux in development mode.'

export const assert = (predicate: boolean, message: string, subject?: any) => {
  if (predicate) return

  let error = `Zedux Error - ${message}`

  if (subject) error += `. Received ${detailedTypeof(subject)}`

  throw new Error(error)
}

const subscriberEffects =
  'store.subscribe() - subscriber.effects must be a function'

const subscriberError =
  'store.subscribe() - subscriber.error must be a function'

const subscriberNext =
  'store.subscribe() expects either a function or an ' +
  +'object with a "next" property whose value is a function'

const errors = {
  subscriberEffects,
  subscriberError,
  subscriberNext,
}

export const getError = isProd
  ? prodErr
  : (name: keyof typeof errors) => errors[name]

export const assertAreFunctions = (args: any[], method: string) => {
  for (const arg of args) {
    if (typeof arg !== 'function') {
      throw new TypeError(invalidNonFunction(arg, method))
    }
  }
}

export function assertIsNullHierarchyDescriptorNode(node: any) {
  if (node == null) {
    return
  }

  throw new TypeError(invalidHierarchyDescriptorNode(node))
}

export function assertIsPlainObject(action: any, entityName: string) {
  if (!isPlainObject(action)) {
    throw new TypeError(invalidNonPlainObject(action, entityName))
  }
}

export function assertIsValidAction(action: any) {
  if (typeof action.type !== 'string') {
    throw new TypeError(invalidAction(action))
  }
}

export const assertIsValidActor = (actor: Actor, method: string) => {
  if (typeof actor === 'function' && typeof actor.type === 'string') {
    return
  }

  throw new TypeError(invalidActor(actor, method))
}

export function assertIsValidNodeOption(
  validOptions: HierarchyConfig,
  optionKey: keyof HierarchyConfig,
  optionValue: any
) {
  if (!validOptions[optionKey]) {
    throw new Error(invalidNodeOptionKey(optionKey))
  }

  assertAreFunctions([optionValue], 'store.configureHierarchy()')
}

export const invalidAccess = isProd
  ? prodErr
  : (method: string) =>
      `${PREFIX} ${method} - ` +
      'This method cannot be called within a reducer.'

export const invalidAction = isProd
  ? prodErr
  : (action: Action) =>
      `${PREFIX} store.dispatch() - ` +
      'Action must have a string "type" property. ' +
      `Received ${detailedTypeof(action.type)}.`

export const invalidActor = isProd
  ? prodErr
  : (actor: any, method?: string) => {
      const type =
        typeof actor === 'function'
          ? `function with invalid "type" property - ${typeof actor.type}`
          : typeof actor

      return (
        `${PREFIX} ${method} - ` +
        'Actor must be either a string or a function with a "type" property. ' +
        `Received ${type}`
      )
    }

export const invalidDelegation = isProd
  ? prodErr
  : (subStorePath: string[]) =>
      `${PREFIX} store.dispatch() - Invalid Delegation - ` +
      'Current store hierarchy does not contain a sub-store at path: ' +
      `${subStorePath.join(' -> ')}`

export const invalidHierarchyDescriptorNode = isProd
  ? prodErr
  : (node: any) =>
      `${PREFIX} store.use() - ` +
      'Hierarchy descriptor nodes must be reducers, stores, or plain objects. ' +
      `Received ${detailedTypeof(node)}`

export const invalidNodeOptionKey = isProd
  ? prodErr
  : (key: string) =>
      `${PREFIX} store.configureHierarchy() - ` +
      `Received invalid node option, "${key}". Valid options are: ` +
      '[ "clone", "create", "get", "isNode", "iterate", "set", "size" ]'

export const invalidNonFunction = isProd
  ? prodErr
  : (nonFunction: any, method?: string) =>
      `${PREFIX} ${method} - ` +
      'Expected argument to be a function. ' +
      `Received ${typeof nonFunction}`

export const invalidNonPlainObject = isProd
  ? prodErr
  : (action: any, entityName?: string) =>
      `${PREFIX} store.dispatch() - ` +
      `${entityName} must be a plain object. ` +
      `Received ${detailedTypeof(action)}`
