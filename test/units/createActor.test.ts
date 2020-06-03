import { createActor } from '@src/index'

describe('act()', () => {
  test('returns a valid actor', () => {
    const actor = createActor('a')

    expect(typeof actor).toBe('function')
    expect(typeof actor.type).toBe('string')
  })

  test('throws an error if a non-string is passed', () => {
    expect(() => createActor(([] as unknown) as any)).toThrowError(/array/i)
  })

  test('sets the type of the returned actor to a stringified version of whatever was passed', () => {
    expect(createActor('a').type).toBe('a')
  })

  test("overwrites the actor's toString() method with a function that returns the actor's type", () => {
    expect(createActor('a').toString()).toBe('a')
  })
})
