import { act } from '../../src/index'


describe('ZeduxActor()', () => {

  test('returns a plain action object with the given type', () => {

    expect(act('a')()).toEqual({
      type: 'a'
    })

  })


  test('by default, sets the payload to whatever is passed', () => {

    expect(act('a')(1)).toEqual({
      type: 'a',
      payload: 1
    })

    expect(act('a')(0)).toEqual({
      type: 'a',
      payload: 0
    })

    expect(act('a')({ a: 1 })).toEqual({
      type: 'a',
      payload: { a: 1 }
    })

  })

})


describe('ZeduxActor.payload()', () => {

  test('overwrites the default payload creator', () => {

    let actor = act('a')
    actor.payload(() => 1) // always set the payload to 1

    expect(actor(2)).toEqual({
      type: 'a',
      payload: 1
    })

  })


  test('returns the actor for chaining', () => {

    let actor = act('a')

      // set the payload to an array containing all passed args
      .payload((...args) => args)


    expect(actor(1, 2, 3)).toEqual({
      type: 'a',
      payload: [ 1, 2, 3 ]
    })

  })

})


describe('ZeduxActor.type', () => {

  test('is a string', () => {

    expect(typeof act().type).toBe('string')
    expect(typeof act([]).type).toBe('string')

  })


  test('can be modified, but please don\'t', () => {

    const actor = act('a')
    actor.type = 'b'

    expect(actor()).toEqual({
      type: 'b'
    })

  })

})
