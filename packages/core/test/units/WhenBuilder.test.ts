import {
  actionTypes,
  createActor,
  createMachine,
  createStore,
  effectTypes,
  states,
  Store,
  when,
} from '@zedux/core/index'

const advance = createActor('advance')
const doNothing = createActor('doNothing')
const [a, b, c] = states('a', 'b', 'c')

const machine = createMachine(a.on(advance, b), b.on(advance, c))

describe('WhenBuilder', () => {
  describe('.machine()', () => {
    test('uses the identity function if no machine selector is passed', () => {
      const store = createStore(machine)
      const subscriber = jest.fn()

      when(store).machine().enters('b', subscriber)

      store.dispatch(advance())

      expect(subscriber).toHaveBeenCalledTimes(1)
      expect(subscriber).toHaveBeenLastCalledWith(
        expect.objectContaining({
          newState: 'b',
          oldState: 'a',
        })
      )
    })

    test('uses the machine selector passed', () => {
      const store = createStore({ machine })
      const subscriber = jest.fn()

      when(store)
        .machine(({ machine }) => machine)
        .leaves(a, subscriber)

      store.dispatch(advance())

      expect(subscriber).toHaveBeenCalledTimes(1)
      expect(subscriber).toHaveBeenLastCalledWith(
        expect.objectContaining({
          newState: { machine: 'b' },
          oldState: { machine: 'a' },
        })
      )
    })

    test('notifies enter() subscribers when the machine is added to the store', () => {
      const store = createStore()
      const subscriber = jest.fn()

      when(store).machine().enters(a, subscriber)

      store.dispatch(advance())

      expect(subscriber).not.toHaveBeenCalled()

      store.use(machine)

      expect(subscriber).toHaveBeenCalledTimes(1)
      expect(subscriber).toHaveBeenLastCalledWith(
        expect.objectContaining({
          newState: 'a',
          oldState: undefined,
        })
      )
    })

    test('calls nothing if the machine state has not changed', () => {
      const store = createStore(machine)
      const subscriber = jest.fn()

      when(store).machine().leaves('a', subscriber)

      store.dispatch(doNothing())

      expect(subscriber).not.toHaveBeenCalled()
    })

    test('calls nothing if store state changes, but machine state does not', () => {
      const store = createStore({ machine, other: () => 1 })
      const subscriber = jest.fn()

      when(store)
        .machine(({ machine }) => machine)
        .leaves(a, subscriber)

      store.setState({ other: 2 })

      expect(subscriber).not.toHaveBeenCalled()
    })

    test('registers an onEnter subscriber', () => {
      const store = createStore(machine)
      const subscriber = jest.fn()

      when(store).machine().enters(b, subscriber)

      store.dispatch(advance())

      expect(subscriber).toHaveBeenCalledTimes(1)
      expect(subscriber).toHaveBeenCalledWith(
        expect.objectContaining({
          action: { type: advance.type },
          newState: 'b',
          oldState: 'a',
        })
      )
    })

    test('registers multiple onEnter subscribers', () => {
      const store = createStore(machine)
      const subscriber1 = jest.fn()
      const subscriber2 = jest.fn()

      when(store)
        .machine()
        .enters(b, subscriber1)
        .enters('b', subscriber2)
        .enters(c, subscriber2)

      store.dispatch(advance())
      store.dispatch(advance())

      expect(subscriber1).toHaveBeenCalledTimes(1)
      expect(subscriber1).toHaveBeenCalledWith(
        expect.objectContaining({
          action: { type: advance.type },
          newState: 'b',
          oldState: 'a',
        })
      )

      expect(subscriber2).toHaveBeenCalledTimes(2)
      expect(subscriber2).toHaveBeenLastCalledWith(
        expect.objectContaining({
          action: { type: advance.type },
          newState: 'c',
          oldState: 'b',
        })
      )
    })

    test('registers an onLeave subscriber', () => {
      const store = createStore(machine)
      const subscriber = jest.fn()

      when(store).machine().leaves('a', subscriber)

      store.dispatch(advance())

      expect(subscriber).toHaveBeenCalledTimes(1)
      expect(subscriber).toHaveBeenCalledWith(
        expect.objectContaining({
          action: { type: advance.type },
          newState: 'b',
          oldState: 'a',
        })
      )
    })

    test('registers multiple onLeave subscribers', () => {
      const store = createStore(machine)
      const subscriber1 = jest.fn()
      const subscriber2 = jest.fn()

      when(store)
        .machine()
        .leaves('a', subscriber1)
        .leaves(a, subscriber2)
        .leaves('b', subscriber2)

      store.dispatch(advance())
      store.dispatch(advance())

      expect(subscriber1).toHaveBeenCalledTimes(1)
      expect(subscriber1).toHaveBeenCalledWith(
        expect.objectContaining({
          action: { type: advance.type },
          newState: 'b',
          oldState: 'a',
        })
      )

      expect(subscriber2).toHaveBeenCalledTimes(2)
      expect(subscriber2).toHaveBeenLastCalledWith(
        expect.objectContaining({
          action: { type: advance.type },
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

      when(store)
        .machine()
        .enters(a, aEnterSubscriber)
        .leaves(b, bLeaveSubscriber)
        .leaves(c, cLeaveSubscriber)

      store.dispatch(advance())
      store.dispatch(advance())

      expect(aEnterSubscriber).not.toHaveBeenCalled()
      expect(bLeaveSubscriber).toHaveBeenCalledTimes(1)
      expect(bLeaveSubscriber).toHaveBeenCalledWith(
        expect.objectContaining({
          action: { type: advance.type },
          newState: 'c',
          oldState: 'b',
        })
      )
      expect(cLeaveSubscriber).not.toHaveBeenCalled()
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

      store.use(machine)

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
        .receivesAction(advance, subscriber)
        .receivesAction(advance, subscriber2)

      expect(subscriber).not.toHaveBeenCalled()
      expect(subscriber2).not.toHaveBeenCalled()

      store.dispatch(doNothing())

      expect(subscriber).not.toHaveBeenCalled()
      expect(subscriber2).not.toHaveBeenCalled()

      store.dispatch(advance())

      expect(subscriber).toHaveBeenCalledTimes(1)
      expect(subscriber).toHaveBeenLastCalledWith(
        expect.objectContaining({
          action: { type: advance.type },
        })
      )

      expect(subscriber2).toHaveBeenCalledTimes(1)
      expect(subscriber2).toHaveBeenLastCalledWith(
        expect.objectContaining({
          action: { type: advance.type },
        })
      )
    })
  })

  describe('.receivesEffect()', () => {
    test('with no type passed, effect handler is called every time any effect is propagated', () => {
      const store = createStore()
      const subscriber = jest.fn()

      when(store).receivesEffect(subscriber)

      // Since `when` subscribes as soon as it's called, the SUBSCRIBER_ADDED effect will happen before .receivesEffect() is called
      expect(subscriber).not.toHaveBeenCalled()

      const subscription = store.subscribe(() => {})

      expect(subscriber).toHaveBeenCalledTimes(1)
      expect(subscriber).toHaveBeenLastCalledWith(
        expect.objectContaining({
          effect: { effectType: effectTypes.SUBSCRIBER_ADDED },
        })
      )

      subscription.unsubscribe()

      expect(subscriber).toHaveBeenCalledTimes(2)
      expect(subscriber).toHaveBeenLastCalledWith(
        expect.objectContaining({
          effect: { effectType: effectTypes.SUBSCRIBER_REMOVED },
        })
      )
    })

    test('when a type is passed, effect handler is only called when that effect is propagated', () => {
      const store = createStore()
      const subscriber = jest.fn()
      const subscriber2 = jest.fn()

      when(store)
        .receivesEffect(effectTypes.SUBSCRIBER_REMOVED, subscriber)
        .receivesEffect(effectTypes.SUBSCRIBER_REMOVED, subscriber2)

      // Since `when` subscribes as soon as it's called, the SUBSCRIBER_ADDED effect will happen before .receivesEffect() is called
      expect(subscriber).not.toHaveBeenCalled()
      expect(subscriber2).not.toHaveBeenCalled()

      const subscription = store.subscribe(() => {})

      expect(subscriber).not.toHaveBeenCalled()
      expect(subscriber2).not.toHaveBeenCalled()

      subscription.unsubscribe()

      expect(subscriber).toHaveBeenCalledTimes(1)
      expect(subscriber).toHaveBeenLastCalledWith(
        expect.objectContaining({
          effect: { effectType: effectTypes.SUBSCRIBER_REMOVED },
        })
      )

      expect(subscriber2).toHaveBeenCalledTimes(1)
      expect(subscriber2).toHaveBeenLastCalledWith(
        expect.objectContaining({
          effect: { effectType: effectTypes.SUBSCRIBER_REMOVED },
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
          action: { type: actionTypes.PARTIAL_HYDRATE, payload: 'a' },
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

      when(store).stateMatches(val => val.startsWith('a'), subscriber)

      store.setState('apricot')

      expect(subscriber).not.toHaveBeenCalled()

      store.setState('banana')

      expect(subscriber).not.toHaveBeenCalled()

      store.setState('acorn')

      expect(subscriber).toHaveBeenCalledTimes(1)
      expect(subscriber).toHaveBeenLastCalledWith(
        expect.objectContaining({
          action: { type: actionTypes.PARTIAL_HYDRATE, payload: 'acorn' },
          newState: 'acorn',
          oldState: 'banana',
        })
      )
    })
  })

  test('.subscription is set to the subscription', () => {
    const store = createStore(machine)
    const subscriber = jest.fn()

    const { subscription } = when(store)

    subscription.unsubscribe()

    store.dispatch({ type: 'b' })

    expect(subscriber).not.toHaveBeenCalled()
  })
})
