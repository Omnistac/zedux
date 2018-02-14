import { state } from '../../src/index'


describe('Zedux.state()', () => {

  test('returns a valid actor', () => {

    const actor = state()

    expect(typeof actor).toBe('function')
    expect(typeof actor.type).toBe('string')

  })


  test('sets the type of the returned actor to a stringified version of whatever was passed', () => {

    expect(state('a').type).toBe('a')

    expect(state(1).type).toBe('1')

    expect(state({}).type).toBe({}.toString())

  })


  test('overwrites the state\'s toString() method with a function that returns the state\'s type', () => {

    expect(state('a').toString()).toBe('a')

    expect(state(1) + '').toBe('1')

    expect(state({}) + state({})).toBe({} + {})

  })


  test('joins multiple arguments with "/"', () => {

    expect(state(1, 2, 3).type).toBe('1/2/3')

    // Some partial application, for fun.
    expect(state.bind(null, 'a').bind(null, 'b').bind(null, 'c')('d').type).toBe('a/b/c/d')

  })

})


describe('Zedux.state.namespace()', () => {

  test('returns a partially-applied state() function', () => {

    expect(state.namespace('a')('b').type).toBe('a/b')

    expect(state.namespace('a').bind(null, 'b').bind(null, 'c')('d').type).toBe('a/b/c/d')

    expect(state.namespace('a', 'b')('c').type).toBe('a/b/c')

    expect(state.namespace('a', 'b')('c', 'd').type).toBe('a/b/c/d')

  })

})
