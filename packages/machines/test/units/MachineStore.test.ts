import { Store } from '@zedux/core'
import { getDoorMachine, getToggleMachine } from '../utils'

describe('MachineStore', () => {
  test('returns a Store', () => {
    const machine = getToggleMachine()

    expect(machine instanceof Store).toBe(true)
  })
})

describe('MachineStore.send', () => {
  test('updates the state on a valid transition', () => {
    const machine = getDoorMachine()

    expect(machine.getState().value).toBe('open')
    machine.send('buttonPress')
    expect(machine.getState().value).toBe('closing')
    machine.send('buttonPress')
    expect(machine.getState().value).toBe('opening')
    machine.send('buttonPress')
    expect(machine.getState().value).toBe('closing')
    machine.send('timeout')
    expect(machine.getState().value).toBe('closed')
    machine.send('buttonPress')
    expect(machine.getState().value).toBe('opening')
    machine.send('buttonPress')
    expect(machine.getState().value).toBe('closing')
    machine.send('buttonPress')
    expect(machine.getState().value).toBe('opening')
    machine.send('timeout')
    expect(machine.getState().value).toBe('open')
  })

  test("doesn't update the state on an invalid transition", () => {
    const machine = getDoorMachine()

    expect(machine.getState().value).toBe('open')
    machine.send('timeout')
    expect(machine.getState().value).toBe('open')
    machine.send('buttonPress')
    expect(machine.getState().value).toBe('closing')
    machine.send('timeout')
    expect(machine.getState().value).toBe('closed')
    machine.send('timeout')
    expect(machine.getState().value).toBe('closed')
    machine.send('buttonPress')
    expect(machine.getState().value).toBe('opening')
    machine.send('timeout')
    expect(machine.getState().value).toBe('open')
  })
})

describe('MachineStore.setContext', () => {
  test('sets the context recursively', () => {
    const machine = getDoorMachine()

    expect(machine.getState().context).toEqual({ timeoutId: null })
    machine.setContextDeep({ timeoutId: {} })
    expect(machine.getState().context).toEqual({ timeoutId: {} })
    machine.setContextDeep({ timeoutId: { nestedId: 1 } })
    expect(machine.getState().context).toEqual({ timeoutId: { nestedId: 1 } })
    machine.setContextDeep({ other: 'b' })
    expect(machine.getState().context).toEqual({
      timeoutId: { nestedId: 1 },
      other: 'b',
    })
  })
})
