import { createStore } from '../../src/index'


describe('Zedux.createStore()', () => {

  test('returns a store', () => {

    let store = createStore()
    let keys = Object.keys(store)

    expect(keys).toHaveLength(9)
    expect(store).toEqual(expect.objectContaining({
      dispatch: expect.any(Function),
      getState: expect.any(Function),
      hydrate: expect.any(Function),
      inspect: expect.any(Function),
      setNodeOptions: expect.any(Function),
      setState: expect.any(Function),
      subscribe: expect.any(Function),
      use: expect.any(Function),
      $$typeof: Symbol.for('zedux.store')
    }))

  })

})
