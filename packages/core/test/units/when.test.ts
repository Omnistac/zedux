import { when, createStore } from '@zedux/core/index'
import { getToggleMachine } from '../utils'

describe('Zedux.when()', () => {
  test('returns a WhenBuilder (actually a WhenMachineBuilder)', () => {
    const store = createStore<string>()
    const builder = when(store)

    expect(typeof builder).toBe('object')
    expect(builder).toEqual({
      enters: expect.any(Function),
      leaves: expect.any(Function),
      receivesAction: expect.any(Function),
      stateChanges: expect.any(Function),
      stateMatches: expect.any(Function),
      subscription: {
        unsubscribe: expect.any(Function),
      },
    })
  })

  test('returns a WhenMachineBuilder when called with a MachineStore', () => {
    const store = getToggleMachine()
    const builder = when(store)

    expect(typeof builder).toBe('object')
    expect(builder).toEqual({
      enters: expect.any(Function),
      leaves: expect.any(Function),
      receivesAction: expect.any(Function),
      stateChanges: expect.any(Function),
      stateMatches: expect.any(Function),
      subscription: expect.objectContaining({
        unsubscribe: expect.any(Function),
      }),
    })
  })
})
