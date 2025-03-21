import { createStore } from '@zedux/core/index'

describe('Zedux.createStore()', () => {
  test('returns a store', () => {
    const store = createStore()

    expect(store).toEqual(
      expect.objectContaining({
        dispatch: expect.any(Function),
        getState: expect.any(Function),
        setState: expect.any(Function),
        subscribe: expect.any(Function),
        use: expect.any(Function),
      })
    )
  })

  test('accepts an optional initial hierarchy descriptor', () => {
    const store = createStore({
      a: () => 1,
      b: {
        c: () => 2,
      },
    })

    expect(store.getState()).toEqual({
      a: 1,
      b: {
        c: 2,
      },
    })
  })

  test('accepts an optional initial state', () => {
    const store = createStore(null, 'a')

    expect(store.getState()).toBe('a')
  })
})

// TODO: Test custom store classes with different hierarchical data structures.
