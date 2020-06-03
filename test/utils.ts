import { Store } from '@src/types'
import { runInNewContext } from 'vm'

export const createMockReducer = (state: any) => jest.fn(() => state)

export const createMockStore = () =>
  (({
    dispatch: jest.fn(),
    $$typeof: Symbol.for('zedux.store'),
  } as unknown) as Store)

export const dispatchables = [
  { type: 'a' },
  Object.create(Object.prototype, { type: { value: 'a' } }),
  runInNewContext('placeholder = { type: "a" }'),
]

export const getStoreBase = (store: Store) => ({
  dispatch: store.dispatch,
  getState: store.getState,
  hydrate: store.hydrate,
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
