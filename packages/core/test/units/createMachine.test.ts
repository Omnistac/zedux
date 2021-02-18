import { createMachine, createState } from '@zedux/core/index'

describe('Zedux.createMachine()', () => {
  test('returns a ZeduxMachine', () => {
    const a = createState('a')
    const machine = createMachine(a)

    expect(typeof machine).toBe('function')
  })

  test('throws an error if no states are passed', () => {
    expect(() => createMachine()).toThrowError(
      /at least one state is required/i
    )
  })

  test('throws an error if an invalid state is passed', () => {
    expect(() => createMachine({} as any)).toThrowError(
      /must be either a string or MachineState object/i
    )
  })
})
