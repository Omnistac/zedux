import { Store } from '@zedux/core/index'
import { getDoorMachine, getToggleMachine } from '../utils'

describe('MachineStore', () => {
  test('returns a Store', () => {
    const machine = getToggleMachine()

    expect(machine instanceof Store).toBe(true)
  })
})

describe('MachineStore.send', () => {
  test('is populated with an event name', () => {
    const machine = getToggleMachine()

    expect(typeof machine.send.toggle).toBe('function')
  })

  test('is populated with all event names', () => {
    const machine = getDoorMachine()

    expect(typeof machine.send.buttonPress).toBe('function')
    expect(typeof machine.send.timeout).toBe('function')
  })

  test('updates the state on a valid transition', () => {
    const machine = getDoorMachine()

    expect(machine.getState().value).toBe('open')
    machine.send.buttonPress()
    expect(machine.getState().value).toBe('closing')
    machine.send.buttonPress()
    expect(machine.getState().value).toBe('opening')
    machine.send.buttonPress()
    expect(machine.getState().value).toBe('closing')
    machine.send.timeout()
    expect(machine.getState().value).toBe('closed')
    machine.send.buttonPress()
    expect(machine.getState().value).toBe('opening')
    machine.send.buttonPress()
    expect(machine.getState().value).toBe('closing')
    machine.send.buttonPress()
    expect(machine.getState().value).toBe('opening')
    machine.send.timeout()
    expect(machine.getState().value).toBe('open')

    expect(typeof machine.send.buttonPress).toBe('function')
    expect(typeof machine.send.timeout).toBe('function')
  })

  test("doesn't update the state on an invalid transition", () => {
    const machine = getDoorMachine()

    expect(machine.getState().value).toBe('open')
    machine.send.timeout()
    expect(machine.getState().value).toBe('open')
    machine.send.buttonPress()
    expect(machine.getState().value).toBe('closing')
    machine.send.timeout()
    expect(machine.getState().value).toBe('closed')
    machine.send.timeout()
    expect(machine.getState().value).toBe('closed')
    machine.send.buttonPress()
    expect(machine.getState().value).toBe('opening')
    machine.send.timeout()
    expect(machine.getState().value).toBe('open')

    expect(typeof machine.send.buttonPress).toBe('function')
    expect(typeof machine.send.timeout).toBe('function')
  })
})

describe('MachineStore.setContext', () => {
  test('sets the context recursively', () => {
    const machine = getDoorMachine()

    expect(machine.getState().context).toEqual({ timeoutId: null })
    machine.setContext({ timeoutId: {} })
    expect(machine.getState().context).toEqual({ timeoutId: {} })
    machine.setContext({ timeoutId: { nestedId: 1 } })
    expect(machine.getState().context).toEqual({ timeoutId: { nestedId: 1 } })
    machine.setContext({ other: 'b' })
    expect(machine.getState().context).toEqual({
      timeoutId: { nestedId: 1 },
      other: 'b',
    })
  })
})
