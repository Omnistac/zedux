import { createStore } from '@zedux/core/index'
import { nonFunctions, nonPlainObjects } from '../utils'

describe('Zedux.createStore()', () => {
  test('returns a store', () => {
    const store = createStore()

    expect(store).toEqual({
      dispatch: expect.any(Function),
      getState: expect.any(Function),
      setState: expect.any(Function),
      subscribe: expect.any(Function),
      use: expect.any(Function),
      $$typeof: Symbol.for('zedux.store'),
    })
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

describe('passing hierarchyConfig to createStore()', () => {
  test('throws a TypeError if the options hash is not a plain object', () => {
    nonPlainObjects
      .filter(Boolean)
      .forEach(nonPlainObject =>
        expect(() => createStore(null, undefined, nonPlainObject)).toThrow(
          TypeError
        )
      )
  })

  test('returns the store for chaining', () => {
    const store = createStore(null, null, {} as any)

    expect(store.$$typeof).toBe(Symbol.for('zedux.store'))
  })
})
