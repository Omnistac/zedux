import { createStore, internalTypes, Store } from '@zedux/core/index'
import {
  dispatchables,
  nonDispatchables,
  nonFunctions,
  createMockReducer,
  toggleDevMode,
} from '../utils'

describe('Store.dispatch()', () => {
  test('throws a TypeError if the thing dispatched is not a plain object', () => {
    const store = createStore()

    nonDispatchables.forEach(nonDispatchable =>
      expect(store.dispatch.bind(null, nonDispatchable)).toThrow(TypeError)
    )

    dispatchables.forEach(dispatchable =>
      expect(store.dispatch.bind(null, dispatchable)).not.toThrow()
    )
  })

  test('short-circuits, hydrates, and returns the new state if the action has the special `hydrate` type', () => {
    const store = createStore()

    const action = {
      type: internalTypes.hydrate,
      payload: { a: 1 },
    }

    const prevState = store.getState()
    const state = store.dispatch(action)

    expect(state).not.toBe(prevState)
    expect(state).toBe(action.payload)
  })

  test('short-circuits, hydrates, and returns the new state if the action has the special `merge` type', () => {
    const store = createStore()

    const action = {
      type: internalTypes.merge,
      payload: { a: 1 },
    }

    const prevState = store.getState()
    const state = store.dispatch(action)

    expect(state).not.toBe(prevState)
    expect(state).toBe(action.payload)
  })

  test('short-circuits and returns the new state if the action contains the special `delegate` meta node', () => {
    const reactor = createMockReducer(1)
    const child = createStore().use(reactor)
    const parent = createStore().use({
      a: child,
    })

    const action = {
      metaType: internalTypes.delegate,
      metaData: ['a'],
      payload: {
        type: 'b',
      },
    }

    const prevState = parent.getState()

    expect(parent.dispatch(action)).toBe(prevState)
    expect(reactor).toHaveBeenCalledWith(1, { type: 'b' })
  })

  test('throws an Error if the dispatched action object does not have a string "type" property', () => {
    const store = createStore()

    // @ts-expect-error type must be a string
    expect(() => store.dispatch({})).toThrowError(
      /action must have a string "type" property/i
    )

    // @ts-expect-error type must be a string
    expect(() => store.dispatch({ type: 1 })).toThrow(TypeError)
  })

  test('notifies effects subscribers of a wrapped action', () => {
    const effectsSubscriber = jest.fn()
    const store = createStore()

    const action = {
      metaType: 'a',
      payload: {
        type: 'b',
      },
    }

    store.subscribe({ effects: effectsSubscriber })
    store.dispatch(action)

    expect(effectsSubscriber).toHaveBeenLastCalledWith(
      expect.objectContaining({ action })
    )
  })

  test('does not inform subscribers if no changes were made', () => {
    const subscriber = jest.fn()

    const store = createStore().use({
      a: () => 1,
    })

    store.subscribe(subscriber)

    const action = {
      type: 'b',
    }

    store.dispatch(action)

    expect(subscriber).not.toHaveBeenCalled()
  })

  test('informs subscribers if changes were made', () => {
    const reducer = (state = 0) => state + 1
    const subscriber = jest.fn()

    const store = createStore().use({
      a: reducer,
    })

    store.subscribe(subscriber)

    const action = {
      type: 'b',
    }

    store.dispatch(action)

    expect(subscriber).toHaveBeenCalledWith({ a: 2 }, { a: 1 }, action)
    expect(subscriber).toHaveBeenCalledTimes(1)
  })

  test('returns the old state if no changes were made', () => {
    const store = createStore().use({
      a: () => 1,
    })

    const action = {
      type: 'b',
    }

    const prevState = store.getState()
    const state = store.dispatch(action)

    expect(prevState).toBe(state)
  })

  test('returns the new state if changes were made', () => {
    const reducer = (state = 0) => state + 1

    const store = createStore().use({
      a: reducer,
    })

    const action = {
      type: 'b',
    }

    const prevState = store.getState()
    const nextState = store.dispatch(action)

    expect(prevState).not.toBe(nextState)
    expect(nextState).toEqual({
      a: 2,
    })
  })
})

describe('Store.getState()', () => {
  test('cannot be called inside a reducer; throws an Error', () => {
    const store = createStore()

    const reducer = () => {
      store.getState()

      return 'a'
    }

    expect(() => store.use(reducer)).toThrowError(
      /cannot be called in a reducer/i
    )
  })

  test('returns the current state', () => {
    const store = createStore()

    expect(store.getState()).toBeUndefined()

    store.use(state => state || 'a')

    expect(store.getState()).toBe('a')

    store.setState(() => 'b')

    expect(store.getState()).toBe('b')
  })
})

describe('Store.setState()', () => {
  test('cannot be called inside a reducer; throws an Error', () => {
    const store = createStore()

    const reducer = (state: string) => {
      if (state) store.setState('a')

      return 'b'
    }

    store.use(reducer)

    const action = {
      type: 'c',
    }

    expect(() => store.dispatch(action)).toThrowError(
      /cannot be called in a reducer/i
    )
  })

  test('re-throws an error thrown in a state updater function', () => {
    const store = createStore()
    const update = (state: any) => ({ a: state.a })

    toggleDevMode(() => {
      expect(() => store.setState(update)).toThrowError()
    })
  })

  test('accepts a non-modifying setState function', () => {
    const store = createStore(null, {})
    const setState = (state: any) => state

    const prevState = store.getState()
    const nextState = store.setState(setState)

    expect(prevState).toBe(nextState)
  })

  test('accepts a modifying setState function', () => {
    const store = createStore()
    const setState = () => 'a'

    const prevState = store.getState()
    const state = store.setState(setState)

    expect(prevState).not.toBe(state)
    expect(state).toBe('a')
  })

  test('short-circuits if the new state === the current state', () => {
    const obj = { a: 1 }
    const store = createStore(null, obj)
    const prevState = store.getState()

    store.setState(obj)

    expect(store.getState()).toBe(prevState)
  })

  test('informs effect subscribers of the special hydrate action', () => {
    const effectsSubscriber = jest.fn()
    const store = createStore()
    const hydratedState = { a: 1 }

    store.subscribe({ effects: effectsSubscriber })
    store.setState(hydratedState)

    expect(effectsSubscriber).toHaveBeenCalledWith(
      expect.objectContaining({
        action: {
          type: internalTypes.hydrate,
          payload: hydratedState,
        },
      })
    )
  })

  test('informs subscribers of the new state', () => {
    const subscriber = jest.fn()
    const store = createStore()
    const hydratedState = { a: 1 }

    store.subscribe(subscriber)
    store.setState(hydratedState)

    expect(subscriber).toHaveBeenCalledWith(hydratedState, undefined, {
      payload: hydratedState,
      type: internalTypes.hydrate,
    })
  })

  test('does nothing if the state did not change', () => {
    const store = createStore(null, 1)

    const initialState = store.getState()

    const subscriber = jest.fn()
    store.subscribe(subscriber)

    const state = store.setState(1)

    expect(subscriber).not.toHaveBeenCalled()
    expect(state).toBe(initialState)
  })

  test('attaches the passed metadata as the `meta` property of the generated action', () => {
    const subscriber = jest.fn()
    const store = createStore()

    store.subscribe(subscriber)
    store.setState('a', 'b')

    expect(subscriber).toHaveBeenCalledWith('a', undefined, {
      meta: 'b',
      payload: 'a',
      type: internalTypes.hydrate,
    })
  })
})

describe('Store.setStateDeep()', () => {
  test('re-throws an error thrown in a state updater function', () => {
    const store = createStore()
    const update = (state: any) => ({ a: state.a })

    toggleDevMode(() => {
      expect(() => store.setStateDeep(update)).toThrowError()
    })
  })

  test('deeply merges the new state into the old state', () => {
    const initialState = {
      a: 1,
      b: {
        c: 2,
        d: {
          e: 3,
        },
      },
    }

    const store = createStore(null, initialState)

    const state = store.setStateDeep({
      b: {
        c: 4,
        // @ts-expect-error f doesn't exist in State type
        f: 5,
      },
    })

    expect(state).toEqual({
      a: 1,
      b: {
        c: 4,
        d: {
          e: 3,
        },
        f: 5,
      },
    })

    expect(state.b.d).toBe(initialState.b.d)
  })

  test('accepts a function overload', () => {
    const initialState = {
      a: 1,
      b: {
        c: 2,
        d: {
          e: 3,
        },
      },
    }

    const store = createStore(null, initialState)

    const state = store.setStateDeep(state => ({
      b: {
        c: state.b.c + 4,
        f: 5,
      },
    }))

    expect(state).toEqual({
      a: 1,
      b: {
        c: 6,
        d: {
          e: 3,
        },
        f: 5,
      },
    })

    expect(state.b.d).toBe(initialState.b.d)
  })

  test('attaches the passed metadata as the `meta` property of the generated action', () => {
    const subscriber = jest.fn()
    const store = createStore()

    store.subscribe(subscriber)
    store.setStateDeep('a', 'b')

    expect(subscriber).toHaveBeenCalledWith('a', undefined, {
      meta: 'b',
      payload: 'a',
      type: internalTypes.merge,
    })
  })
})

describe('store.subscribe()', () => {
  test('throws an Error if the subscriber.next', () => {
    const store = createStore()

    nonFunctions
      .filter(Boolean)
      .forEach(nonFunction =>
        expect(store.subscribe.bind(null, { next: nonFunction })).toThrow(Error)
      )
  })

  test('throws an Error if subscriber.error is present and not a function', () => {
    const store = createStore()

    nonFunctions
      .filter(Boolean)
      .forEach(nonFunction =>
        expect(store.subscribe.bind(null, { error: nonFunction })).toThrow(
          Error
        )
      )
  })

  test('throws an Error if subscriber.effects is present and not a function', () => {
    const store = createStore()

    nonFunctions
      .filter(Boolean)
      .forEach(nonFunction =>
        expect(store.subscribe.bind(null, { effects: nonFunction })).toThrow(
          Error
        )
      )
  })

  test('returns a subscription object', () => {
    const store = createStore()

    const subscription = store.subscribe(() => {})

    expect(subscription).toEqual({
      unsubscribe: expect.any(Function),
    })
  })
})

describe('store.use()', () => {
  test('returns the store for chaining', () => {
    const store = createStore()
      .use(undefined as any)
      .use(() => 1)
      .use(null)

    expect((store.constructor as typeof Store).$$typeof).toBe(
      Symbol.for('zedux.store')
    )
  })
})
