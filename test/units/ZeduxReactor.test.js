import { react } from '../../src/index'


describe('ZeduxReactor()', () => {

  test('with no delegates, returns the state passed to it', () => {

    const action = { type: 'a' }

    expect(react()(undefined, action)).toBeUndefined()

    expect(react()('a', action)).toBe('a')

    expect(react()({ a: 1 }, action)).toEqual({ a: 1 })

  })


  test('anything passed to react() becomes the ZeduxReactor\'s default state', () => {

    const action = { type: 'a' }

    expect(react('a')(undefined, action)).toBe('a')

    expect(react(1)(undefined, action)).toBe(1)

    expect(react({ a: 1 })(undefined, action)).toEqual({ a: 1 })

  })


  test('input state overrides the default state', () => {

    const action = { type: 'a' }

    expect(react('a')('b', action)).toBe('b')

    expect(react(1)(2, action)).toBe(2)

    expect(react({ a: 1 })({ b: 2 }, action)).toEqual({ b: 2 })

  })


})


describe('ZeduxReactor.effects()', () => {

  test('returns an empty array', () => {

    expect(react().effects('a', { type: 'a' })).toEqual([])

  })

})


describe('ZeduxReactor.to()', () => {

  test('returns the ZeduxReactor for chaining', () => {

    const reactor = react()

    expect(reactor.to()).toBe(reactor)

  })


  test('accepts string action types', () => {

    const reactor = react()

    expect(reactor.to('a', 'b', 'c')).toBe(reactor)

  })


  test('accepts actors with a "type" property', () => {

    const reactor = react()

    expect(reactor.to('a', 'b', 'c')).toBe(reactor)

  })


  test('throws a TypeError if an actor is invalid', () => {

    const reactor = react()

    expect(reactor.to.bind(null, 1)).toThrow(TypeError)
    expect(reactor.to.bind(null, 'a', 'b', [])).toThrow(TypeError)

  })

})


describe('ZeduxReactor.toEverything()', () => {

  test('returns the ZeduxReactor for chaining', () => {

    const reactor = react()

    expect(reactor.toEverything()).toBe(reactor)

  })

})


describe('ZeduxReactor.withEffects()', () => {

  test('returns the ZeduxReactor for chaining', () => {

    const reactor = react()

    expect(reactor.withEffects()).toBe(reactor)

  })

})


describe('ZeduxReactor.withReducers()', () => {

  test('returns the ZeduxReactor for chaining', () => {

    const reactor = react()

    expect(reactor.withReducers()).toBe(reactor)

  })

})
