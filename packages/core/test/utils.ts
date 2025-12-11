import { Store } from '@zedux/core'
import { runInNewContext } from 'node:vm'

export const createMockReducer = (state: any) => jest.fn(() => state)

export const createMockStore = () =>
  ({
    dispatch: jest.fn(),
    $$typeof: Symbol.for('zedux.store'),
  } as unknown as Store)

export const dispatchables = [
  { type: 'a' },
  Object.create(Object.prototype, { type: { value: 'a' } }),
  runInNewContext('placeholder = { type: "a" }'),
]

export const getStoreBase = (store: Store) => ({
  dispatch: store.dispatch,
  getState: store.getState,
  setState: store.setState,
})

export const nonDispatchables = [
  undefined,
  null,
  'a',
  1,
  [],
  new Map(),
  Object.create(null),
  () => 'a',
]

export const nonFunctions = nonDispatchables.filter(
  thing => typeof thing !== 'function'
)

export const nonPlainObjects = [
  undefined,
  null,
  'a',
  1,
  [],
  () => {},
  new Map(),
  Object.create(null),
]

export const nullNodes: any[] = [undefined, null]

export const plainObjects = [
  {},
  Object.create(Object.prototype),
  runInNewContext('placeholder = {}'),
]

/**
 * Runs the passed callback twice - with dev mode disabled and enabled. Pass
 * `true` as the second param to only run the callback in prod mode.
 */
export const toggleDevMode = (callback: () => void, prodOnly?: boolean) => {
  ;(globalThis as any).DEV = false
  callback()
  ;(globalThis as any).DEV = true

  if (!prodOnly) callback()
}
