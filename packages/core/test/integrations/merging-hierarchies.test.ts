import { createStore } from '@zedux/core/index'
import { createMockReducer } from '@zedux/core-test/utils'

describe('merging hierarchies', () => {
  test('branch -> branch', () => {
    const store = createStore()
      .use({
        a: createMockReducer(1),
      })
      .use({
        a: createMockReducer(2),
      })

    expect(store.getState()).toEqual({ a: 2 })
  })

  test('branch -> null', () => {
    const store = createStore().use({})

    expect(store.getState()).toEqual({})
  })

  test('branch -> reducer', () => {
    const store = createStore().use(createMockReducer(1)).use({})

    expect(store.getState()).toEqual({})
  })

  test('branch -> store', () => {
    const store = createStore().use(createStore().hydrate(1)).use({})

    expect(store.getState()).toEqual({})
  })

  test('null -> branch', () => {
    const store = createStore()
      .use({
        a: {
          b: createMockReducer(1),
        },
      })
      .use({
        a: null,
      })

    expect(store.getState()).toEqual({})
  })

  test('null -> null', () => {
    const store = createStore().use(null)

    expect(store.getState()).toBeUndefined()
  })

  test('null -> reducer', () => {
    const store = createStore()
      .use({
        a: {
          b: createMockReducer(1),
        },
      })
      .use({
        a: {
          b: null,
        },
      })

    expect(store.getState()).toEqual({ a: {} })
  })

  test('null -> store', () => {
    const store = createStore()
      .use({
        a: {
          b: createStore().hydrate(1),
        },
      })
      .use({
        a: {
          b: null,
        },
      })

    expect(store.getState()).toEqual({ a: {} })
  })

  test('reducer -> branch', () => {
    const store = createStore()
      .use({
        a: createMockReducer(1),
      })
      .use(createMockReducer(2))

    expect(store.getState()).toBe(2)
  })

  test('reducer -> null', () => {
    const store = createStore().use(createMockReducer(1))

    expect(store.getState()).toBe(1)
  })

  test('reducer -> reducer', () => {
    const store = createStore()
      .use(createMockReducer(1))
      .use(createMockReducer(2))

    expect(store.getState()).toBe(2)
  })

  test('reducer -> store', () => {
    const store = createStore()
      .use(createStore().hydrate(1))
      .use(createMockReducer(2))

    expect(store.getState()).toBe(2)
  })

  test('store -> branch', () => {
    const store = createStore().use({}).use(createStore().hydrate(1))

    expect(store.getState()).toBe(1)
  })

  test('store -> null', () => {
    const store = createStore().use(createStore().hydrate(1))

    expect(store.getState()).toBe(1)
  })

  test('store -> reducer', () => {
    const store = createStore()
      .use(createMockReducer(1))
      .use(createStore().hydrate(2))

    expect(store.getState()).toBe(2)
  })

  test('store -> store', () => {
    const store = createStore()
      .use(createStore().hydrate(1))
      .use(createStore().hydrate(2))

    expect(store.getState()).toBe(2)
  })
})
