import { createReducer } from '@zedux/core/index'

describe('Zedux.createReducer()', () => {
  test('returns a ReducerBuilder', () => {
    const reducer = createReducer()

    expect(typeof reducer).toBe('function')
    expect(reducer.reduce).toEqual(expect.any(Function))
  })
})
