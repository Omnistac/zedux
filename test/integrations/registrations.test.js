import { createStore } from '../../src/index'


describe('registrations', () => {

  describe('subscriptions', () => {

    test('all subscribers are notified of a state update', () => {

      const store = createStore()
      const subscribers = Array(20).join` `.split` `.map(() => jest.fn())

      subscribers.forEach(store.subscribe)

      store.dispatch(() => 'a')

      subscribers.forEach(subscriber =>
        expect(subscriber).toHaveBeenCalledWith(undefined, 'a')
      )

    })


    test('subscribers can be added or removed whenever', () => {

      const store = createStore()

      let subscriber1 = jest.fn()
      let subscription1 = store.subscribe(subscriber1)

      let subscriber2 = jest.fn()
      let subscription2 = store.subscribe(subscriber2)

      subscription1.unsubscribe()
      subscription1.unsubscribe() // does nothing
      subscription1.unsubscribe() // does nothing

      let subscriber3 = jest.fn()
      let subscription3 = store.subscribe(subscriber3)

      store.dispatch(() => 'a')

      expect(subscriber1).not.toHaveBeenCalled()
      expect(subscriber2).toHaveBeenCalledWith(undefined, 'a')
      expect(subscriber3).toHaveBeenCalledWith(undefined, 'a')

      subscription2.unsubscribe()

      subscription1 = store.subscribe(subscriber1)

      store.dispatch(() => 'b')

      expect(subscriber1).toHaveBeenCalledWith('a', 'b')
      expect(subscriber2).toHaveBeenLastCalledWith(undefined, 'a')
      expect(subscriber3).toHaveBeenLastCalledWith('a', 'b')

      subscription3.unsubscribe()

      let subscriber4 = jest.fn()

      // subscribe inside a subscriber
      let subscriber5 = jest.fn(
        () => store.subscribe(subscriber4)
      )
      store.subscribe(subscriber5)

      store.dispatch(() => 'c')

      expect(subscriber1).toHaveBeenLastCalledWith('b', 'c')
      expect(subscriber2).toHaveBeenLastCalledWith(undefined, 'a')
      expect(subscriber3).toHaveBeenLastCalledWith('a', 'b')
      expect(subscriber4).not.toHaveBeenCalled()
      expect(subscriber5).toHaveBeenCalledWith('b', 'c')

      subscription1.unsubscribe()

      store.dispatch(() => 'd')

      expect(subscriber1).toHaveBeenLastCalledWith('b', 'c')
      expect(subscriber2).toHaveBeenLastCalledWith(undefined, 'a')
      expect(subscriber3).toHaveBeenLastCalledWith('a', 'b')
      expect(subscriber4).toHaveBeenCalledWith('c', 'd')
      expect(subscriber5).toHaveBeenLastCalledWith('c', 'd')

    })

  })


  describe('inspections', () => {

    const storeBase = {
      dispatch: expect.any(Function),
      getState: expect.any(Function)
    }


    test('all inspectors are notified of an action', () => {

      const store = createStore()
      const inspections = Array(20).join` `.split` `.map(() => jest.fn())
      const action = {
        type: 'a'
      }

      inspections.forEach(store.inspect)

      store.dispatch(action)

      inspections.forEach(subscriber =>
        expect(subscriber).toHaveBeenCalledWith(storeBase, action)
      )

    })


    test('inspectors can be added or removed whenever', () => {

      const store = createStore()

      let inspector1 = jest.fn()
      let inspection1 = store.inspect(inspector1)

      let inspector2 = jest.fn()
      let inspection2 = store.inspect(inspector2)

      inspection1.uninspect()
      inspection1.uninspect() // does nothing
      inspection1.uninspect() // does nothing

      let inspector3 = jest.fn()
      let inspection3 = store.inspect(inspector3)

      store.dispatch({ type: 'a' })

      expect(inspector1).not.toHaveBeenCalled()
      expect(inspector2).toHaveBeenCalledWith(storeBase, { type: 'a' })
      expect(inspector3).toHaveBeenCalledWith(storeBase, { type: 'a' })

      inspection2.uninspect()

      inspection1 = store.inspect(inspector1)

      store.dispatch({ type: 'b' })

      expect(inspector1).toHaveBeenCalledWith(storeBase, { type: 'b' })
      expect(inspector2).toHaveBeenLastCalledWith(storeBase, { type: 'a' })
      expect(inspector3).toHaveBeenLastCalledWith(storeBase, { type: 'b' })

      inspection3.uninspect()

      let inspector4 = jest.fn()

      // inspect inside an inspector
      let inspector5 = jest.fn(
        () => store.inspect(inspector4)
      )
      store.inspect(inspector5)

      store.dispatch({ type: 'c' })

      expect(inspector1).toHaveBeenLastCalledWith(storeBase, { type: 'c' })
      expect(inspector2).toHaveBeenLastCalledWith(storeBase, { type: 'a' })
      expect(inspector3).toHaveBeenLastCalledWith(storeBase, { type: 'b' })
      expect(inspector4).not.toHaveBeenCalled()
      expect(inspector5).toHaveBeenCalledWith(storeBase, { type: 'c' })

      inspection1.uninspect()

      store.dispatch({ type: 'd' })

      expect(inspector1).toHaveBeenLastCalledWith(storeBase, { type: 'c' })
      expect(inspector2).toHaveBeenLastCalledWith(storeBase, { type: 'a' })
      expect(inspector3).toHaveBeenLastCalledWith(storeBase, { type: 'b' })
      expect(inspector4).toHaveBeenCalledWith(storeBase, { type: 'd' })
      expect(inspector5).toHaveBeenLastCalledWith(storeBase, { type: 'd' })

    })

  })


  test('a parent store unsubscribes from ')

})
