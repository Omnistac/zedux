import { applyMachineHooks, createStore } from '@src/index'

describe('Zedux.applyMachineHooks()', () => {
  test('returns a MachineHooksBuilder', () => {
    const store = createStore<string>()
    const builder = applyMachineHooks(store, state => state)

    expect(typeof builder).toBe('object')
    expect(builder).toEqual({
      getSubscription: expect.any(Function),
      onEnter: expect.any(Function),
      onLeave: expect.any(Function),
    })
  })
})
