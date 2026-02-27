import { injectMachineSignal, MachineSignal } from '@zedux/machines'
import { atom } from '@zedux/atoms'
import { ecosystem } from '../../../react/test/utils/ecosystem'

describe('state machines', () => {
  test('toggler machine be togglin', () => {
    const toggleAtom = atom('toggle', () =>
      injectMachineSignal(state => [
        state('a').on('toggle', 'b'),
        state('b').on('toggle', 'a'),
      ])
    )

    const instance = ecosystem.getInstance(toggleAtom)
    const signal = instance.S! as unknown as MachineSignal<'a' | 'b', 'toggle'>
    const { getValue, is, send } = signal

    expect(instance.v).toEqual({ context: undefined, value: 'a' })
    expect(getValue()).toBe('a')
    expect(is('a')).toBe(true)
    expect(is('b')).toBe(false)
    send('toggle')

    // @ts-expect-error invalid event name
    send('invalid')

    // @ts-expect-error invalid state name
    is('invalid')

    expect(getValue()).toBe('b')
    expect(is('b')).toBe(true)

    send('toggle')
    send('toggle')
    send('toggle')

    expect(getValue()).toBe('a')
    expect(is('a')).toBe(true)
  })

  test('only takes valid transitions', () => {
    const machineAtom = atom('machine', () =>
      injectMachineSignal(state => [
        state('a').on('up', 'b'),
        state('b').on('up', 'c').on('down', 'a'),
        state('c').on('down', 'b'),
      ])
    )

    const signal = ecosystem.getInstance(machineAtom)
      .S! as unknown as MachineSignal<'a' | 'b' | 'c', 'up' | 'down'>
    const { is, send } = signal

    expect(is('a')).toBe(true)
    send('down')
    expect(is('a')).toBe(true)
    send('up')
    expect(is('b')).toBe(true)
    send('up')
    expect(is('c')).toBe(true)
    send('up')
    expect(is('c')).toBe(true)
    send('down')
    send('down')
    expect(is('a')).toBe(true)
    send('down')
    send('down')
    send('down')
    expect(is('a')).toBe(true)
    send('up')
    expect(is('b')).toBe(true)
    send('down')
    expect(is('a')).toBe(true)
    send('down')
    expect(is('a')).toBe(true)
  })

  test('context helpers update context correctly', () => {
    const initialContext = { a: 1, b: { c: 2, d: 3 } }
    const machineAtom = atom('machine', () =>
      injectMachineSignal(state => [state('a')], initialContext)
    )

    const instance = ecosystem.getInstance(machineAtom)
    const signal = instance.S! as unknown as MachineSignal<
      'a',
      never,
      typeof initialContext
    >
    const { getContext, setContext, mutateContext } = signal

    expect(getContext()).toBe(initialContext)
    expect(instance.v).toEqual({ context: initialContext, value: 'a' })
    mutateContext({ b: { d: 4 } })
    expect(getContext()).toEqual({ a: 1, b: { c: 2, d: 4 } })
    mutateContext(state => ({ b: { c: state.b.c + 1 } }))
    expect(getContext()).toEqual({ a: 1, b: { c: 3, d: 4 } })
    setContext(state => ({ ...state, a: 5 }))
    expect(getContext()).toEqual({ a: 5, b: { c: 3, d: 4 } })
    setContext(initialContext)
    expect(getContext()).toBe(initialContext)
  })

  test('state transition guard be guardin', () => {
    const toggleAtom = atom('toggle', () =>
      injectMachineSignal(
        state => [
          state('a').on('toggle', 'b', context => !context.isPaused),
          state('b').on('toggle', 'a'),
        ],
        { isPaused: false }
      )
    )

    const signal = ecosystem.getInstance(toggleAtom)
      .S! as unknown as MachineSignal<'a' | 'b', 'toggle', { isPaused: boolean }>
    const { is, send, setContext } = signal

    send('toggle')
    expect(is('b')).toBe(true)
    setContext({ isPaused: true })
    send('toggle')
    expect(is('a')).toBe(true)
    send('toggle')
    expect(is('b')).toBe(false)
    expect(is('a')).toBe(true)
    send('toggle')
    expect(is('a')).toBe(true)
    setContext({ isPaused: false })
    send('toggle')
    expect(is('b')).toBe(true)
    send('toggle')
    expect(is('a')).toBe(true)
  })

  test('universal transition guard be guardin', () => {
    const toggleAtom = atom('toggle', () =>
      injectMachineSignal(
        state => [state('a').on('toggle', 'b'), state('b').on('toggle', 'a')],
        { isPaused: false },
        { guard: state => !state.context.isPaused }
      )
    )

    const signal = ecosystem.getInstance(toggleAtom)
      .S! as unknown as MachineSignal<'a' | 'b', 'toggle', { isPaused: boolean }>
    const { is, send, setContext } = signal

    send('toggle')
    expect(is('b')).toBe(true)
    setContext({ isPaused: true })
    send('toggle')
    expect(is('b')).toBe(true)
    send('toggle')
    expect(is('a')).toBe(false)
    expect(is('b')).toBe(true)
    send('toggle')
    expect(is('b')).toBe(true)
    setContext({ isPaused: false })
    send('toggle')
    expect(is('a')).toBe(true)
    send('toggle')
    expect(is('b')).toBe(true)
  })

  test('universal guard is called when state guard returns true', () => {
    const toggleAtom = atom('toggle', () =>
      injectMachineSignal(
        state => [
          state('a').on('toggle', 'b', () => true),
          state('b').on('toggle', 'a'),
        ],
        { isPaused: false },
        { guard: state => !state.context.isPaused }
      )
    )

    const signal = ecosystem.getInstance(toggleAtom)
      .S! as unknown as MachineSignal<'a' | 'b', 'toggle', { isPaused: boolean }>
    const { is, send, setContext } = signal

    send('toggle')
    expect(is('b')).toBe(true)
    setContext({ isPaused: true })
    send('toggle')
    expect(is('b')).toBe(true)
    send('toggle')
    expect(is('a')).toBe(false)
    expect(is('b')).toBe(true)
    send('toggle')
    expect(is('b')).toBe(true)
    setContext({ isPaused: false })
    send('toggle')
    expect(is('a')).toBe(true)
    send('toggle')
    expect(is('b')).toBe(true)
  })

  test('state transition listeners be listenin', () => {
    jest.useFakeTimers()

    const enter = jest.fn()
    const leave = jest.fn()
    const leave2 = jest.fn()
    const trafficLightAtom = atom('trafficLight', () =>
      injectMachineSignal(
        state => [
          state('green')
            .on('timer', 'yellow')
            .onEnter(signal => {
              const handle = setTimeout(() => signal.send('timer'))
              signal.setContext({ handle })
            }),
          state('yellow')
            .on('timer', 'red')
            .onEnter(signal => {
              const handle = setTimeout(() => signal.send('timer'))
              signal.setContext({ handle })
            })
            .onLeave(leave)
            .onLeave(leave2)
            .onEnter(enter),
          state('red')
            .on('timer', 'green')
            .onEnter(signal => {
              const handle = setTimeout(() => signal.send('timer'))
              signal.setContext({ handle })
            }),
        ],
        { handle: undefined as undefined | ReturnType<typeof setTimeout> }
      )
    )

    const signal = ecosystem.getInstance(trafficLightAtom)
      .S! as unknown as MachineSignal<
      'green' | 'yellow' | 'red',
      'timer',
      { handle: undefined | ReturnType<typeof setTimeout> }
    >
    const { getContext, is } = signal

    expect(is('green')).toBe(true)
    expect(enter).not.toHaveBeenCalled()
    jest.advanceTimersByTime(0)
    expect(is('yellow')).toBe(true)
    expect(leave).not.toHaveBeenCalled()
    expect(leave2).not.toHaveBeenCalled()
    expect(enter).toHaveBeenCalledTimes(1)
    jest.advanceTimersByTime(1)
    expect(is('red')).toBe(true)
    expect(leave).toHaveBeenCalledTimes(1)
    expect(leave2).toHaveBeenCalledTimes(1)
    jest.advanceTimersByTime(1)
    expect(is('green')).toBe(true)
    clearTimeout(getContext().handle as ReturnType<typeof setTimeout>)
  })

  test('universal transition listener be listenin', () => {
    const onTransition = jest.fn()

    const toggleAtom = atom('toggle', () =>
      injectMachineSignal(
        state => [state('a').on('toggle', 'b'), state('b').on('toggle', 'a')],
        undefined,
        { onTransition }
      )
    )

    const instance = ecosystem.getInstance(toggleAtom)
    const signal = instance.S! as unknown as MachineSignal<'a' | 'b', 'toggle'>
    const { send } = signal

    send('toggle')
    send('toggle')
    send('toggle')
    // @ts-expect-error invalid signal name:
    send('invalid')
    send('toggle')

    expect(onTransition).toHaveBeenCalledTimes(4)
    expect(onTransition).toHaveBeenLastCalledWith(
      signal,
      expect.objectContaining({
        newState: { context: undefined, value: 'a' },
        oldState: { context: undefined, value: 'b' },
      })
    )
  })

  test('onEnter calling setContext during initial evaluation does not loop', () => {
    const enterCalls = jest.fn()
    const machineAtom = atom('onEnterSetCtx', () =>
      injectMachineSignal(
        state => [
          state('idle')
            .on('start', 'running')
            .onEnter(signal => {
              enterCalls()
              signal.setContext({ initialized: true })
            }),
          state('running').on('stop', 'idle'),
        ],
        { initialized: false }
      )
    )

    const instance = ecosystem.getInstance(machineAtom)
    const signal = instance.S! as unknown as MachineSignal<
      'idle' | 'running',
      'start' | 'stop',
      { initialized: boolean }
    >

    expect(enterCalls).toHaveBeenCalledTimes(1)
    expect(signal.getContext()).toEqual({ initialized: true })
    expect(signal.getValue()).toBe('idle')
  })

  test('onEnter and onLeave receive correct event arguments', () => {
    const onEnterA = jest.fn()
    const onLeaveA = jest.fn()
    const onEnterB = jest.fn()

    const machineAtom = atom('hookArgs', () =>
      injectMachineSignal(state => [
        state('a').on('next', 'b').onEnter(onEnterA).onLeave(onLeaveA),
        state('b').on('next', 'a').onEnter(onEnterB),
      ])
    )

    const instance = ecosystem.getInstance(machineAtom)
    const signal = instance.S! as unknown as MachineSignal<'a' | 'b', 'next'>

    // Initial onEnter for 'a' has newState but no oldState
    expect(onEnterA).toHaveBeenCalledTimes(1)
    expect(onEnterA).toHaveBeenCalledWith(signal, {
      newState: { context: undefined, value: 'a' },
    })

    signal.send('next') // a -> b

    expect(onLeaveA).toHaveBeenCalledTimes(1)
    expect(onLeaveA).toHaveBeenCalledWith(signal, {
      newState: { context: undefined, value: 'b' },
      oldState: { context: undefined, value: 'a' },
    })

    expect(onEnterB).toHaveBeenCalledTimes(1)
    expect(onEnterB).toHaveBeenCalledWith(signal, {
      newState: { context: undefined, value: 'b' },
      oldState: { context: undefined, value: 'a' },
    })
  })

  test('state guard receives context as its argument', () => {
    const guardSpy = jest.fn(() => true)

    const machineAtom = atom('stateGuardArg', () =>
      injectMachineSignal(
        state => [state('a').on('next', 'b', guardSpy), state('b')],
        { count: 42 }
      )
    )

    const instance = ecosystem.getInstance(machineAtom)
    const signal = instance.S! as unknown as MachineSignal<
      'a' | 'b',
      'next',
      { count: number }
    >

    signal.send('next')
    expect(guardSpy).toHaveBeenCalledWith({ count: 42 })
    expect(signal.getValue()).toBe('b')
  })

  test('universal guard receives currentState and nextValue', () => {
    const guardSpy = jest.fn(() => true)

    const machineAtom = atom('universalGuardArg', () =>
      injectMachineSignal(
        state => [state('a').on('next', 'b'), state('b')],
        { count: 7 },
        { guard: guardSpy }
      )
    )

    const instance = ecosystem.getInstance(machineAtom)
    const signal = instance.S! as unknown as MachineSignal<
      'a' | 'b',
      'next',
      { count: number }
    >

    signal.send('next')
    expect(guardSpy).toHaveBeenCalledWith(
      { context: { count: 7 }, value: 'a' },
      'b'
    )
    expect(signal.getValue()).toBe('b')
  })

  test('state guard returning false prevents universal guard from running', () => {
    const universalGuard = jest.fn(() => true)

    const machineAtom = atom('guardOrder', () =>
      injectMachineSignal(
        state => [state('a').on('next', 'b', () => false), state('b')],
        undefined,
        { guard: universalGuard }
      )
    )

    const instance = ecosystem.getInstance(machineAtom)
    const signal = instance.S! as unknown as MachineSignal<'a' | 'b', 'next'>

    signal.send('next')
    expect(signal.getValue()).toBe('a')
    expect(universalGuard).not.toHaveBeenCalled()
  })

  test('onTransition is not called for invalid transitions', () => {
    const onTransition = jest.fn()

    const machineAtom = atom('invalidTransition', () =>
      injectMachineSignal(
        state => [
          state('a').on('next', 'b'),
          state('b').on('back', 'a'),
        ],
        undefined,
        { onTransition }
      )
    )

    const instance = ecosystem.getInstance(machineAtom)
    const signal = instance.S! as unknown as MachineSignal<
      'a' | 'b',
      'next' | 'back'
    >

    signal.send('back') // invalid from 'a'
    expect(onTransition).not.toHaveBeenCalled()

    signal.send('next') // valid: a -> b
    expect(onTransition).toHaveBeenCalledTimes(1)

    signal.send('next') // invalid from 'b'
    expect(onTransition).toHaveBeenCalledTimes(1)
  })

  test('machine with terminal state stays in that state', () => {
    const machineAtom = atom('terminal', () =>
      injectMachineSignal(state => [
        state('alive').on('die', 'dead'),
        state('dead'),
      ])
    )

    const instance = ecosystem.getInstance(machineAtom)
    const signal = instance.S! as unknown as MachineSignal<
      'alive' | 'dead',
      'die'
    >

    expect(signal.getValue()).toBe('alive')
    signal.send('die')
    expect(signal.getValue()).toBe('dead')
    signal.send('die')
    expect(signal.getValue()).toBe('dead')
  })

  test('atom value updates when signal transitions', () => {
    const machineAtom = atom('atomReactivity', () =>
      injectMachineSignal(state => [
        state('a').on('next', 'b'),
        state('b').on('next', 'a'),
      ])
    )

    const instance = ecosystem.getInstance(machineAtom)
    const signal = instance.S! as unknown as MachineSignal<'a' | 'b', 'next'>

    expect(instance.v).toEqual({ context: undefined, value: 'a' })
    signal.send('next')
    expect(instance.v).toEqual({ context: undefined, value: 'b' })
    signal.send('next')
    expect(instance.v).toEqual({ context: undefined, value: 'a' })
  })

  test('setContext updates context without changing state value', () => {
    const machineAtom = atom('setCtxValue', () =>
      injectMachineSignal(
        state => [state('a').on('next', 'b'), state('b')],
        { count: 0 }
      )
    )

    const instance = ecosystem.getInstance(machineAtom)
    const signal = instance.S! as unknown as MachineSignal<
      'a' | 'b',
      'next',
      { count: number }
    >

    signal.setContext({ count: 1 })
    expect(signal.getValue()).toBe('a')
    expect(signal.getContext()).toEqual({ count: 1 })

    signal.setContext(ctx => ({ count: ctx.count + 1 }))
    expect(signal.getValue()).toBe('a')
    expect(signal.getContext()).toEqual({ count: 2 })
  })

  test('mutateContext deep-merges partial context', () => {
    const machineAtom = atom('deepMerge', () =>
      injectMachineSignal(
        state => [state('a')],
        { nested: { x: 1, y: 2 }, other: 'keep' }
      )
    )

    const instance = ecosystem.getInstance(machineAtom)
    const signal = instance.S! as unknown as MachineSignal<
      'a',
      never,
      { nested: { x: number; y: number }; other: string }
    >

    signal.mutateContext({ nested: { x: 99 } })
    expect(signal.getContext()).toEqual({ nested: { x: 99, y: 2 }, other: 'keep' })
  })

  test('mutateContext supports in-place mutation', () => {
    const machineAtom = atom('inPlaceMutate', () =>
      injectMachineSignal(
        state => [state('a')],
        { items: [1, 2, 3], label: 'test' }
      )
    )

    const instance = ecosystem.getInstance(machineAtom)
    const signal = instance.S! as unknown as MachineSignal<
      'a',
      never,
      { items: number[]; label: string }
    >

    signal.mutateContext(ctx => {
      ctx.items.push(4)
      ctx.label = 'updated'
    })
    expect(signal.getContext()).toEqual({ items: [1, 2, 3, 4], label: 'updated' })
  })

  test('send with object form processes events sequentially', () => {
    const machineAtom = atom('sendObject', () =>
      injectMachineSignal(state => [
        state('a').on('next', 'b'),
        state('b').on('next', 'c'),
        state('c').on('back', 'a'),
      ])
    )

    const instance = ecosystem.getInstance(machineAtom)
    const signal = instance.S! as unknown as MachineSignal<
      'a' | 'b' | 'c',
      'next' | 'back'
    >

    expect(signal.getValue()).toBe('a')

    // next: a -> b, then next again: b -> c
    signal.send({ next: undefined } as any)
    expect(signal.getValue()).toBe('b')

    signal.send({ next: undefined, back: undefined } as any)
    // next: b -> c, back: c -> a
    expect(signal.getValue()).toBe('a')
  })
})
