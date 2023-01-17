import {
  api,
  atom,
  createEcosystem,
  injectMachineStore,
  InjectMachineStoreParams,
  MachineState,
} from '@zedux/react'

const ecosystem = createEcosystem({ id: 'state-machines-test' })
afterEach(() => ecosystem.reset())

const injectMachine = <
  States extends MachineState[],
  Context extends Record<string, any> | undefined = undefined
>(
  ...args: InjectMachineStoreParams<States, Context>
) => {
  const store = injectMachineStore(...args)
  return api(store)
    .setExports(store)
    .addExports({ getState: () => store.getState() })
}

describe('state machines', () => {
  test('toggler machine be togglin', () => {
    const toggleAtom = atom('toggle', () =>
      injectMachine(state => [
        state('a').on('toggle', 'b'),
        state('b').on('toggle', 'a'),
      ])
    )

    const instance = ecosystem.getInstance(toggleAtom)
    const { getValue, is, send } = instance.exports

    expect(instance.getState()).toEqual({ context: undefined, value: 'a' })
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
      injectMachine(state => [
        state('a').on('up', 'b'),
        state('b').on('up', 'c').on('down', 'a'),
        state('c').on('down', 'b'),
      ])
    )

    const { is, send } = ecosystem.getInstance(machineAtom).exports

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
      injectMachine(state => [state('a')], initialContext)
    )

    const {
      getContext,
      getState,
      setContext,
      setContextDeep,
    } = ecosystem.getInstance(machineAtom).exports

    expect(getContext()).toBe(initialContext)
    expect(getState()).toEqual({ context: initialContext, value: 'a' })
    setContextDeep({ b: { d: 4 } })
    expect(getContext()).toEqual({ a: 1, b: { c: 2, d: 4 } })
    setContextDeep(state => ({ b: { c: state.b.c + 1 } }))
    expect(getContext()).toEqual({ a: 1, b: { c: 3, d: 4 } })
    setContext(state => ({ ...state, a: 5 }))
    expect(getContext()).toEqual({ a: 5, b: { c: 3, d: 4 } })
    setContext(initialContext)
    expect(getContext()).toBe(initialContext)
  })

  test('state transition guard be guardin', () => {
    const toggleAtom = atom('toggle', () =>
      injectMachine(
        state => [
          state('a').on('toggle', 'b', context => !context.isPaused),
          state('b').on('toggle', 'a'),
        ],
        { isPaused: false }
      )
    )

    const { is, send, setContext } = ecosystem.getInstance(toggleAtom).exports

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
      injectMachine(
        state => [state('a').on('toggle', 'b'), state('b').on('toggle', 'a')],
        { isPaused: false },
        { guard: state => !state.context.isPaused }
      )
    )

    const { is, send, setContext } = ecosystem.getInstance(toggleAtom).exports

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
      injectMachine(
        state => [
          state('a').on('toggle', 'b', () => true),
          state('b').on('toggle', 'a'),
        ],
        { isPaused: false },
        { guard: state => !state.context.isPaused }
      )
    )

    const { is, send, setContext } = ecosystem.getInstance(toggleAtom).exports

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
      injectMachine(
        state => [
          state('green')
            .on('timer', 'yellow')
            .onEnter(store => {
              const handle = setTimeout(() => store.send('timer'))
              store.setContext({ handle })
            }),
          state('yellow')
            .on('timer', 'red')
            .onEnter(store => {
              const handle = setTimeout(() => store.send('timer'))
              store.setContext({ handle })
            })
            .onLeave(leave)
            .onLeave(leave2)
            .onEnter(enter),
          state('red')
            .on('timer', 'green')
            .onEnter(store => {
              const handle = setTimeout(() => store.send('timer'))
              store.setContext({ handle })
            }),
        ],
        { handle: undefined as undefined | ReturnType<typeof setTimeout> }
      )
    )

    const { getContext, is } = ecosystem.getInstance(trafficLightAtom).exports

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
      injectMachine(
        state => [state('a').on('toggle', 'b'), state('b').on('toggle', 'a')],
        undefined,
        { onTransition }
      )
    )

    const instance = ecosystem.getInstance(toggleAtom)
    const { send } = instance.exports

    send('toggle')
    send('toggle')
    send('toggle')
    // @ts-expect-error invalid signal name:
    send('invalid')
    send('toggle')

    expect(onTransition).toHaveBeenCalledTimes(4)
    expect(onTransition).toHaveBeenLastCalledWith(
      instance.store,
      expect.objectContaining({
        newState: { context: undefined, value: 'a' },
        oldState: { context: undefined, value: 'b' },
        store: instance.store,
      })
    )
  })
})
