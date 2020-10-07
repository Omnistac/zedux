import { createStore } from '@src/index'

describe('Zedux.createStore()', () => {
  test('returns a store', () => {
    const store = createStore()

    expect(Object.keys(store)).toHaveLength(11)
    expect(store).toEqual(
      expect.objectContaining({
        action$: {
          '@@observable': expect.any(Function),
        },
        configureHierarchy: expect.any(Function),
        dispatch: expect.any(Function),
        getRefCount: expect.any(Function),
        getState: expect.any(Function),
        hydrate: expect.any(Function),
        setState: expect.any(Function),
        subscribe: expect.any(Function),
        use: expect.any(Function),
        '@@observable': expect.any(Function),
        $$typeof: Symbol.for('zedux.store'),
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
})
