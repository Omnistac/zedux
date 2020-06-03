import {
  createStore,
  effectTypes,
  metaTypes,
  EffectChain,
  Effect,
} from '@src/index'
import { createMockReducer } from '@test/utils'

describe('registrations', () => {
  describe('subscriptions', () => {
    test('all subscribers are notified of a state update', () => {
      const store = createStore()
      const subscribers = Array(20)
        .join(' ')
        .split(' ')
        .map(() => jest.fn())

      subscribers.forEach(store.subscribe)

      store.setState(() => 'a')

      subscribers.forEach(subscriber =>
        expect(subscriber).toHaveBeenCalledWith('a', undefined)
      )
    })

    test('observer-style subscribers are notified of a state update', () => {
      const store = createStore()
      const observer = { next: jest.fn() }

      store.subscribe(observer)

      store.setState('a')

      expect(observer.next).toHaveBeenCalledWith('a', undefined)
      expect(observer.next).toHaveBeenCalledTimes(1)
    })

    test('subscribers can be added or removed whenever', () => {
      const store = createStore()

      const subscriber1 = jest.fn()
      let subscription1 = store.subscribe(subscriber1)

      const subscriber2 = jest.fn()
      const subscription2 = store.subscribe(subscriber2)

      subscription1.unsubscribe()
      subscription1.unsubscribe() // does nothing
      subscription1.unsubscribe() // does nothing

      const subscriber3 = jest.fn()
      const subscription3 = store.subscribe(subscriber3)

      store.setState(() => 'a')

      expect(subscriber1).not.toHaveBeenCalled()
      expect(subscriber2).toHaveBeenCalledWith('a', undefined)
      expect(subscriber3).toHaveBeenCalledWith('a', undefined)

      subscription2.unsubscribe()

      subscription1 = store.subscribe(subscriber1)

      store.setState(() => 'b')

      expect(subscriber1).toHaveBeenCalledWith('b', 'a')
      expect(subscriber2).toHaveBeenLastCalledWith('a', undefined)
      expect(subscriber3).toHaveBeenLastCalledWith('b', 'a')

      subscription3.unsubscribe()

      const subscriber4 = jest.fn()

      // subscribe inside a subscriber
      const subscriber5 = jest.fn(() => store.subscribe(subscriber4))
      store.subscribe(subscriber5)

      store.setState(() => 'c')

      expect(subscriber1).toHaveBeenLastCalledWith('c', 'b')
      expect(subscriber2).toHaveBeenLastCalledWith('a', undefined)
      expect(subscriber3).toHaveBeenLastCalledWith('b', 'a')
      expect(subscriber4).not.toHaveBeenCalled()
      expect(subscriber5).toHaveBeenCalledWith('c', 'b')

      subscription1.unsubscribe()

      store.setState(() => 'd')

      expect(subscriber1).toHaveBeenLastCalledWith('c', 'b')
      expect(subscriber2).toHaveBeenLastCalledWith('a', undefined)
      expect(subscriber3).toHaveBeenLastCalledWith('b', 'a')
      expect(subscriber4).toHaveBeenCalledWith('d', 'c')
      expect(subscriber5).toHaveBeenLastCalledWith('d', 'c')
    })

    test('a parent store unsubscribes from a removed child store', () => {
      const parent = createStore()
      const child = createStore()

      parent.use({
        a: createMockReducer(1),
        b: {
          c: {
            d: child,
            e: createMockReducer(2),
          },
        },
      })
      parent.use(null)

      const subscriber = jest.fn()
      parent.subscribe(subscriber)

      child.setState(() => 'a')

      expect(subscriber).not.toHaveBeenCalled()
    })
  })

  describe('error subscribers', () => {
    test('all error subscribers are notified of an error', () => {
      const err = new Error('a')
      const store = createStore(() => {
        throw err
      })
      const errorSubscribers = Array(20)
        .fill(null)
        .map(() => jest.fn())

      errorSubscribers.forEach(error => store.subscribe({ error }))

      store.dispatch({ type: 'b' })

      errorSubscribers.forEach(errorSubscriber =>
        expect(errorSubscriber).toHaveBeenCalledWith(err)
      )
    })

    test('the same error that is sent to error subscribers is returned from the dispatch', () => {
      const error1 = new Error('a')
      const reactor = () => {
        throw error1
      }

      const store = createStore(reactor)
      const errorSubscriber = jest.fn()

      store.subscribe({ error: errorSubscriber })

      const { error } = store.dispatch({ type: 'b' })

      expect(errorSubscriber).toHaveBeenCalledWith(error)
    })

    test('an error in a child store reducer notifies both child and parent error subscribers', () => {
      const error1 = new Error('a')
      const reactor = () => {
        throw error1
      }

      const child = createStore(reactor)
      const parent = createStore({
        b: child,
      })
      const childErrorSubscriber = jest.fn()
      const parentErrorSubscriber = jest.fn()

      child.subscribe({ error: childErrorSubscriber })
      parent.subscribe({ error: parentErrorSubscriber })

      const { error } = parent.dispatch({ type: 'c' })

      expect(childErrorSubscriber).toHaveBeenCalledWith(error)
      expect(parentErrorSubscriber).toHaveBeenCalledWith(error)
    })
  })

  describe('effects subscribers', () => {
    test('all effects subscribers are notified of a DISPATCH effect', () => {
      const store = createStore()
      const effectsSubscribers = Array(20)
        .fill(null)
        .map(() => jest.fn())

      effectsSubscribers.forEach(effects => store.subscribe({ effects }))

      store.dispatch({ type: 'a' })

      effectsSubscribers.forEach(effectsSubscriber => {
        expect(effectsSubscriber).toHaveBeenCalledTimes(1)

        expect(effectsSubscriber).toHaveBeenCalledWith(
          expect.objectContaining({
            effects: [
              {
                effectType: effectTypes.DISPATCH,
                payload: {
                  type: 'a',
                },
              },
            ],
          })
        )
      })
    })

    test('all upstream effects subscribers are notified of an error', () => {
      const error1 = new Error('a')
      const reactor = (state: any) => {
        if (state) throw error1

        return 1
      }
      const parent = createStore()
      const child = createStore()
      const grandchild = createStore()

      parent.use(
        child.use({
          grandchild,
          reactor,
        })
      )

      const parentEffectsSubscriber = jest.fn()
      const childEffectsSubscriber = jest.fn()
      const grandchildEffectsSubscriber = jest.fn()

      parent.subscribe({ effects: parentEffectsSubscriber })
      child.subscribe({ effects: childEffectsSubscriber })
      grandchild.subscribe({ effects: grandchildEffectsSubscriber })

      parent.dispatch({ type: 'c' })

      expect(parentEffectsSubscriber).toHaveBeenCalledTimes(1)
      expect(childEffectsSubscriber).toHaveBeenCalledTimes(1)
      expect(grandchildEffectsSubscriber).toHaveBeenCalledTimes(1)

      expect(parentEffectsSubscriber).toHaveBeenCalledWith(
        expect.objectContaining({
          error: error1,
        })
      )
      expect(childEffectsSubscriber).toHaveBeenCalledWith(
        expect.objectContaining({
          error: error1,
        })
      )
      expect(grandchildEffectsSubscriber).toHaveBeenCalledWith(
        expect.objectContaining({
          error: null,
        })
      )
    })

    test('all upstream effects subscribers are notified of all downstream effects', () => {
      const reactor = () => 1

      const parent = createStore()
      const child = createStore()
      const grandchild = createStore()

      parent.use(child.use({ grandchild, reactor }))

      const parentEffectsSubscriber = jest.fn()
      const childEffectsSubscriber = jest.fn()
      const grandchildEffectsSubscriber = jest.fn()

      parent.subscribe({ effects: parentEffectsSubscriber })
      child.subscribe({ effects: childEffectsSubscriber })
      grandchild.subscribe({ effects: grandchildEffectsSubscriber })

      child.dispatch({ type: 'c' })

      expect(parentEffectsSubscriber).toHaveBeenCalledTimes(1)
      expect(childEffectsSubscriber).toHaveBeenCalledTimes(1)
      expect(grandchildEffectsSubscriber).toHaveBeenCalledTimes(1)

      const dispatchEffect: Effect = {
        effectType: effectTypes.DISPATCH,
        payload: { type: 'c' },
      }
      const delegateEffect: EffectChain = {
        metaType: metaTypes.DELEGATE,
        metaData: [],
        payload: dispatchEffect,
      }
      const inheritEffect: Effect = {
        effectType: effectTypes.DISPATCH,
        payload: {
          metaType: metaTypes.INHERIT,
          payload: { type: 'c' },
        },
      }

      expect(parentEffectsSubscriber).toHaveBeenCalledWith(
        expect.objectContaining({
          effects: [delegateEffect],
        })
      )
      expect(childEffectsSubscriber).toHaveBeenCalledWith(
        expect.objectContaining({
          effects: [dispatchEffect],
        })
      )
      expect(grandchildEffectsSubscriber).toHaveBeenCalledWith(
        expect.objectContaining({
          effects: [inheritEffect],
        })
      )
    })

    test('a parent store unregisters its child store effects subscribers', () => {
      const parent = createStore()
      const child = createStore()

      parent.use({
        a: createMockReducer(1),
        b: {
          c: {
            d: child,
            e: createMockReducer(2),
          },
        },
      })
      parent.use(null)

      const effectsSubscriber = jest.fn()
      parent.subscribe({ effects: effectsSubscriber })

      child.setState(() => 'a')

      expect(effectsSubscriber).not.toHaveBeenCalled()
    })
  })
})
