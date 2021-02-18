import { applyMachineHooks } from '../src/applyMachineHooks'
import { createMachine, createStore, states } from '@zedux/core/index'

const [a, b, c] = states('a', 'b', 'c')

const machine = createMachine(a.on('b', b), b.on('c', c))

describe('MachineHooksBuilder', () => {
  test('calls nothing if the machine state has not changed', () => {
    const store = createStore(machine)
    const subscriber = jest.fn()

    applyMachineHooks(store, s => s).onLeave('a', subscriber)

    store.dispatch({ type: 'c' })
    store.dispatch({ type: 'a' })

    expect(subscriber).not.toHaveBeenCalled()
  })

  test('getSubscription() returns the subscription', () => {
    const store = createStore(machine)
    const subscriber = jest.fn()

    const { unsubscribe } = applyMachineHooks(store, s => s)
      .onLeave('a', subscriber)
      .getSubscription()

    unsubscribe()

    store.dispatch({ type: 'b' })

    expect(subscriber).not.toHaveBeenCalled()
  })

  test('registers an onEnter subscriber', () => {
    const store = createStore(machine)
    const subscriber = jest.fn()

    applyMachineHooks(store, s => s).onEnter('b', subscriber)

    store.dispatch({ type: 'b' })

    expect(subscriber).toHaveBeenCalledTimes(1)
    expect(subscriber).toHaveBeenCalledWith(
      expect.objectContaining({
        action: { type: 'b' },
        newState: 'b',
        oldState: 'a',
      })
    )
  })

  test('registers multiple onEnter subscribers', () => {
    const store = createStore(machine)
    const subscriber1 = jest.fn()
    const subscriber2 = jest.fn()

    applyMachineHooks(store, s => s)
      .onEnter('b', subscriber1)
      .onEnter('b', subscriber2)
      .onEnter('c', subscriber2)

    store.dispatch({ type: 'b' })
    store.dispatch({ type: 'c' })

    expect(subscriber1).toHaveBeenCalledTimes(1)
    expect(subscriber1).toHaveBeenCalledWith(
      expect.objectContaining({
        action: { type: 'b' },
        newState: 'b',
        oldState: 'a',
      })
    )

    expect(subscriber2).toHaveBeenCalledTimes(2)
    expect(subscriber2).toHaveBeenLastCalledWith(
      expect.objectContaining({
        action: { type: 'c' },
        newState: 'c',
        oldState: 'b',
      })
    )
  })

  test('registers an onLeave subscriber', () => {
    const store = createStore(machine)
    const subscriber = jest.fn()

    applyMachineHooks(store, s => s).onLeave('a', subscriber)

    store.dispatch({ type: 'b' })

    expect(subscriber).toHaveBeenCalledTimes(1)
    expect(subscriber).toHaveBeenCalledWith(
      expect.objectContaining({
        action: { type: 'b' },
        newState: 'b',
        oldState: 'a',
      })
    )
  })

  test('registers multiple onLeave subscribers', () => {
    const store = createStore(machine)
    const subscriber1 = jest.fn()
    const subscriber2 = jest.fn()

    applyMachineHooks(store, s => s)
      .onLeave('a', subscriber1)
      .onLeave('a', subscriber2)
      .onLeave('b', subscriber2)

    store.dispatch({ type: 'b' })
    store.dispatch({ type: 'c' })

    expect(subscriber1).toHaveBeenCalledTimes(1)
    expect(subscriber1).toHaveBeenCalledWith(
      expect.objectContaining({
        action: { type: 'b' },
        newState: 'b',
        oldState: 'a',
      })
    )

    expect(subscriber2).toHaveBeenCalledTimes(2)
    expect(subscriber2).toHaveBeenLastCalledWith(
      expect.objectContaining({
        action: { type: 'c' },
        newState: 'c',
        oldState: 'b',
      })
    )
  })

  test('does not call subscribers when their state has not been entered or left', () => {
    const store = createStore(machine)
    const aEnterSubscriber = jest.fn()
    const bLeaveSubscriber = jest.fn()
    const cLeaveSubscriber = jest.fn()

    applyMachineHooks(store, s => s)
      .onEnter('a', aEnterSubscriber)
      .onLeave('b', bLeaveSubscriber)
      .onLeave('c', cLeaveSubscriber)

    store.dispatch({ type: 'b' })
    store.dispatch({ type: 'c' })

    expect(aEnterSubscriber).not.toHaveBeenCalled()
    expect(bLeaveSubscriber).toHaveBeenCalledTimes(1)
    expect(bLeaveSubscriber).toHaveBeenCalledWith(
      expect.objectContaining({
        action: { type: 'c' },
        newState: 'c',
        oldState: 'b',
      })
    )
    expect(cLeaveSubscriber).not.toHaveBeenCalled()
  })
})
