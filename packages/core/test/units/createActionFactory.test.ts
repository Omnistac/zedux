import { actionFactory } from '@zedux/core/index'

describe('actionFactory()', () => {
  test('returns a valid ActionFactory', () => {
    const ActionFactory = actionFactory('a')

    expect(typeof ActionFactory).toBe('function')
    expect(typeof ActionFactory.type).toBe('string')
  })

  test('throws an error if a non-string is passed', () => {
    expect(() => actionFactory(([] as unknown) as any)).toThrow(/array/i)
  })

  test('sets the .type of the returned ActionFactory to a stringified version of whatever was passed', () => {
    expect(actionFactory('a').type).toBe('a')
  })
})
