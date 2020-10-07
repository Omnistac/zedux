import { createMachine, createActor } from '@src/index'

describe('ZeduxMachine', () => {
  test('sets the initial state of the machine', () => {
    const action = { type: 'a' }
    const machine = createMachine('b')

    expect(machine(undefined, action)).toBe('b')
  })

  test('transitions to a valid next state', () => {
    const machine = createMachine('a')
      .addTransition('a', 'b')
      .addTransition('b', 'c')
      .addTransition('c', 'a')

    expect(machine(undefined, { type: 'non-registered-state' })).toBe('a')

    expect(machine('a', { type: 'b' })).toBe('b')
    expect(machine('b', { type: 'c' })).toBe('c')
    expect(machine('c', { type: 'a' })).toBe('a')
  })

  test('does not transition to an unreachable next state', () => {
    const machine = createMachine('a')
      .addTransition('a', 'b')
      .addTransition('b', 'c')
      .addTransition('c', 'a')

    expect(machine('a', { type: 'c' })).toBe('a')
    expect(machine('b', { type: 'a' })).toBe('b')
    expect(machine('c', { type: 'b' })).toBe('c')
  })

  test('initial state argument is optional', () => {
    const machine = createMachine()
      .addTransition('a', 'b')
      .addTransition('b', 'c')

    expect(machine('a', { type: 'b' })).toBe('b')
    expect(machine('b', { type: 'c' })).toBe('c')
  })
})

describe('ZeduxMachine.addTransition()', () => {
  test('accepts a state name for each argument', () => {
    const stateC = () => ({ type: 'c' })
    stateC.type = 'c'

    const machine = createMachine('a').addTransition('a', 'b')

    expect(machine('a', { type: 'b' })).toBe('b')
    expect(machine('b', { type: 'a' })).toBe('b')
  })

  test('accepts an actor for each argument', () => {
    const actorA = createActor('a')
    const actorB = createActor('b')

    const machine = createMachine('a').addTransition(actorA, actorB)

    expect(machine('a', { type: 'b' })).toBe('b')
    expect(machine('b', { type: 'a' })).toBe('b')
  })

  test('accepts a mix of actors and state names', () => {
    const actorA = createActor('a')
    const actorB = createActor('b')

    const machine1 = createMachine('a').addTransition(actorA, 'b')
    const machine2 = createMachine('a').addTransition('a', actorB)

    expect(machine1('a', { type: 'b' })).toBe('b')
    expect(machine1('b', { type: 'a' })).toBe('b')
    expect(machine2('a', { type: 'b' })).toBe('b')
    expect(machine2('b', { type: 'a' })).toBe('b')
  })

  test('adds more edges when called again for the same state', () => {
    const machine = createMachine('a')
      .addTransition('a', 'b')
      .addTransition('a', 'c')

    expect(machine('a', { type: 'b' })).toBe('b')
    expect(machine('a', { type: 'c' })).toBe('c')
    expect(machine('b', { type: 'a' })).toBe('b')
    expect(machine('b', { type: 'c' })).toBe('b')
    expect(machine('c', { type: 'a' })).toBe('c')
    expect(machine('c', { type: 'b' })).toBe('c')
  })

  test('accepts a transition name', () => {
    const machine = createMachine('a').addTransition('a', 'click', 'b')

    expect(machine('a', { type: 'click' })).toBe('b')
    expect(machine('a', { type: 'b' })).toBe('a')
  })

  test('accepts a transition actor', () => {
    const click = createActor('click')
    const machine = createMachine('a')
      .addTransition('a', click, 'b')
      .addTransition('b', click, 'c')
      .addTransition('c', click, 'a')

    expect(machine('a', click())).toBe('b')
    expect(machine('b', click())).toBe('c')
    expect(machine('c', click())).toBe('a')
  })
})

describe('ZeduxMachine.addUndirectedTransitions()', () => {
  test('does nothing if < 2 states are passed', () => {
    const machine = createMachine('a').addUndirectedTransitions('b')

    expect(machine('a', { type: 'b' })).toBe('a')
    expect(machine('b', { type: 'a' })).toBe('b')
  })

  test('all given states can transition back and forth between each other', () => {
    const state1 = () => ({ type: 'a' })
    state1.type = 'a'

    const state2 = () => ({ type: 'b' })
    state2.type = 'b'

    const machine = createMachine(state1).addUndirectedTransitions(
      state1,
      state2,
      'c'
    )

    expect(machine('a', state2())).toBe(state2.type)
    expect(machine('a', { type: 'c' })).toBe('c')
    expect(machine('b', state1())).toBe(state1.type)
    expect(machine('b', { type: 'c' })).toBe('c')
    expect(machine('c', state1())).toBe(state1.type)
    expect(machine('c', state2())).toBe(state2.type)
  })
})
