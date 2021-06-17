import { when, createStore } from '@zedux/core/index'

describe('Zedux.when()', () => {
  test('returns a WhenBuilder', () => {
    const store = createStore<string>()
    const builder = when(store)

    expect(typeof builder).toBe('object')
    expect(builder).toEqual({
      machine: expect.any(Function),
      receivesAction: expect.any(Function),
      stateChanges: expect.any(Function),
      stateMatches: expect.any(Function),
      subscription: {
        unsubscribe: expect.any(Function),
      },
    })
  })

  test('.machine() returns a WhenMachineBuilder', () => {
    const store = createStore<string>()
    const builder = when(store).machine()

    expect(typeof builder).toBe('object')
    expect(builder).toEqual({
      enters: expect.any(Function),
      leaves: expect.any(Function),
      machine: expect.any(Function),
      receivesAction: expect.any(Function),
      stateChanges: expect.any(Function),
      stateMatches: expect.any(Function),
      subscription: expect.objectContaining({
        unsubscribe: expect.any(Function),
      }),
    })
  })
})
