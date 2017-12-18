import { isPlainObject, detailedTypeof } from './general'


const PREFIX = 'Zedux Error -'


export function assertAreFunctions(args, method) {
  for (let i = 0; i < args.length; i++) {
    let arg = args[i]

    if (typeof arg !== 'function') {
      throw new TypeError(invalidNonFunction(arg, method))
    }
  }
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


export function assertIsValidActor(actor) {
  if (
    typeof actor === 'function'
    && actor.type
  ) {
    return
  }

  throw new TypeError(invalidActor(actor))
}


export function assertIsValidNodeOption(validOptions, optionKey, optionValue) {
  if (!validOptions[optionKey]) {
    throw new Error(invalidNodeOptionKey(optionKey))
  }

  assertAreFunctions([ optionValue ], 'store.setNodeOptions()')
}


export function assertStoreIsConfigured(rootReactor) {
  if (!rootReactor) {
    throw new Error(invalidDispatch())
  }
}


export function invalidAccess(method) {
  return `${PREFIX} ${method}
    This method cannot be called within a reducer.`
}


export function invalidAction(action) {
  return `${PREFIX} store.dispatch()
    Action must have a string "type" property.
    Received ${detailedTypeof(action.type)}.`
}


export function invalidActor(actor) {
  const type = typeof actor === 'function'
    ? `function with invalid "type" property - ${typeof actor.type}`
    : typeof actor

  return `${PREFIX} ZeduxReactor.to()
    Actor must be either a string or a function with a "type" property.
    Received ${type}`
}


export function invalidDelegation(subStorePath) {
  return `${PREFIX} store.dispatch() - Invalid Delegation
    Current store hierarchy does not contain a sub-store at path:
    ${subStorePath.join` -> `}`
}


export function invalidDispatch() {
  return `${PREFIX} store.dispatch()
    Store not yet configured; cannot dispatch action.
    (Did you forget to pass your reactor hierarchy to "store.use()"?)`
}


export function invalidNode(node) {
  return `${PREFIX} store.use()
    Nodes must be functions (reducers), plain objects, or other stores.
    Received ${detailedTypeof(node)}`
}


export function invalidNodeOptionKey(key) {
  return `${PREFIX} store.setNodeOptions()
    Received invalid node option, "${key}". Valid options are:
    [ "clone", "create", "get", "set" ]`
}


export function invalidNonFunction(nonFunction, method) {
  return `${PREFIX} ${method}
    Expected argument to be a function.
    Received ${typeof nonFunction}`
}


export function invalidNonPlainObject(action, entityName) {
  return `${PREFIX} store.dispatch()
    ${entityName} must be a plain object.
    Received ${detailedTypeof(action)}`
}
