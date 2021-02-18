import { createActor } from '@zedux/core/index'

describe('ZeduxActor', () => {
  test('returns a plain action object with the given type', () => {
    expect(createActor('a')()).toEqual({
      type: 'a',
    })
  })

  test('by default, sets the payload to whatever is passed', () => {
    expect(createActor<number>('a')(1)).toEqual({
      type: 'a',
      payload: 1,
    })

    expect(createActor<number>('a')(0)).toEqual({
      type: 'a',
      payload: 0,
    })

    expect(createActor<{ a: number }>('a')({ a: 1 })).toEqual({
      type: 'a',
      payload: { a: 1 },
    })
  })
})

describe('ZeduxActor.type', () => {
  test("can be modified, but please don't", () => {
    const actor = createActor('a')
    ;(actor as any).type = 'b'

    expect(actor()).toEqual({
      type: 'b',
    })
  })
})
