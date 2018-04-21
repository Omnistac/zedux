import vm from 'vm'


export function createMockStore() {
  return {
    dispatch: jest.fn(),
    $$typeof: Symbol.for('zedux.store')
  }
}


export const dispatchables = [
  { type: 'a' },
  Object.create(Object.prototype, { type: { value: 'a' } }),
  vm.runInNewContext('placeholder = { type: "a" }'),
  () => 'a'
]


export const getStoreBase = store => ({
  dispatch: store.dispatch,
  getState: store.getState,
  hydrate: store.hydrate,
  setState: store.setState
})


export const nonDispatchables = [
  undefined,
  null,
  'a',
  1,
  [],
  new Map(),
  Object.create(null)
]


export const nonPlainObjects = [
  undefined,
  null,
  'a',
  1,
  [],
  () => {},
  new Map(),
  Object.create(null)
]


export const nullNodes = [
  undefined,
  null
]


export const plainObjects = [
  {},
  Object.create(Object.prototype),
  vm.runInNewContext('placeholder = {}')
]
