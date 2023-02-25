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
})
