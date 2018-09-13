import { transition } from '../../src/index'


describe('Zedux.transition()', () => {

  test('returns a ZeduxMachine', () => {

    const machine = transition('a')

    expect(typeof machine).toBe('function')
    expect(machine).toEqual(expect.objectContaining({
      effects: expect.any(Function),
      from: expect.any(Function),
      to: expect.any(Function),
      undirected: expect.any(Function)
    }))

  })

})
