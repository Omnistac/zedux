import { createEcosystem, Signal } from '@zedux/atoms'
import { MachineSignal } from '@zedux/machines'
import { getDoorMachine, getToggleMachine } from '../utils'

describe('MachineSignal', () => {
  test('returns a Signal', () => {
    const machine = getToggleMachine()

    expect(machine instanceof Signal).toBe(true)
  })
})

describe('MachineSignal.send', () => {
  test('updates the state on a valid transition', () => {
    const machine = getDoorMachine()

    expect(machine.v.value).toBe('open')
    machine.send('buttonPress')
    expect(machine.v.value).toBe('closing')
    machine.send('buttonPress')
    expect(machine.v.value).toBe('opening')
    machine.send('buttonPress')
    expect(machine.v.value).toBe('closing')
    machine.send('timeout')
    expect(machine.v.value).toBe('closed')
    machine.send('buttonPress')
    expect(machine.v.value).toBe('opening')
    machine.send('buttonPress')
    expect(machine.v.value).toBe('closing')
    machine.send('buttonPress')
    expect(machine.v.value).toBe('opening')
    machine.send('timeout')
    expect(machine.v.value).toBe('open')
  })

  test("doesn't update the state on an invalid transition", () => {
    const machine = getDoorMachine()

    expect(machine.v.value).toBe('open')
    machine.send('timeout')
    expect(machine.v.value).toBe('open')
    machine.send('buttonPress')
    expect(machine.v.value).toBe('closing')
    machine.send('timeout')
    expect(machine.v.value).toBe('closed')
    machine.send('timeout')
    expect(machine.v.value).toBe('closed')
    machine.send('buttonPress')
    expect(machine.v.value).toBe('opening')
    machine.send('timeout')
    expect(machine.v.value).toBe('open')
  })

  test('sends a single event via object form', () => {
    const machine = getDoorMachine()

    expect(machine.v.value).toBe('open')
    machine.send({ buttonPress: undefined } as any)
    expect(machine.v.value).toBe('closing')
  })

  test('sends multiple events in order via object form', () => {
    const machine = getDoorMachine()

    machine.send('buttonPress') // open -> closing
    expect(machine.v.value).toBe('closing')

    // From closing: buttonPress -> opening, timeout -> closed
    // Object keys iterate in insertion order
    // buttonPress: closing -> opening
    // timeout: opening -> open
    machine.send({ buttonPress: undefined, timeout: undefined } as any)
    expect(machine.v.value).toBe('open')
  })
})

describe('MachineSignal.setContext', () => {
  test('updates context with a function', () => {
    const machine = getDoorMachine()

    machine.setContext(ctx => ({ ...ctx, timeoutId: { nestedId: 42 } }))
    expect(machine.v.context).toEqual({ timeoutId: { nestedId: 42 } })
  })

  test('preserves current state value', () => {
    const machine = getDoorMachine()

    machine.send('buttonPress') // open -> closing
    expect(machine.v.value).toBe('closing')

    machine.setContext(ctx => ({ ...ctx, timeoutId: { nestedId: 1 } }))
    expect(machine.v.value).toBe('closing')
    expect(machine.v.context).toEqual({ timeoutId: { nestedId: 1 } })
  })
})

describe('MachineSignal.mutateContext', () => {
  test('deep-merges partial context via object form', () => {
    const machine = getDoorMachine()

    expect(machine.v.context).toEqual({ timeoutId: null })
    machine.mutateContext({ timeoutId: {} })
    expect(machine.v.context).toEqual({ timeoutId: {} })
    machine.mutateContext({ timeoutId: { nestedId: 1 } })
    expect(machine.v.context).toEqual({ timeoutId: { nestedId: 1 } })
    machine.mutateContext({ other: 'b' })
    expect(machine.v.context).toEqual({
      timeoutId: { nestedId: 1 },
      other: 'b',
    })
  })

  test('deep-merges partial context via function returning partial', () => {
    const machine = getDoorMachine()

    machine.mutateContext(ctx => ({ timeoutId: { nestedId: ctx.timeoutId ? 1 : 2 } }))
    expect(machine.v.context).toEqual({ timeoutId: { nestedId: 2 } })
  })

  test('supports in-place mutation via function', () => {
    const ecosystem = createEcosystem({ id: 'mutate-inplace-test' })
    const machine = new MachineSignal(
      ecosystem,
      ecosystem.makeId('signal'),
      'a',
      { a: {} } as any,
      { items: [1, 2, 3], label: 'test' }
    )

    machine.mutateContext(ctx => {
      ctx.items.push(4)
      ctx.label = 'updated'
    })
    expect(machine.v.context).toEqual({ items: [1, 2, 3, 4], label: 'updated' })
    ecosystem.reset()
  })

  test('object form merges arrays by index', () => {
    const ecosystem = createEcosystem({ id: 'array-test' })
    const machine = new MachineSignal(
      ecosystem,
      ecosystem.makeId('signal'),
      'a',
      { a: {} } as any,
      { items: [1, 2, 3], label: 'test' }
    )

    // object form deep-merges by index, not replaces
    machine.mutateContext({ items: [4, 5] } as any)
    expect(machine.v.context).toEqual({ items: [4, 5, 3], label: 'test' })
    ecosystem.reset()
  })

  test('function form can replace arrays entirely', () => {
    const ecosystem = createEcosystem({ id: 'array-replace-test' })
    const machine = new MachineSignal(
      ecosystem,
      ecosystem.makeId('signal'),
      'a',
      { a: {} } as any,
      { items: [1, 2, 3], label: 'test' }
    )

    machine.mutateContext(ctx => {
      ctx.items = [4, 5]
    })
    expect(machine.v.context).toEqual({ items: [4, 5], label: 'test' })
    ecosystem.reset()
  })
})

describe('MachineSignal with guard', () => {
  test('constructor guard blocks transitions', () => {
    const ecosystem = createEcosystem({ id: 'guard-unit-test' })
    const machine = new MachineSignal(
      ecosystem,
      ecosystem.makeId('signal'),
      'a',
      {
        a: { next: { name: 'b' } },
        b: { next: { name: 'a' } },
      } as any,
      undefined,
      () => false
    )

    machine.send('next')
    expect(machine.v.value).toBe('a')
    ecosystem.reset()
  })

  test('constructor guard allows transitions when returning true', () => {
    const ecosystem = createEcosystem({ id: 'guard-allow-test' })
    const machine = new MachineSignal(
      ecosystem,
      ecosystem.makeId('signal'),
      'a',
      {
        a: { next: { name: 'b' } },
        b: { next: { name: 'a' } },
      } as any,
      undefined,
      () => true
    )

    machine.send('next')
    expect(machine.v.value).toBe('b')
    ecosystem.reset()
  })
})

describe('MachineSignal event system', () => {
  test('.set() with machine events triggers transitions', () => {
    const ecosystem = createEcosystem({ id: 'set-events-test' })
    const machine = new MachineSignal(
      ecosystem,
      ecosystem.makeId('signal'),
      'a',
      {
        a: { next: { name: 'b' } },
        b: { next: { name: 'a' } },
      } as any
    )

    expect(machine.v.value).toBe('a')

    // .set() only dispatches events when state changes (new reference required)
    machine.set({ ...machine.v }, { next: undefined } as any)
    expect(machine.v.value).toBe('b')

    machine.set({ ...machine.v }, { next: undefined } as any)
    expect(machine.v.value).toBe('a')
    ecosystem.reset()
  })

  test('.mutate() with machine events triggers transitions', () => {
    const ecosystem = createEcosystem({ id: 'mutate-events-test' })
    const machine = new MachineSignal(
      ecosystem,
      ecosystem.makeId('signal'),
      'a',
      {
        a: { next: { name: 'b' } },
        b: { next: { name: 'a' } },
      } as any,
      { count: 0 }
    )

    expect(machine.v.value).toBe('a')

    // Dispatching event via .mutate() should trigger the catch-all listener
    machine.mutate(state => {
      state.context.count = 1
    }, { next: undefined } as any)

    expect(machine.v.value).toBe('b')
    expect(machine.v.context.count).toBe(1)
    ecosystem.reset()
  })

  test('signal.on receives specific machine events', () => {
    const ecosystem = createEcosystem({ id: 'on-event-test' })
    const machine = new MachineSignal(
      ecosystem,
      ecosystem.makeId('signal'),
      'a',
      {
        a: { next: { name: 'b' } },
        b: { next: { name: 'a' } },
      } as any
    )

    const callback = jest.fn()
    machine.on('next' as any, callback)

    machine.send('next')
    expect(callback).toHaveBeenCalledTimes(1)

    machine.send('next')
    expect(callback).toHaveBeenCalledTimes(2)
    ecosystem.reset()
  })

  test('catch-all external listener receives machine events', () => {
    const ecosystem = createEcosystem({ id: 'catch-all-test' })
    const machine = new MachineSignal(
      ecosystem,
      ecosystem.makeId('signal'),
      'a',
      {
        a: { next: { name: 'b' } },
        b: { next: { name: 'a' } },
      } as any
    )

    const callback = jest.fn()
    machine.on(callback)

    machine.send('next')
    // catch-all listener fires for the send event and the resulting state change
    expect(callback).toHaveBeenCalled()
    expect(callback.mock.calls[0][0]).toHaveProperty('next')
    ecosystem.reset()
  })
})
