import { createStore } from '../../src/index'
import { actionTypes, metaTypes } from '../../src/index'
import { dispatchables, nonDispatchables, nonPlainObjects } from '../utils'


describe('Store.dispatch()', () => {

  test('accepts a non-modifying inducer', () => {

    const store = createStore()
    const inducer = state => state

    const prevState = store.getState()
    const newState = store.dispatch(inducer)

    expect(prevState).toBe(newState)

  })


  test('accepts a modifying inducer', () => {

    const store = createStore()
    const inducer = () => 'a'

    const prevState = store.getState()
    const newState = store.dispatch(inducer)

    expect(prevState).not.toBe(newState)
    expect(newState).toBe('a')

  })


  test('throws a TypeError if the thing dispatched is not a plain object or a function', () => {

    const store = createStore()
      .use(() => 'a')

    nonDispatchables.forEach(
      nonDispatchable => expect(
        store.dispatch.bind(null, nonDispatchable)
      ).toThrow(TypeError)
    )

    dispatchables.forEach(
      dispatchable => expect(
        store.dispatch.bind(null, dispatchable)
      ).not.toThrow()
    )

  })


  test('short-circuits, hydrates, and returns the new state if the action has the special HYDRATE type', () => {

    const store = createStore()

    const action = {
      type: actionTypes.HYDRATE,
      payload: { a: 1 }
    }

    const prevState = store.getState()
    const newState = store.dispatch(action)

    expect(newState).not.toBe(prevState)
    expect(newState).toBe(action.payload)

  })


  test('short-circuits and returns the new state if the action contains the special DELEGATE meta node', () => {

    const store1 = createStore()
      .use(() => 1)
    const store2 = createStore()
      .use({
        a: store1
      })

    const action = {
      metaType: metaTypes.DELEGATE,
      metaPayload: [ 'a' ],
      action: {
        type: 'b'
      }
    }

    const prevState = store2.getState()

    expect(store2.dispatch(action)).toBe(prevState)

  })


  test('throws a TypeError if the dispatched action object does not have a string "type" property', () => {

    const store = createStore()
      .use(() => 'a')

    expect(store.dispatch.bind(null, {})).toThrow(TypeError)

    expect(store.dispatch.bind(null, { type: 1 })).toThrow(TypeError)

    expect(store.dispatch.bind(null, { type: '' })).not.toThrow()

  })


  test('dispatches a wrapped action to inspectors', () => {

    const inspector = jest.fn()
    const store = createStore()
      .use(() => 'a')

    const action = {
      metaType: 'b',
      action: {
        type: 'c'
      }
    }

    store.inspect(inspector)
    store.dispatch(action)

    expect(inspector).toHaveBeenLastCalledWith({
      dispatch: expect.any(Function),
      getState: expect.any(Function)
    }, action)

  })


  test('skips the reducer layer if the SKIP_REDUCERS meta node is present', () => {

    const reactor = jest.fn()
    reactor.process = jest.fn()

    const store = createStore()
      .use(reactor)

    const action = {
      metaType: metaTypes.SKIP_REDUCERS,
      action: {
        type: 'a'
      }
    }

    store.dispatch(action)

    expect(reactor).toHaveBeenCalledTimes(1)
    expect(reactor.process).toHaveBeenCalledTimes(2)

  })


  test('skips the processor layer if the SKIP_PROCESSORS meta node is present', () => {

    const reactor = jest.fn()
    reactor.process = jest.fn()

    const store = createStore()
      .use(reactor)

    const action = {
      metaType: metaTypes.SKIP_PROCESSORS,
      action: {
        type: 'a'
      }
    }

    store.dispatch(action)

    expect(reactor).toHaveBeenCalledTimes(2)
    expect(reactor.process).toHaveBeenCalledTimes(1)

  })


  test('does not inform subscribers if no changes were made', () => {

    const reducer = () => 1
    const subscriber = jest.fn()

    const store = createStore()
      .use({
        a: reducer
      })

    store.subscribe(subscriber)

    const action = {
      type: 'b'
    }

    store.dispatch(action)

    expect(subscriber).not.toHaveBeenCalled()

  })


  test('informs subscribers if changes were made', () => {

    const reducer = (state = 0) => state + 1
    const subscriber = jest.fn()

    const store = createStore()
      .use({
        a: reducer
      })

    store.subscribe(subscriber)

    const action = {
      type: 'b'
    }

    store.dispatch(action)

    expect(subscriber).toHaveBeenCalledWith({ a: 1 }, { a: 2 })
    expect(subscriber).toHaveBeenCalledTimes(1)

  })


  test('returns the old state if no changes were made', () => {

    const reducer = () => 1

    const store = createStore()
      .use({
        a: reducer
      })

    const action = {
      type: 'b'
    }

    const prevState = store.getState()
    const newState = store.dispatch(action)

    expect(prevState).toBe(newState)

  })


  test('returns the new state if changes were made', () => {

    const reducer = (state = 0) => state + 1

    const store = createStore()
      .use({
        a: reducer
      })

    const action = {
      type: 'b'
    }

    const prevState = store.getState()
    const newState = store.dispatch(action)

    expect(prevState).not.toBe(newState)
    expect(newState).toEqual({
      a: 2
    })

  })


  test('root reactor "process" property is optional', () => {

    const reducer = jest.fn()
    const store = createStore()
      .use(reducer)

    const action = {
      type: 'a'
    }

    store.dispatch(action)

    expect(reducer).toHaveBeenCalledTimes(2)

  })

})


describe('Store.getState()', () => {

  test('cannot be called inside a reducer; throws an Error', () => {

    const store = createStore()

    const reducer = state => {
      if (state) store.getState()

      return state || 'a'
    }

    store.use(reducer)

    const action = {
      type: 'b'
    }

    expect(store.dispatch.bind(null, action)).toThrow(Error)

  })


  test('returns the current state', () => {

    const store = createStore()

    expect(store.getState()).toBeUndefined()

    store.use(state => state || 'a')

    expect(store.getState()).toBe('a')

    store.dispatch(() => 'b')

    expect(store.getState()).toBe('b')

  })

})


describe('Store.hydrate()', () => {

  test('cannot be called inside a reducer; throws an Error', () => {

    const store = createStore()

    const reducer = state => {
      if (state) store.hydrate()

      return state || 'a'
    }

    store.use(reducer)

    const action = {
      type: 'b'
    }

    expect(store.dispatch.bind(null, action)).toThrow(Error)

  })


  test('short-circuits if the new state === the current state', () => {

    const obj = {}
    const store = createStore()
      .use(() => obj)

    store.hydrate(obj)

    expect(store.getState()).toBe(obj)

  })


  test('informs inspectors of the special HYDRATE action', () => {

    const inspector = jest.fn()
    const store = createStore()
    const hydratedState = { a: 1 }

    store.inspect(inspector)
    store.hydrate(hydratedState)

    expect(inspector).toHaveBeenCalledWith({
      dispatch: expect.any(Function),
      getState: expect.any(Function)
    }, {
      type: actionTypes.HYDRATE,
      payload: hydratedState
    })

  })


  test('informs subscribers of the new state', () => {

    const subscriber = jest.fn()
    const store = createStore()
    const hydratedState = { a: 1 }

    store.subscribe(subscriber)
    store.hydrate(hydratedState)

    expect(subscriber).toHaveBeenCalledWith(undefined, hydratedState)

  })


  test('returns the store for chaining', () => {

    const store = createStore()
      .hydrate('a')
      .hydrate('b')

    expect(store.getState()).toBe('b')

  })

})


describe('store.inspect()', () => {

  test('throws a TypeError if the inspector is not a function', () => {

    const store = createStore()

    nonDispatchables.forEach(
      nonDispatchable => expect(
        store.inspect.bind(null, nonDispatchable)
      ).toThrow(TypeError)
    )

  })


  test('returns an inspection object', () => {

    const store = createStore()

    const inspection = store.inspect(() => {})

    expect(inspection).toEqual({
      uninspect: expect.any(Function)
    })

  })

})


describe('store.setNodeOptions()', () => {

  test('throws a TypeError if the options hash is not a plain object', () => {

    const store = createStore()

    nonPlainObjects.forEach(
      nonPlainObject => expect(
        store.setNodeOptions.bind(null, nonPlainObject)
      ).toThrow(TypeError)
    )

  })


  test('throws an Error if the options hash contains an invalid option key', () => {

    const store = createStore()

    expect(store.setNodeOptions.bind(null, { a: 1 })).toThrow(Error)
    expect(store.setNodeOptions.bind(null, {
      clone: () => {},
      create: () => {},
      a: () => {}
    })).toThrow(Error)

  })


  test('throws a TypeError if the options hash contains a non-function option value', () => {

    const store = createStore()

    nonDispatchables.forEach(
      nonDispatchable => expect(
        store.setNodeOptions.bind(null, { clone: nonDispatchable })
      ).toThrow(TypeError)
    )

  })


  test('returns the store for chaining', () => {

    const store = createStore()
      .setNodeOptions({ clone: () => {} })

    expect(store.$$typeof).toBe(Symbol.for('zedux.store'))

  })

})


describe('Store.setState()', () => {

  test('cannot be called inside a reducer; throws an Error', () => {

    const store = createStore()

    const reducer = state => {
      if (state) store.setState()

      return state || 'a'
    }

    store.use(reducer)

    const action = {
      type: 'b'
    }

    expect(store.dispatch.bind(null, action)).toThrow(Error)

  })


  test('short-circuits if the new state === the current state', () => {

    const obj = {}
    const store = createStore()
      .use(() => obj)

    store.setState(obj)

    expect(store.getState()).toBe(obj)

  })


  test('informs inspectors of the special PARTIAL_HYDRATE action', () => {

    const inspector = jest.fn()
    const store = createStore()
    const hydratedState = { a: 1 }

    store.inspect(inspector)
    store.setState(hydratedState)

    expect(inspector).toHaveBeenCalledWith({
      dispatch: expect.any(Function),
      getState: expect.any(Function)
    }, {
      type: actionTypes.PARTIAL_HYDRATE,
      payload: hydratedState
    })

  })


  test('informs subscribers of the new state', () => {

    const subscriber = jest.fn()
    const store = createStore()
    const hydratedState = { a: 1 }

    store.subscribe(subscriber)
    store.setState(hydratedState)

    expect(subscriber).toHaveBeenCalledWith(undefined, hydratedState)

  })


  test('does nothing if the state did not change', () => {

    const store = createStore()
      .hydrate(1)

    const initialState = store.getState()

    const subscriber = jest.fn()
    store.subscribe(subscriber)

    const newState = store.setState(1)

    expect(subscriber).not.toHaveBeenCalled()
    expect(newState).toBe(initialState)

  })


  test('deeply merges the new state into the old state', () => {

    const initialState = {
      a: 1,
      b: {
        c: 2,
        d: {
          e: 3
        }
      }
    }

    const store = createStore()
      .hydrate(initialState)

    const newState = store.setState({
      b: {
        c: 4,
        f: 5
      }
    })

    expect(newState).toEqual({
      a: 1,
      b: {
        c: 4,
        d: {
          e: 3
        },
        f: 5
      }
    })

    expect(newState.b.d).toBe(initialState.b.d)

  })

})


describe('store.subscribe()', () => {

  test('throws a TypeError if the subscriber is not a function', () => {

    const store = createStore()

    nonDispatchables.forEach(
      nonDispatchable => expect(
        store.setNodeOptions.bind(null, nonDispatchable)
      ).toThrow(TypeError)
    )

  })


  test('returns a subscription object', () => {

    const store = createStore()

    const subscription = store.subscribe(() => {})

    expect(subscription).toEqual({
      unsubscribe: expect.any(Function)
    })

  })

})


describe('store.use()', () => {

  test('returns the store for chaining', () => {

    const store = createStore()
      .use()
      .use(() => {})
      .use(null)

    expect(store.$$typeof).toBe(Symbol.for('zedux.store'))

  })

})
