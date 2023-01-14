import { actionTypes, createActor, createStore, when } from '@zedux/core/index'
import { getDoorMachine, getToggleMachine } from '../utils'

const doNothing = createActor('doNothing')
const doSomething = createActor('doSomething')

describe('WhenBuilder', () => {
  describe('.enters()/.leaves()', () => {
    test('calls nothing if the machine state has not changed', () => {
      const store = getToggleMachine()
      const subscriber = jest.fn()

      when(store).leaves('a', subscriber)

      store.dispatch(doNothing())

      expect(subscriber).not.toHaveBeenCalled()
    })

    test('calls nothing if store state changes, but machine status does not', () => {
      const store = getDoorMachine()
      const subscriber = jest.fn()

      when(store).leaves('open', subscriber)

      store.setContextDeep({ other: 'a' })

      expect(subscriber).not.toHaveBeenCalled()
    })

    test('registers an onEnter subscriber', () => {
      const store = getToggleMachine()
      const subscriber = jest.fn()

      when(store).enters('b', subscriber)

      store.send('toggle')

      expect(subscriber).toHaveBeenCalledTimes(1)
      expect(subscriber).toHaveBeenCalledWith(
        expect.objectContaining({
          action: {
            type: actionTypes.HYDRATE,
            payload: { value: 'b', context: undefined },
          },
          newState: { value: 'b', context: undefined },
          oldState: { value: 'a', context: undefined },
        })
      )
    })

    test('registers multiple onEnter subscribers', () => {
      const store = getToggleMachine()
      const subscriber1 = jest.fn()
      const subscriber2 = jest.fn()

      when(store)
        .enters('b', subscriber1)
        .enters('b', subscriber2)
        .enters('a', subscriber2)

      store.send('toggle')
      store.send('toggle')

      expect(subscriber1).toHaveBeenCalledTimes(1)
      expect(subscriber1).toHaveBeenCalledWith(
        expect.objectContaining({
          action: {
            type: actionTypes.HYDRATE,
            payload: { value: 'b', context: undefined },
          },
          newState: { value: 'b', context: undefined },
          oldState: { value: 'a', context: undefined },
        })
      )

      expect(subscriber2).toHaveBeenCalledTimes(2)
      expect(subscriber2).toHaveBeenLastCalledWith(
        expect.objectContaining({
          action: {
            type: actionTypes.HYDRATE,
            payload: { value: 'a', context: undefined },
          },
          newState: { value: 'a', context: undefined },
          oldState: { value: 'b', context: undefined },
        })
      )
    })

    test('registers an onLeave subscriber', () => {
      const store = getToggleMachine()
      const subscriber = jest.fn()

      when(store).leaves('a', subscriber)

      store.send('toggle')

      expect(subscriber).toHaveBeenCalledTimes(1)
      expect(subscriber).toHaveBeenCalledWith(
        expect.objectContaining({
          action: {
            type: actionTypes.HYDRATE,
            payload: { value: 'b', context: undefined },
          },
          newState: { value: 'b', context: undefined },
          oldState: { value: 'a', context: undefined },
        })
      )
    })

    test('registers multiple onLeave subscribers', () => {
      const store = getToggleMachine()
      const subscriber1 = jest.fn()
      const subscriber2 = jest.fn()

      when(store)
        .leaves('a', subscriber1)
        .leaves('a', subscriber2)
        .leaves('b', subscriber2)

      store.send('toggle')
      store.send('toggle')

      expect(subscriber1).toHaveBeenCalledTimes(1)
      expect(subscriber1).toHaveBeenCalledWith(
        expect.objectContaining({
          action: {
            type: actionTypes.HYDRATE,
            payload: { value: 'b', context: undefined },
          },
          newState: { value: 'b', context: undefined },
          oldState: { value: 'a', context: undefined },
        })
      )

      expect(subscriber2).toHaveBeenCalledTimes(2)
      expect(subscriber2).toHaveBeenLastCalledWith(
        expect.objectContaining({
          action: {
            type: actionTypes.HYDRATE,
            payload: { value: 'a', context: undefined },
          },
          newState: { value: 'a', context: undefined },
          oldState: { value: 'b', context: undefined },
        })
      )
    })

    test('does not call subscribers when their state has not been entered or left', () => {
      const store = getDoorMachine()
      const openEnter = jest.fn()
      const openLeave = jest.fn()
      const closedLeave = jest.fn()

      when(store)
        .enters('open', openEnter)
        .leaves('open', openLeave)
        .leaves('closed', closedLeave)

      store.send('buttonPress')
      store.send('buttonPress')

      expect(openEnter).not.toHaveBeenCalled()
      expect(openLeave).toHaveBeenCalledTimes(1)
      expect(openLeave).toHaveBeenCalledWith(
        expect.objectContaining({
          action: {
            type: actionTypes.HYDRATE,
            payload: { value: 'closing', context: { timeoutId: null } },
          },
          newState: { value: 'closing', context: { timeoutId: null } },
          oldState: { value: 'open', context: { timeoutId: null } },
        })
      )
      expect(closedLeave).not.toHaveBeenCalled()
    })
  })

  describe('.receivesAction()', () => {
    test('with no type passed, action handler is called every time any action is dispatched', () => {
      const store = createStore()
      const subscriber = jest.fn()

      when(store).receivesAction(subscriber)

      expect(subscriber).not.toHaveBeenCalled()

      store.dispatch(doNothing())

      expect(subscriber).toHaveBeenCalledTimes(1)
      expect(subscriber).toHaveBeenLastCalledWith(
        expect.objectContaining({
          action: { type: doNothing.type },
        })
      )

      store.use(() => 1)

      expect(subscriber).toHaveBeenCalledTimes(2)
      expect(subscriber).toHaveBeenLastCalledWith(
        expect.objectContaining({
          action: { type: actionTypes.RECALCULATE },
        })
      )
    })

    test('when a type is passed, action handler is only called when that action is dispatched', () => {
      const store = createStore()
      const subscriber = jest.fn()
      const subscriber2 = jest.fn()

      when(store)
        .receivesAction(doSomething, subscriber)
        .receivesAction(doSomething, subscriber2)

      expect(subscriber).not.toHaveBeenCalled()
      expect(subscriber2).not.toHaveBeenCalled()

      store.dispatch(doNothing())

      expect(subscriber).not.toHaveBeenCalled()
      expect(subscriber2).not.toHaveBeenCalled()

      store.dispatch(doSomething())

      expect(subscriber).toHaveBeenCalledTimes(1)
      expect(subscriber).toHaveBeenLastCalledWith(
        expect.objectContaining({
          action: { type: doSomething.type },
        })
      )

      expect(subscriber2).toHaveBeenCalledTimes(1)
      expect(subscriber2).toHaveBeenLastCalledWith(
        expect.objectContaining({
          action: { type: doSomething.type },
        })
      )
    })
  })

  describe('.stateChanges()', () => {
    test('effect handler is called every time state changes', () => {
      const store = createStore()
      const subscriber = jest.fn()

      when(store).stateChanges(subscriber)

      store.setState('a')

      expect(subscriber).toHaveBeenCalledTimes(1)
      expect(subscriber).toHaveBeenLastCalledWith(
        expect.objectContaining({
          newState: 'a',
          oldState: undefined,
        })
      )

      store.setState('b')

      expect(subscriber).toHaveBeenCalledTimes(2)
      expect(subscriber).toHaveBeenLastCalledWith(
        expect.objectContaining({
          newState: 'b',
          oldState: 'a',
        })
      )
    })

    test('effect handler is not called if state does not change', () => {
      const store = createStore()
      const subscriber = jest.fn()

      when(store).stateChanges(subscriber)

      store.dispatch(doNothing())
      store.setState(undefined)

      expect(subscriber).not.toHaveBeenCalled()
    })
  })

  describe('.stateMatches()', () => {
    test('effect handler is called when state matches predicate', () => {
      const store = createStore()
      const subscriber = jest.fn()

      when(store).stateMatches(val => val === 'a', subscriber)

      store.setState('a')

      expect(subscriber).toHaveBeenCalledTimes(1)
      expect(subscriber).toHaveBeenLastCalledWith(
        expect.objectContaining({
          action: { type: actionTypes.HYDRATE, payload: 'a' },
          newState: 'a',
          oldState: undefined,
        })
      )
    })

    test('effect handler is not called when state does not match predicate', () => {
      const store = createStore()
      const subscriber = jest.fn()

      when(store).stateMatches(val => val === 'b', subscriber)

      store.setState('a')

      expect(subscriber).not.toHaveBeenCalled()
    })

    test('effect handler is only called when newState matches predicate and oldState did not', () => {
      const store = createStore(null, 'apple')
      const subscriber = jest.fn()

      when(store).stateMatches(val => !!val?.startsWith('a'), subscriber)

      store.setState('apricot')

      expect(subscriber).not.toHaveBeenCalled()

      store.setState('banana')

      expect(subscriber).not.toHaveBeenCalled()

      store.setState('acorn')

      expect(subscriber).toHaveBeenCalledTimes(1)
      expect(subscriber).toHaveBeenLastCalledWith(
        expect.objectContaining({
          action: { type: actionTypes.HYDRATE, payload: 'acorn' },
          newState: 'acorn',
          oldState: 'banana',
        })
      )
    })
  })

  test('.subscription is set to the subscription', () => {
    const store = getToggleMachine()
    const subscriber = jest.fn()

    const { subscription } = when(store).stateChanges(subscriber)

    subscription.unsubscribe()

    store.send('toggle')

    expect(subscriber).not.toHaveBeenCalled()
  })
})
