import { createStore } from '../../src/index'


describe('Zedux.createStore()', () => {

  test('returns a store', () => {

    const store = createStore()

    expect(Object.keys(store)).toHaveLength(8) // $$observable not enumerable
    expect(store).toEqual(expect.objectContaining({
      dispatch: expect.any(Function),
      getState: expect.any(Function),
      hydrate: expect.any(Function),
      setNodeOptions: expect.any(Function),
      setState: expect.any(Function),
      subscribe: expect.any(Function),
      use: expect.any(Function),
      [Symbol.observable]: expect.any(Function),
      $$typeof: Symbol.for('zedux.store')
    }))

  })


  test('accepts an optional initial hierarchy descriptor', () => {

    const store = createStore({
      a: () => 1,
      b: {
        c: () => 2
      }
    })

    expect(store.getState()).toEqual({
      a: 1,
      b: {
        c: 2
      }
    })

  })

})
