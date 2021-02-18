import { Action, Actor, HierarchyConfig, MachineState } from '../types'
import { detailedTypeof, isPlainObject } from './general'

const PREFIX = 'Zedux Error -'

export const assert = (predicate: boolean, message: string, subject?: any) => {
  if (predicate) return

  let error = `${PREFIX} ${message}`

  if (subject) error += `. Received ${detailedTypeof(subject)}`

  throw new Error(error)
}

const subscriberEffects =
  'store.subscribe() - subscriber.effects must be a function'

const subscriberError =
  'store.subscribe() - subscriber.error must be a function'

const subscriberNext =
  'store.subscribe() expects either a function or an ' +
  'object with a "next" property whose value is a function'

const errors = {
  subscriberEffects,
  subscriberError,
  subscriberNext,
}

export const getError = (name: keyof typeof errors) => errors[name]

export const assertAreFunctions = (args: any[], method: string) => {
  for (const arg of args) {
    if (typeof arg !== 'function') {
      throw new TypeError(invalidNonFunction(arg, method))
    }
  }
}

export const assertIsNullHierarchyDescriptorNode = (node: any) => {
  if (node == null) {
    return
  }

  throw new TypeError(invalidHierarchyDescriptorNode(node))
}

export const assertIsPlainObject = (action: any, entityName: string) => {
  if (!isPlainObject(action)) {
    throw new TypeError(invalidNonPlainObject(action, entityName))
  }
}

export const assertIsValidAction = (action: any) => {
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

export const assertIsValidNodeOption = (
  validOptions: HierarchyConfig,
  optionKey: keyof HierarchyConfig,
  optionValue: any
) => {
  if (!validOptions[optionKey]) {
    throw new Error(invalidNodeOptionKey(optionKey))
  }

  assertAreFunctions([optionValue], 'store.configureHierarchy()')
}

export const assertIsValidState = (state: MachineState) => {
  if (state && typeof state === 'object' && typeof state.type === 'string') {
    return
  }

  throw new TypeError(invalidState(state))
}

export const invalidAccess = (method: string) =>
  `${PREFIX} ${method} - ` + 'This method cannot be called within a reducer.'

export const invalidAction = (action: Action) =>
  `${PREFIX} store.dispatch() - ` +
  'Action must have a string "type" property. ' +
  `Received ${detailedTypeof(action.type)}.`

export const invalidActor = (actor: any, method?: string) => {
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

export const invalidState = (state: any) => {
  const type = typeof state

  return `${PREFIX} - state.on() - Target state must be either a string or MachineState object. Received ${type}`
}

export const invalidDelegation = (subStorePath: string[]) =>
  `${PREFIX} store.dispatch() - Invalid Delegation - ` +
  'Current store hierarchy does not contain a sub-store at path: ' +
  `${subStorePath.join(' -> ')}`

export const invalidHierarchyDescriptorNode = (node: any) =>
  `${PREFIX} store.use() - ` +
  'Hierarchy descriptor nodes must be reducers, stores, or plain objects. ' +
  `Received ${detailedTypeof(node)}`

export const invalidNodeOptionKey = (key: string) =>
  `${PREFIX} store.configureHierarchy() - ` +
  `Received invalid node option, "${key}". Valid options are: ` +
  '[ "clone", "create", "get", "isNode", "iterate", "set", "size" ]'

export const invalidNonFunction = (nonFunction: any, method?: string) =>
  `${PREFIX} ${method} - ` +
  'Expected argument to be a function. ' +
  `Received ${typeof nonFunction}`

export const invalidNonPlainObject = (action: any, entityName?: string) =>
  `${PREFIX} store.dispatch() - ` +
  `${entityName} must be a plain object. ` +
  `Received ${detailedTypeof(action)}`
