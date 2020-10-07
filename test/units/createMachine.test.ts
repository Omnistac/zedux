import { createMachine } from '@src/index'

describe('Zedux.createMachine()', () => {
  test('returns a ZeduxMachine', () => {
    const machine = createMachine('a')

    expect(typeof machine).toBe('function')
    expect(machine).toEqual(
      expect.objectContaining({
        addTransition: expect.any(Function),
        addUndirectedTransitions: expect.any(Function),
      })
    )
  })
})
