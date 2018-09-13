import { createStore, effectTypes } from '../../src/index'


describe('registrations', () => {

  describe('subscriptions', () => {

    test('all subscribers are notified of a state update', () => {

      const store = createStore()
      const subscribers = Array(20).join` `.split` `.map(() => jest.fn())

      subscribers.forEach(store.subscribe)

      store.dispatch(() => 'a')

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

      store.dispatch(() => 'a')

      expect(subscriber1).not.toHaveBeenCalled()
      expect(subscriber2).toHaveBeenCalledWith('a', undefined)
      expect(subscriber3).toHaveBeenCalledWith('a', undefined)

      subscription2.unsubscribe()

      subscription1 = store.subscribe(subscriber1)

      store.dispatch(() => 'b')

      expect(subscriber1).toHaveBeenCalledWith('b', 'a')
      expect(subscriber2).toHaveBeenLastCalledWith('a', undefined)
      expect(subscriber3).toHaveBeenLastCalledWith('b', 'a')

      subscription3.unsubscribe()

      const subscriber4 = jest.fn()

      // subscribe inside a subscriber
      const subscriber5 = jest.fn(
        () => store.subscribe(subscriber4)
      )
      store.subscribe(subscriber5)

      store.dispatch(() => 'c')

      expect(subscriber1).toHaveBeenLastCalledWith('c', 'b')
      expect(subscriber2).toHaveBeenLastCalledWith('a', undefined)
      expect(subscriber3).toHaveBeenLastCalledWith('b', 'a')
      expect(subscriber4).not.toHaveBeenCalled()
      expect(subscriber5).toHaveBeenCalledWith('c', 'b')

      subscription1.unsubscribe()

      store.dispatch(() => 'd')

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
        a: () => 1,
        b: {
          c: {
            d: child,
            e: () => 2
          }
        }
      })
      parent.use(null)

      const subscriber = jest.fn()
      parent.subscribe(subscriber)

      child.dispatch(() => 'a')

      expect(subscriber).not.toHaveBeenCalled()

    })

  })


  describe('error subscribers', () => {

    test('all error subscribers are notified of an error', () => {

      const theError = new Error('a')
      const store = createStore(() => {
        throw theError
      })
      const errorSubscribers = Array(20).fill().map(() => jest.fn())
      const action = {
        type: 'b'
      }

      errorSubscribers.forEach(error => store.subscribe({ error }))

      store.dispatch(action)

      errorSubscribers.forEach(errorSubscriber =>
        expect(errorSubscriber).toHaveBeenCalledWith(theError)
      )

    })

  })


  describe('effects subscribers', () => {

    test('all effects subscribers are notified of an action', () => {

      const store = createStore()
      const effectsSubscribers = Array(20).fill().map(() => jest.fn())
      const action = {
        type: 'a'
      }

      effectsSubscribers.forEach(effects => store.subscribe({ effects }))

      store.dispatch(action)

      effectsSubscribers.forEach(effectsSubscriber =>
        expect(effectsSubscriber)
          .toHaveBeenCalledWith(expect.objectContaining({
            effects: [{
              effectType: effectTypes.DISPATCH,
              payload: {
                type: 'a'
              }
            }]
          }))
      )

    })


    test('a parent store unregisters its child store effects subscribers', () => {

      const parent = createStore()
      const child = createStore()

      parent.use({
        a: () => 1,
        b: {
          c: {
            d: child,
            e: () => 2
          }
        }
      })
      parent.use(null)

      const effectsSubscriber = jest.fn()
      parent.subscribe({ effects: effectsSubscriber })

      child.dispatch(() => 'a')

      expect(effectsSubscriber).not.toHaveBeenCalled()

    })

  })

})
