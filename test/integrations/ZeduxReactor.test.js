import { react } from '../../src/index'


describe('ZeduxReactor configuration', () => {

  test('.toEverything().withProcessors() registers a processor that will be called for all action types', () => {

    const processor = jest.fn()
    const reactor = react()
      .toEverything()
      .withProcessors(processor)

    reactor.process(null, 'a', null)

    expect(processor).toHaveBeenCalledWith(null, 'a', null)

  })


  test('.toEverything().withReducers() registers a reducer that will be called for all action types', () => {

    const reducer = jest.fn()
    const reactor = react()
      .toEverything()
      .withReducers(reducer)

    reactor(null, 'a')

    expect(reducer).toHaveBeenCalledWith(null, 'a')

  })


  test('.to().withProcessors() registers a processor that will be called only for the given action type', () => {

    const processor = jest.fn()
    const reactor = react()
      .to('a')
      .withProcessors(processor)

    reactor.process(null, { type: 'a' }, null)
    reactor.process(null, { type: 'b' }, null)

    expect(processor).toHaveBeenLastCalledWith(null, { type: 'a' }, null)
    expect(processor).toHaveBeenCalledTimes(1)

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


  test('.withProcessors() and .withReducers() can be used and re-used together', () => {

    const processor = jest.fn()
    const reducer = jest.fn(state => state)
    const reactor = react()
      .to('a')
      .withProcessors(processor)
      .withReducers(reducer)
      .withProcessors(processor)
      .withReducers(reducer)

    reactor(null, { type: 'a' })
    reactor(null, { type: 'b' })
    reactor.process(null, { type: 'a' }, null)
    reactor.process(null, { type: 'b' }, null)

    expect(processor).toHaveBeenLastCalledWith(null, { type: 'a' }, null)
    expect(processor).toHaveBeenCalledTimes(2)

    expect(reducer).toHaveBeenLastCalledWith(null, { type: 'a' })
    expect(reducer).toHaveBeenCalledTimes(2)

  })


  test('calling another .to*() method replaces the previous set of action types', () => {

    const processor1 = jest.fn()
    const processor2 = jest.fn()
    const reactor = react()
      .to('a')
      .to('b')
      .withProcessors(processor1)

      .to('c')
      .toEverything()
      .withProcessors(processor2)

    reactor.process(null, { type: 'a' }, null)
    reactor.process(null, { type: 'b' }, null)
    reactor.process(null, { type: 'c' }, null)

    expect(processor1).toHaveBeenLastCalledWith(null, { type: 'b' }, null)
    expect(processor1).toHaveBeenCalledTimes(1)

    expect(processor2).toHaveBeenLastCalledWith(null, { type: 'c' }, null)
    expect(processor2).toHaveBeenCalledTimes(3)

  })


  test('multiple actions can be mapped to multiple processors and reducers', () => {

    const processor1 = jest.fn()
    const processor2 = jest.fn()
    const reducer1 = jest.fn()
    const reducer2 = jest.fn()
    const reactor = react()
      .to('a', 'b')
      .withProcessors(processor1, processor2)
      .withReducers(reducer1, reducer2)

    reactor(null, { type: 'a' })
    reactor(null, { type: 'b' })
    reactor.process(null, { type: 'a' })
    reactor.process(null, { type: 'b' })

    expect(processor1).toHaveBeenCalledTimes(2)
    expect(processor2).toHaveBeenCalledTimes(2)

    expect(reducer1).toHaveBeenCalledTimes(2)
    expect(reducer2).toHaveBeenCalledTimes(2)

  })


  test('an action type can be either a string or a function with a "type" property', () => {

    const actionType1 = 'a'
    const actionType2 = () => {}

    actionType2.type = 'c'

    const processor = jest.fn()
    const reactor = react()
      .to(actionType1, actionType2)
      .withProcessors(processor)

    reactor.process(null, { type: 'a' }, null)
    reactor.process(null, { type: 'b' }, null)

    expect(processor).toHaveBeenLastCalledWith(null, { type: 'a' }, null)

    reactor.process(null, { type: 'c' }, null)
    reactor.process(null, { type: 'd' }, null)

    expect(processor).toHaveBeenLastCalledWith(null, { type: 'c' }, null)
    expect(processor).toHaveBeenCalledTimes(2)

  })


  test('a registered sub-processor can return a promise', done => {

    const processor = (storeBase, action) => new Promise(resolve => {
      setTimeout(() => {
        expect(action).toEqual({ type: 'a' })

        resolve()
        done()
      })
    })
    const reactor = react()
      .to('a')
      .withProcessors(processor)

    reactor.process(null, { type: 'a' })

  })


  test('a registered sub-processor can return an iterator', done => {

    const processor = function*() {

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
      .withProcessors(processor)

    reactor.process(null, { type: 'a' })

  })


  test('a registered sub-processor can return an observable', done => {

    const processor = () => ({
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
      .withProcessors(processor)

    reactor.process(null, { type: 'a' })

  })
})
