import { isPlainObject, detailedTypeof } from './general'

const isProd = process.env.NODE_ENV === 'production'
const PREFIX = 'Zedux Error -'
const UNSET = 'UNSET'
const prodErr = () => 'Zedux is currently running in production mode. '
  + 'To see this error message, run Zedux in development mode.'

export const assert = (predicate, message, subject = UNSET) => {
  if (predicate) return

  let error = `Zedux Error - ${message}`

  if (subject !== UNSET) error += `. Received ${detailedTypeof(subject)}`

  throw new Error(error)
}

const invalidEffects = 'reactor.effects() must return an array'

const subscriberEffects = 'store.subscribe() - subscriber.effects must '
  + 'be a function'

const subscriberError = 'store.subscribe() - subscriber.error must be a '
  + 'function'

const subscriberNext = 'store.subscribe() expects either a function or an '
  + 'object with a "next" property whose value is a function'

const errors = {
  invalidEffects,
  subscriberEffects,
  subscriberError,
  subscriberNext
}

export const getError = isProd ? prodErr : name => errors[name]


export function assertAreFunctions(args, method) {
  for (let i = 0; i < args.length; i++) {
    let arg = args[i]

    if (typeof arg !== 'function') {
      throw new TypeError(invalidNonFunction(arg, method))
    }
  }
}


export const assertAreValidEffects = effects => {
  assert(Array.isArray(effects), getError('invalidEffects'), effects)
}


export function assertIsNullHierarchyDescriptorNode(node) {
  if (node === null || typeof node === 'undefined') {
    return
  }

  throw new TypeError(invalidHierarchyDescriptorNode(node))
}


export function assertIsPlainObject(action, entityName) {
  if (!isPlainObject(action)) {
    throw new TypeError(invalidNonPlainObject(action, entityName))
  }
}


export function assertIsValidAction(action) {
  if (typeof action.type !== 'string') {
    throw new TypeError(invalidAction(action))
  }
}


export function assertIsValidActor(actor, method) {
  if (
    typeof actor === 'function'
    && typeof actor.type === 'string'
  ) {
    return
  }

  throw new TypeError(invalidActor(actor, method))
}


export function assertIsValidNodeOption(validOptions, optionKey, optionValue) {
  if (!validOptions[optionKey]) {
    throw new Error(invalidNodeOptionKey(optionKey))
  }

  assertAreFunctions([ optionValue ], 'store.setNodeOptions()')
}


export const invalidAccess = isProd ? prodErr : method =>
  `${PREFIX} ${method} - `
    + 'This method cannot be called within a reducer.'


export const invalidAction = isProd ? prodErr : action =>
  `${PREFIX} store.dispatch() - `
    + 'Action must have a string "type" property. '
    + `Received ${detailedTypeof(action.type)}.`


export const invalidActor = isProd ? prodErr : (actor, method) => {
  const type = typeof actor === 'function'
    ? `function with invalid "type" property - ${typeof actor.type}`
    : typeof actor

  return `${PREFIX} ${method} - `
    + 'Actor must be either a string or a function with a "type" property. '
    + `Received ${type}`
}


export const invalidDelegation = isProd ? prodErr : subStorePath =>
  `${PREFIX} store.dispatch() - Invalid Delegation - `
    + 'Current store hierarchy does not contain a sub-store at path: '
    + `${subStorePath.join` -> `}`


export const invalidHierarchyDescriptorNode = isProd ? prodErr : node =>
  `${PREFIX} store.use() - `
    + 'Hierarchy descriptor nodes must be reducers, stores, or plain objects. '
    + `Received ${detailedTypeof(node)}`


export const invalidNodeOptionKey = isProd ? prodErr : key =>
  `${PREFIX} store.setNodeOptions() - `
    + `Received invalid node option, "${key}". Valid options are: `
    + '[ "clone", "create", "get", "isNode", "iterate", "set", "size" ]'


export const invalidNonFunction = isProd ? prodErr : (nonFunction, method) =>
  `${PREFIX} ${method} - `
    + 'Expected argument to be a function. '
    + `Received ${typeof nonFunction}`


export const invalidNonPlainObject = isProd ? prodErr : (action, entityName) =>
  `${PREFIX} store.dispatch() - `
    + `${entityName} must be a plain object. `
    + `Received ${detailedTypeof(action)}`
