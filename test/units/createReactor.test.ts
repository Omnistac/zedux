import { createReducer } from '@src/index'

describe('Zedux.createReducer()', () => {
  test('returns a ZeduxReducer', () => {
    const reducer = createReducer()

    expect(typeof reducer).toBe('function')
    expect(reducer).toEqual(
      expect.objectContaining({
        reduce: expect.any(Function),
      })
    )
  })
})
