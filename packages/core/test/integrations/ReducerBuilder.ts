import { createReducer } from '@zedux/core/index'

describe('ReducerBuilder', () => {
  test('.reduce() registers a sub-reducer that will be called only for the given action type', () => {
    const subReducer = jest.fn()
    const reducer = createReducer().reduce('a', subReducer)

    reducer(null, { type: 'a', payload: 1 })
    reducer(null, { type: 'b', payload: 2 })

    expect(subReducer).toHaveBeenLastCalledWith(null, 1, {
      type: 'a',
      payload: 1,
    })
    expect(subReducer).toHaveBeenCalledTimes(1)
  })

  test('.reduce() can be chained, used, and re-used', () => {
    const subReducer = jest.fn(state => state)
    const reducer = createReducer(1)
      .reduce('a', subReducer)
      .reduce('a', subReducer)

    const output1 = reducer(1, { type: 'a', payload: 1 })
    const output2 = reducer(1, { type: 'b', payload: 2 })

    expect(subReducer).toHaveBeenLastCalledWith(1, 1, { type: 'a', payload: 1 })
    expect(subReducer).toHaveBeenCalledTimes(2)

    expect(output1).toEqual(1)
    expect(output2).toEqual(1)
  })

  test('multiple actions can be mapped to a reducer', () => {
    const reducer1 = jest.fn()
    const reducer2 = jest.fn()
    const reducer = createReducer()
      .reduce(['a', 'b'], reducer1)
      .reduce(['a', 'b'], reducer2)

    reducer(null, { type: 'a' })
    reducer(null, { type: 'b' })

    expect(reducer1).toHaveBeenCalledTimes(2)
    expect(reducer2).toHaveBeenCalledTimes(2)
  })

  test('an action type can be either a string or a function with a "type" property', () => {
    const actionType1 = 'a'
    const actionType2 = () => null as any

    actionType2.type = 'c'

    const subReducer = jest.fn(() => 1)
    const reducer = createReducer().reduce(
      [actionType1, actionType2],
      subReducer
    )

    reducer(null, { type: 'a', payload: 1 })
    reducer(null, { type: 'b', payload: 2 })

    expect(subReducer).toHaveBeenLastCalledWith(null, 1, {
      type: 'a',
      payload: 1,
    })

    reducer(null, { type: 'c', payload: 3 })
    reducer(null, { type: 'd', payload: 4 })

    expect(subReducer).toHaveBeenLastCalledWith(null, 3, {
      type: 'c',
      payload: 3,
    })
    expect(subReducer).toHaveBeenCalledTimes(2)
  })

  // test('a registered sub-effectCreator can return a promise', done => {
  //   const effectCreator = (state, action) =>
  //     new Promise(resolve => {
  //       setTimeout(() => {
  //         expect(action).toEqual({ type: 'a' })

  //         resolve()
  //         done()
  //       })
  //     })

  //   const reactor = createReducer()
  //     .to('a')
  //     .withEffects(effectCreator)

  //   reactor.effects(null, { type: 'a' })
  // })

  // test('a registered sub-effectCreator can return an iterator', done => {
  //   const effectCreator = function*() {
  //     const val1 = yield new Promise(resolve => {
  //       setTimeout(() => {
  //         resolve(1)
  //       })
  //     })

  //     const val2 = yield 2

  //     const val3 = yield (function*() {
  //       return yield new Promise(resolve => {
  //         setTimeout(() => {
  //           resolve(3)
  //         })
  //       })
  //     })()

  //     expect(val1 + val2 + val3).toBe(6)
  //     done()
  //   }

  //   const reactor = createReducer()
  //     .to('a')
  //     .withEffects(effectCreator)

  //   reactor.effects(null, { type: 'a' })
  // })

  // test('a registered sub-effectCreator can return an observable', done => {
  //   const effectCreator = () => ({
  //     subscribe(next, err, complete) {
  //       setTimeout(() => {
  //         expect(next).toBe(null)

  //         expect(typeof err).toBe('function')

  //         expect(typeof complete).toBe('function')

  //         complete()
  //         done()
  //       })
  //     }
  //   })

  //   const reactor = createReducer()
  //     .to('a')
  //     .withEffects(effectCreator)

  //   reactor.effects(null, { type: 'a' })
  // })
})
