import { createStore } from '../../src/index'


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
