import { react } from '../../src/index'


describe('ZeduxReactor configuration', () => {

  test('.toEverything().withEffects() registers an effect creator that will be called for all action types', () => {

    const effectCreator = jest.fn()
    const reactor = react()
      .toEverything()
      .withEffects(effectCreator)

    reactor.effects('a', { type: 'b' })

    expect(effectCreator).toHaveBeenCalledWith('a', { type: 'b' })

  })


  test('.toEverything().withReducers() registers a reducer that will be called for all action types', () => {

    const reducer = jest.fn()
    const reactor = react()
      .toEverything()
      .withReducers(reducer)

    reactor(null, 'a')

    expect(reducer).toHaveBeenCalledWith(null, 'a')

  })


  test('.to().withEffects() registers an effect creator that will be called only for the given action type', () => {

    const effectCreator = jest.fn()
    const reactor = react()
      .to('a')
      .withEffects(effectCreator)

    reactor.effects(null, { type: 'a' })
    reactor.effects(null, { type: 'b' })

    expect(effectCreator).toHaveBeenLastCalledWith(null, { type: 'a' })
    expect(effectCreator).toHaveBeenCalledTimes(1)

  })


  test('.to().withReducers() registers a reducer that will be called only for the given action type', () => {

    const reducer = jest.fn()
    const reactor = react()
      .to('a')
      .withReducers(reducer)

    reactor(null, { type: 'a' })
    reactor(null, { type: 'b' })

    expect(reducer).toHaveBeenLastCalledWith(null, { type: 'a' })
    expect(reducer).toHaveBeenCalledTimes(1)

  })


  test('.withEffects() and .withReducers() can be used and re-used together', () => {

    const effectCreator = jest.fn()
    const reducer = jest.fn(state => state)
    const reactor = react()
      .to('a')
      .withEffects(effectCreator)
      .withReducers(reducer)
      .withEffects(effectCreator)
      .withReducers(reducer)

    reactor(null, { type: 'a' })
    reactor(null, { type: 'b' })
    reactor.effects(null, { type: 'a' })
    reactor.effects(null, { type: 'b' })

    expect(effectCreator).toHaveBeenLastCalledWith(null, { type: 'a' })
    expect(effectCreator).toHaveBeenCalledTimes(2)

    expect(reducer).toHaveBeenLastCalledWith(null, { type: 'a' })
    expect(reducer).toHaveBeenCalledTimes(2)

  })


  test('calling another .to*() method replaces the previous set of action types', () => {

    const effectCreator1 = jest.fn()
    const effectCreator2 = jest.fn()
    const reactor = react()
      .to('a')
      .to('b')
      .withEffects(effectCreator1)

      .to('c')
      .toEverything()
      .withEffects(effectCreator2)

    reactor.effects(null, { type: 'a' })
    reactor.effects(null, { type: 'b' })
    reactor.effects(null, { type: 'c' })

    expect(effectCreator1).toHaveBeenLastCalledWith(null, { type: 'b' })
    expect(effectCreator1).toHaveBeenCalledTimes(1)

    expect(effectCreator2).toHaveBeenLastCalledWith(null, { type: 'c' })
    expect(effectCreator2).toHaveBeenCalledTimes(3)

  })


  test('multiple actions can be mapped to multiple effect creators and reducers', () => {

    const effectCreator1 = jest.fn()
    const effectCreator2 = jest.fn()
    const reducer1 = jest.fn()
    const reducer2 = jest.fn()
    const reactor = react()
      .to('a', 'b')
      .withEffects(effectCreator1, effectCreator2)
      .withReducers(reducer1, reducer2)

    reactor(null, { type: 'a' })
    reactor(null, { type: 'b' })
    reactor.effects(null, { type: 'a' })
    reactor.effects(null, { type: 'b' })

    expect(effectCreator1).toHaveBeenCalledTimes(2)
    expect(effectCreator2).toHaveBeenCalledTimes(2)

    expect(reducer1).toHaveBeenCalledTimes(2)
    expect(reducer2).toHaveBeenCalledTimes(2)

  })


  test('an action type can be either a string or a function with a "type" property', () => {

    const actionType1 = 'a'
    const actionType2 = () => {}

    actionType2.type = 'c'

    const effectCreator = jest.fn()
    const reactor = react()
      .to(actionType1, actionType2)
      .withEffects(effectCreator)

    reactor.effects(null, { type: 'a' })
    reactor.effects(null, { type: 'b' })

    expect(effectCreator).toHaveBeenLastCalledWith(null, { type: 'a' })

    reactor.effects(null, { type: 'c' })
    reactor.effects(null, { type: 'd' })

    expect(effectCreator).toHaveBeenLastCalledWith(null, { type: 'c' })
    expect(effectCreator).toHaveBeenCalledTimes(2)

  })


  test('a registered sub-effectCreator can return a promise', done => {

    const effectCreator = (state, action) => new Promise(resolve => {
      setTimeout(() => {
        expect(action).toEqual({ type: 'a' })

        resolve()
        done()
      })
    })

    const reactor = react()
      .to('a')
      .withEffects(effectCreator)

    reactor.effects(null, { type: 'a' })

  })


  test('a registered sub-effectCreator can return an iterator', done => {

    const effectCreator = function*() {
      const val1 = yield new Promise(resolve => {
        setTimeout(() => {
          resolve(1)
        })
      })

      const val2 = yield 2

      const val3 = yield (function*() {
        return yield new Promise(resolve => {
          setTimeout(() => {
            resolve(3)
          })
        })
      }())

      expect(val1 + val2 + val3).toBe(6)
      done()
    }

    const reactor = react()
      .to('a')
      .withEffects(effectCreator)

    reactor.effects(null, { type: 'a' })

  })


  test('a registered sub-effectCreator can return an observable', done => {

    const effectCreator = () => ({
      subscribe(next, err, complete) {
        setTimeout(() => {

          expect(next).toBe(null)

          expect(typeof err).toBe('function')

          expect(typeof complete).toBe('function')

          complete()
          done()
        })
      }
    })

    const reactor = react()
      .to('a')
      .withEffects(effectCreator)

    reactor.effects(null, { type: 'a' })

  })

})
