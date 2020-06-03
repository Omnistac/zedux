import { createActorFactory } from '@src/index'

describe('createActorFactory()', () => {
  test('returns a partially-applied createActor() function', () => {
    expect(createActorFactory('a')('b').type).toBe('a/b')

    expect(createActorFactory('a', 'b')('c').type).toBe('a/b/c')

    expect(createActorFactory('a', 'b', 'c')('d').type).toBe('a/b/c/d')
  })
})
