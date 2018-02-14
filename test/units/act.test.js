import { act } from '../../src/index'


describe('Zedux.act()', () => {

  test('returns a valid actor', () => {

    const actor = act()

    expect(typeof actor).toBe('function')
    expect(typeof actor.type).toBe('string')

  })


  test('sets the type of the returned actor to a stringified version of whatever was passed', () => {

    expect(act('a').type).toBe('a')

    expect(act(1).type).toBe('1')

    expect(act({}).type).toBe({}.toString())

  })


  test('overwrites the actor\'s toString() method with a function that returns the actor\'s type', () => {

    expect(act('a').toString()).toBe('a')

    expect(act(1) + '').toBe('1')

    expect(act({}) + act({})).toBe({} + {})

  })


  test('joins multiple arguments with "/"', () => {

    expect(act(1, 2, 3).type).toBe('1/2/3')

    // Some partial application, for fun.
    expect(act.bind(null, 'a').bind(null, 'b').bind(null, 'c')('d').type).toBe('a/b/c/d')

  })

})


describe('Zedux.act.namespace()', () => {

  test('returns a partially-applied act() function', () => {

    expect(act.namespace('a')('b').type).toBe('a/b')

    expect(act.namespace('a').bind(null, 'b').bind(null, 'c')('d').type).toBe('a/b/c/d')

    expect(act.namespace('a', 'b')('c').type).toBe('a/b/c')

    expect(act.namespace('a', 'b')('c', 'd').type).toBe('a/b/c/d')

  })

})
