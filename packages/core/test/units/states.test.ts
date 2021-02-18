import { createActor, createState, states } from '@zedux/core'

const doA = createActor('doA')
const doB = createActor('doB')

describe('createState()', () => {
  test('returns a state object', () => {
    const a = createState('a')

    expect(a).toEqual({
      is: expect.any(Function),
      on: expect.any(Function),
      transitions: {},
      type: 'a',
    })
  })
})

describe('states()', () => {
  test('creates a state', () => {
    const [a] = states('a')

    expect(a).toEqual({
      is: expect.any(Function),
      on: expect.any(Function),
      transitions: {},
      type: 'a',
    })
  })

  test('creates several states', () => {
    const [a, b, c, ...rest] = states('a', 'b', 'c')

    expect(rest.length).toBe(0)

    expect(a).toEqual({
      is: expect.any(Function),
      on: expect.any(Function),
      transitions: {},
      type: 'a',
    })

    expect(b).toEqual({
      is: expect.any(Function),
      on: expect.any(Function),
      transitions: {},
      type: 'b',
    })

    expect(c).toEqual({
      is: expect.any(Function),
      on: expect.any(Function),
      transitions: {},
      type: 'c',
    })
  })
})

describe('MachineState', () => {
  test('.is() returns true if the passed string equals this state', () => {
    const a = createState('a')

    expect(a.is('a')).toBe(true)
    expect(a.is('b')).toBe(false)
  })

  test('.on() adds transitions', () => {
    const a = createState('a')
    const b = createState('b')

    a.on(doA, b)

    expect(a.transitions).toEqual({
      [doA.type]: b.type,
    })
  })

  test('.on() can be chained', () => {
    const a = createState('a')
    const b = createState('b')
    const c = createState('c')

    a.on(doA, b).on(doB, c)

    expect(a.transitions).toEqual({
      [doA.type]: b.type,
      [doB.type]: c.type,
    })
  })

  test('registering a new target state for an action from one state overwrites the previous transition', () => {
    const [a, b, c] = states('a', 'b', 'c')

    a.on(doA, b).on(doA, c)

    expect(a.transitions).toEqual({
      [doA.type]: c.type,
    })
  })
})
