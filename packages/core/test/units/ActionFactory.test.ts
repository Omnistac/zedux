import { actionFactory } from '@zedux/core/index'

describe('ActionFactory', () => {
  test('returns a plain action object with the given type', () => {
    expect(actionFactory('a')()).toEqual({
      type: 'a',
    })
  })

  test('by default, sets the payload to whatever is passed', () => {
    expect(actionFactory<number>('a')(1)).toEqual({
      type: 'a',
      payload: 1,
    })

    expect(actionFactory<number>('a')(0)).toEqual({
      type: 'a',
      payload: 0,
    })

    expect(actionFactory<{ a: number }>('a')({ a: 1 })).toEqual({
      type: 'a',
      payload: { a: 1 },
    })
  })
})

describe('ActionFactory.type', () => {
  test("can be modified, but please don't", () => {
    const createAction = actionFactory('a')
    ;(createAction as any).type = 'b'

    expect(createAction()).toEqual({
      type: 'b',
    })
  })
})
