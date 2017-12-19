import { isPlainObject, detailedTypeof } from './general'


const isProd = process.env.NODE_ENV === 'production'
const PREFIX = 'Zedux Error -'
const prodErr = () => 'Zedux is currently running in production mode. '
  + 'To see this error message, try running Zedux in development mode.'


export function assertAreFunctions(args, method) {
  for (let i = 0; i < args.length; i++) {
    let arg = args[i]

    if (typeof arg !== 'function') {
      throw new TypeError(invalidNonFunction(arg, method))
    }
  }
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


export const invalidAccess = isProd ? prodErr : method =>
  `${PREFIX} ${method} - `
    + 'This method cannot be called within a reducer.'


export const invalidAction = isProd ? prodErr : action =>
  `${PREFIX} store.dispatch() - `
    + 'Action must have a string "type" property. '
    + `Received ${detailedTypeof(action.type)}.`


export const invalidActor = isProd ? prodErr : actor => {
  const type = typeof actor === 'function'
    ? `function with invalid "type" property - ${typeof actor.type}`
    : typeof actor

  return `${PREFIX} ZeduxReactor.to() - `
    + 'Actor must be either a string or a function with a "type" property. '
    + `Received ${type}`
}


export const invalidDelegation = isProd ? prodErr : subStorePath =>
  `${PREFIX} store.dispatch() - Invalid Delegation - `
    + 'Current store hierarchy does not contain a sub-store at path: '
    + `${subStorePath.join` -> `}`


export const invalidDispatch = isProd ? prodErr : () =>
  `${PREFIX} store.dispatch() - `
    + 'Store not yet configured; cannot dispatch action. '
    + '(Did you forget to pass your reactor hierarchy to "store.use()"?)'


export const invalidHierarchyDescriptorNode = isProd ? prodErr : node =>
  `${PREFIX} store.use() - `
    + 'Hierarchy descriptor nodes must be reducers, plain objects, or stores. '
    + `Received ${detailedTypeof(node)}`


export const invalidNodeOptionKey = isProd ? prodErr : key =>
  `${PREFIX} store.setNodeOptions() - `
    + `Received invalid node option, "${key}". Valid options are: `
    + '[ "clone", "create", "get", "set" ]'


export const invalidNonFunction = isProd ? prodErr : (nonFunction, method) =>
  `${PREFIX} ${method} - `
    + 'Expected argument to be a function. '
    + `Received ${typeof nonFunction}`


export const invalidNonPlainObject = isProd ? prodErr : (action, entityName) =>
  `${PREFIX} store.dispatch() - `
    + `${entityName} must be a plain object. `
    + `Received ${detailedTypeof(action)}`
