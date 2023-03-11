import { createReducer } from '@zedux/core/index'

const action = { type: 'a' }

const factory = () => action
factory.type = 'a'

describe('ReducerBuilder', () => {
  test('with no delegates, returns the state passed to it', () => {
    expect(createReducer()(undefined, action)).toEqual(undefined)

    expect(createReducer()('a', action)).toEqual('a')

    expect(createReducer()({ a: 1 }, action)).toEqual({ a: 1 })
  })

  test("anything passed to createReducer() becomes the ReducerBuilder's default state", () => {
    expect(createReducer('a')(undefined, action)).toEqual('a')

    expect(createReducer(1)(undefined, action)).toEqual(1)

    expect(createReducer({ a: 1 })(undefined, action)).toEqual({ a: 1 })
  })

  test('input state overrides the default state', () => {
    expect(createReducer('a')('b', action)).toEqual('b')

    expect(createReducer(1)(2, action)).toEqual(2)

    expect(createReducer({ a: 1 })({ a: 2 }, action)).toEqual({ a: 2 })
  })

  test('.reduce() accepts an action type string', () => {
    expect(createReducer(0).reduce('a', state => state + 1)(0, action)).toBe(1)
  })

  test('.reduce() accepts an actionFactory', () => {
    expect(
      createReducer(0).reduce(factory, state => state + 1)(0, action)
    ).toBe(1)
  })

  test('.reduce() accepts multiple mixed action type strings and action factories', () => {
    const reducer = createReducer(0).reduce([factory, 'b'], state => state + 1)

    expect(reducer(0, action)).toBe(1)
    expect(reducer(1, { type: 'b' })).toBe(2)
    expect(reducer(2, { type: 'c' })).toBe(2)
  })
})
