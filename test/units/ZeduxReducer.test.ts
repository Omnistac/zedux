import { createReducer } from '@src/index'

describe('ZeduxReducer', () => {
  test('with no delegates, returns the state passed to it', () => {
    const action = { type: 'a' }

    expect(createReducer()(undefined, action)).toEqual(undefined)

    expect(createReducer()('a', action)).toEqual('a')

    expect(createReducer()({ a: 1 }, action)).toEqual({ a: 1 })
  })

  test("anything passed to createReducer() becomes the ZeduxReducer's default state", () => {
    const action = { type: 'a' }

    expect(createReducer('a')(undefined, action)).toEqual('a')

    expect(createReducer(1)(undefined, action)).toEqual(1)

    expect(createReducer({ a: 1 })(undefined, action)).toEqual({ a: 1 })
  })

  test('input state overrides the default state', () => {
    const action = { type: 'a' }

    expect(createReducer('a')('b', action)).toEqual('b')

    expect(createReducer(1)(2, action)).toEqual(2)

    expect(createReducer({ a: 1 })({ a: 2 }, action)).toEqual({ a: 2 })
  })
})
