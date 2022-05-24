import { MachineStore, Store } from '@zedux/core'
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

export const getDoorMachine = () =>
  new MachineStore<
    'open' | 'opening' | 'closing' | 'closed',
    'buttonPress' | 'timeout',
    { timeoutId: null | { nestedId: null | number }; other?: string }
  >(
    'open',
    {
      open: { buttonPress: 'closing' },
      opening: { buttonPress: 'closing', timeout: 'open' },
      closing: { buttonPress: 'opening', timeout: 'closed' },
      closed: { buttonPress: 'opening' },
    } as any,
    new Set(['buttonPress', 'timeout']),
    { timeoutId: null }
  )

export const getStoreBase = (store: Store) => ({
  dispatch: store.dispatch,
  getState: store.getState,
  setState: store.setState,
})

export const getToggleMachine = () =>
  new MachineStore(
    'a',
    { a: { toggle: 'b' }, b: { toggle: 'a' } },
    new Set(['toggle'])
  )

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
