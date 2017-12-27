import { state } from '../../src/index'


describe('ZeduxState()', () => {

  test('returns a plain action object with the given type', () => {

    expect(state('a')()).toEqual({
      type: 'a'
    })

  })

})


describe('ZeduxState.onEnter()', () => {

  test('must be a function', () => {

    const zeduxState = state('a')

    expect(zeduxState.onEnter.bind(null, 1)).toThrow(TypeError)

    expect(zeduxState.onEnter.bind(null, 'a')).toThrow(TypeError)

  })


  test('sets the `enter` property to the passed function', () => {

    const zeduxState = state('a')
    const func = () => {}

    zeduxState.onEnter(func)

    expect(zeduxState.enter).toBe(func)

  })


  test('returns the state for chaining', () => {

    const zeduxState = state('a')
    const chainedState = zeduxState.onEnter(() => {})

    expect(chainedState).toBe(zeduxState)

  })

})


describe('ZeduxState.onLeave()', () => {

  test('must be a function', () => {

    const zeduxState = state('a')

    expect(zeduxState.onLeave.bind(null, 1)).toThrow(TypeError)

    expect(zeduxState.onLeave.bind(null, 'a')).toThrow(TypeError)

  })


  test('sets the `leave` property to the passed function', () => {

    const zeduxState = state('a')
    const func = () => {}

    zeduxState.onLeave(func)

    expect(zeduxState.leave).toBe(func)

  })


  test('returns the state for chaining', () => {

    const zeduxState = state('a')
    const chainedState = zeduxState.onLeave(() => {})

    expect(chainedState).toBe(zeduxState)

  })

})


describe('ZeduxState.type', () => {

  test('is a string', () => {

    expect(typeof state().type).toBe('string')
    expect(typeof state([]).type).toBe('string')

  })


  test('can be modified, but please don\'t', () => {

    const zeduxState = state('a')
    zeduxState.type = 'b'

    expect(zeduxState()).toEqual({
      type: 'b'
    })

  })

})
