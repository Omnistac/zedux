import { transition } from '../../src/index'


describe('ZeduxMachine()', () => {

  test('sets the initial state of the machine', () => {

    const action = { type: 'a' }

    expect(transition('b')(undefined, action)).toBe('b')

  })


  test('transitions to a valid next state', () => {

    const machine = transition('a')
      .to('b')
      .to('c')
      .to('a')

    expect(
      machine(undefined, { type: 'non-registered-state' })
    ).toBe('a')

    expect(
      machine('a', { type: 'b' })
    ).toBe('b')

    expect(
      machine('b', { type: 'c' })
    ).toBe('c')

    expect(
      machine('c', { type: 'a' })
    ).toBe('a')

  })


  test('does not transition to an unreachable next state', () => {

    const machine = transition('a')
      .to('b')
      .to('c')
      .to('a')

    expect(
      machine('a', { type: 'c' })
    ).toBe('a')

    expect(
      machine('b', { type: 'a' })
    ).toBe('b')

    expect(
      machine('c', { type: 'b' })
    ).toBe('c')

  })

})


describe('ZeduxMachine.process()', () => {

  test('does nothing if the state has not changed', () => {

    const machine = transition('a')

    expect(machine.process(null, null, 'a')).toBeUndefined()

  })


  test('calls a "leave" hook on the old state', () => {

    const state1 = () => ({ type: 'a' })
    state1.type = 'a'
    state1.leave = jest.fn()

    const state2 = () => ({ type: 'b' })
    state2.type = 'b'
    state2.leave = jest.fn()

    const machine = transition(state1)
      .to(state2)
      .to('c')

    machine.process(null, null, 'b')

    expect(state1.leave).toHaveBeenCalledWith(null, null, 'b')

    machine.process(null, null, 'c')

    expect(state2.leave).toHaveBeenCalledWith(null, null, 'c')
    expect(state1.leave).toHaveBeenCalledTimes(1)
    expect(state2.leave).toHaveBeenCalledTimes(1)

  })


  test('calls an "enter" hook on the new state', () => {

    const state1 = () => ({ type: 'a' })
    state1.type = 'a'
    state1.enter = jest.fn()

    const state2 = () => ({ type: 'b' })
    state2.type = 'b'
    state2.enter = jest.fn()

    const machine = transition(state1)
      .to(state2)
      .to(state1)

    machine.process(null, null, 'b')

    expect(state1.enter).not.toHaveBeenCalled()
    expect(state2.enter).toHaveBeenCalledWith(null, null, 'b')

    machine.process(null, null, 'a')

    expect(state1.enter).toHaveBeenCalledWith(null, null, 'a')
    expect(state1.enter).toHaveBeenCalledTimes(1)
    expect(state2.enter).toHaveBeenCalledTimes(1)

  })

})


describe('ZeduxMachine.from()', () => {

  test('overwrites the current list of "from" states', () => {

    const machine = transition('a')
      .from('b')
      .to('c')
      .from('a')
      .to('c')
      .from('a') // does nothing
      .from('c')
      .to('b')

    // we should have a -> c and b <-> c

    expect(machine('a', { type: 'b' })).toBe('a')
    expect(machine('a', { type: 'c' })).toBe('c')
    expect(machine('b', { type: 'a' })).toBe('b')
    expect(machine('b', { type: 'c' })).toBe('c')
    expect(machine('c', { type: 'a' })).toBe('c')
    expect(machine('c', { type: 'b' })).toBe('b')

  })


  test('accepts multiple state names, states, or a mix', () => {

    const stateC = () => ({ type: 'c' })
    stateC.type = 'c'

    const machine = transition('a')
      .from('b', stateC)
      .to('a')

    expect(machine('b', { type: 'a' })).toBe('a')
    expect(machine('c', { type: 'a' })).toBe('a')

  })

})


describe('ZeduxMachine.to()', () => {

  test('adds an edge from each of the current "from" states to all passed states', () => {

    const machine = transition('a')
      .to('b')
      .from('a')
      .to('c')

    expect(machine('a', { type: 'b' })).toBe('b')
    expect(machine('a', { type: 'c' })).toBe('c')

  })


  test('a state can appear in multiple .to() calls', () => {

    const machine = transition('a')
      .to('b')
      .from('c')
      .to('b')

    expect(machine('a', { type: 'b' })).toBe('b')
    expect(machine('c', { type: 'b' })).toBe('b')

  })


  test('accepts multiple state names, states, or a mix', () => {

    const stateC = () => ({ type: 'c' })
    stateC.type = 'c'

    const machine = transition('a')
      .to('b', stateC, 'd')
      .to('a')

    expect(machine('a', { type: 'b' })).toBe('b')
    expect(machine('a', { type: 'c' })).toBe('c')
    expect(machine('a', { type: 'd' })).toBe('d')
    expect(machine('b', { type: 'a' })).toBe('a')
    expect(machine('c', { type: 'a' })).toBe('a')
    expect(machine('d', { type: 'a' })).toBe('a')

  })

})


describe('ZeduxMachine.undirected()', () => {

  test('all given states can transition back and forth between each other', () => {

    const state1 = () => ({ type: 'a' })
    state1.type = 'a'

    const state2 = () => ({ type: 'b' })
    state2.type = 'b'

    const machine = transition(state1)
      .undirected(state1, state2, 'c')

    expect(machine('a', state2())).toBe(state2.type)
    expect(machine('a', { type: 'c' })).toBe('c')
    expect(machine('b', state1())).toBe(state1.type)
    expect(machine('b', { type: 'c' })).toBe('c')
    expect(machine('c', state1())).toBe(state1.type)
    expect(machine('c', state2())).toBe(state2.type)

  })

})
