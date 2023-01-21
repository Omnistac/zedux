import { actionFactory } from '@zedux/core/index'

describe('actionFactory()', () => {
  test('returns a valid actor', () => {
    const actor = actionFactory('a')

    expect(typeof actor).toBe('function')
    expect(typeof actor.type).toBe('string')
  })

  test('throws an error if a non-string is passed', () => {
    expect(() => actionFactory(([] as unknown) as any)).toThrowError(/array/i)
  })

  test('sets the type of the returned actor to a stringified version of whatever was passed', () => {
    expect(actionFactory('a').type).toBe('a')
  })
})
