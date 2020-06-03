import { from } from 'rxjs'
import { filter } from 'rxjs/operators'

import {
  actionTypes,
  createStore,
  effectTypes,
  metaTypes,
  Store,
} from '@src/index'
import {
  dispatchables,
  nonDispatchables,
  nonPlainObjects,
  createMockReducer,
} from '@test/utils'
import { observableSymbol } from '@src/utils/general'

const nonFunctions = nonDispatchables.filter(
  thing => typeof thing !== 'function'
)

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

  test('short-circuits, hydrates, and returns the new state if the action has the special HYDRATE type', () => {
    const store = createStore()

    const action = {
      type: actionTypes.HYDRATE,
      payload: { a: 1 },
    }

    const prevState = store.getState()
    const { state } = store.dispatch(action)

    expect(state).not.toBe(prevState)
    expect(state).toBe(action.payload)
  })

  test('short-circuits, hydrates, and returns the new state if the action has the special PARTIAL_HYDRATE type', () => {
    const store = createStore()

    const action = {
      type: actionTypes.PARTIAL_HYDRATE,
      payload: { a: 1 },
    }

    const prevState = store.getState()
    const { state } = store.dispatch(action)

    expect(state).not.toBe(prevState)
    expect(state).toBe(action.payload)
  })

  test('short-circuits and returns the new state if the action contains the special DELEGATE meta node', () => {
    const reactor = createMockReducer(1)
    const child = createStore().use(reactor)
    const parent = createStore().use({
      a: child,
    })

    const action = {
      metaType: metaTypes.DELEGATE,
      metaData: ['a'],
      payload: {
        type: 'b',
      },
    }

    const prevState = parent.getState()

    expect(parent.dispatch(action).state).toBe(prevState)
    expect(reactor).toHaveBeenCalledWith(1, { type: 'b' })
  })

  test('throws an Error if the dispatched action object does not have a string "type" property', () => {
    const store = createStore()

    expect(store.dispatch.bind(null, {})).toThrowError(
      /action must have a string "type" property/i
    )

    expect(store.dispatch.bind(null, { type: 1 })).toThrow(TypeError)
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
      expect.objectContaining({
        effects: [
          {
            effectType: effectTypes.DISPATCH,
            payload: action,
          },
        ],
      })
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

    expect(subscriber).toHaveBeenCalledWith({ a: 2 }, { a: 1 })
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
    const { state } = store.dispatch(action)

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
    const { state: nextState } = store.dispatch(action)

    expect(prevState).not.toBe(nextState)
    expect(nextState).toEqual({
      a: 2,
    })
  })
})

describe('Store.getState()', () => {
  test('cannot be called inside a reducer; throws an Error', () => {
    const store = createStore()

    const reducer = (state: string) => {
      if (state) store.getState()

      return { state: state || 'a' }
    }

    store.use(reducer)

    const action = {
      type: 'b',
    }

    const { error } = store.dispatch(action)

    expect(error).toBeInstanceOf(Error)
    expect(error.message).toMatch(/cannot be called within a reducer/i)
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

describe('Store.hydrate()', () => {
  test('cannot be called inside a reducer; throws an Error', () => {
    const store = createStore()

    const reducer = (state: string) => {
      if (state) store.hydrate()

      return { state: 'a' }
    }

    store.use(reducer)

    const action = {
      type: 'b',
    }

    const { error } = store.dispatch(action)

    expect(error).toBeInstanceOf(Error)
    expect(error.message).toMatch(/cannot be called within a reducer/i)
  })

  test('short-circuits if the new state === the current state', () => {
    const obj = {}
    const store = createStore().use(() => obj)

    store.hydrate(obj)

    expect(store.getState()).toBe(obj)
  })

  test('informs effect subscribers of the special HYDRATE action', () => {
    const effectsSubscriber = jest.fn()
    const store = createStore()
    const hydratedState = { a: 1 }

    store.subscribe({ effects: effectsSubscriber })
    store.hydrate(hydratedState)

    expect(effectsSubscriber).toHaveBeenCalledWith(
      expect.objectContaining({
        effects: [
          {
            effectType: effectTypes.DISPATCH,
            payload: {
              type: actionTypes.HYDRATE,
              payload: hydratedState,
            },
          },
        ],
      })
    )
  })

  test('informs subscribers of the new state', () => {
    const subscriber = jest.fn()
    const store = createStore()
    const hydratedState = { a: 1 }

    store.subscribe(subscriber)
    store.hydrate(hydratedState)

    expect(subscriber).toHaveBeenCalledWith(hydratedState, undefined)
  })

  test('returns the store for chaining', () => {
    const store = createStore()
      .hydrate('a')
      .hydrate('b')

    expect(store.getState()).toBe('b')
  })
})

describe('store.configureHierarchy()', () => {
  test('throws a TypeError if the options hash is not a plain object', () => {
    const store = createStore()

    nonPlainObjects.forEach(nonPlainObject =>
      expect(store.configureHierarchy.bind(null, nonPlainObject)).toThrow(
        TypeError
      )
    )
  })

  test('throws an Error if the options hash contains an invalid option key', () => {
    const store = createStore()

    expect(store.configureHierarchy.bind(null, { a: 1 })).toThrow(Error)
    expect(
      store.configureHierarchy.bind(null, {
        clone: () => {},
        create: () => {},
        a: () => {},
      })
    ).toThrow(Error)
  })

  test('throws a TypeError if the options hash contains a non-function option value', () => {
    const store = createStore()

    nonFunctions.forEach(nonFunction =>
      expect(
        store.configureHierarchy.bind(null, { clone: nonFunction })
      ).toThrow(TypeError)
    )
  })

  test('returns the store for chaining', () => {
    const store = createStore().configureHierarchy({})

    expect(store.$$typeof).toBe(Symbol.for('zedux.store'))
  })
})

describe('Store.setState()', () => {
  test('cannot be called inside a reducer; throws an Error', () => {
    const store = createStore()

    const reducer = (state: string) => {
      if (state) store.setState('a')

      return { state: 'b' }
    }

    store.use(reducer)

    const action = {
      type: 'c',
    }

    const { error } = store.dispatch(action)

    expect(error).toBeInstanceOf(Error)
    expect(error.message).toMatch(/cannot be called within a reducer/i)
  })

  test('returns an error thrown in an inducer', () => {
    const store = createStore()
    const inducer = (state: any) => ({ a: state.a })

    const { error } = store.setState(inducer)

    expect(error.message).toMatch(/cannot read property.*of undefined/i)
  })

  test('accepts a non-modifying inducer', () => {
    const store = createStore().hydrate({})
    const inducer = (state: {}) => state

    const prevState = store.getState()
    const { state: nextState } = store.setState(inducer)

    expect(prevState).toBe(nextState)
  })

  test('accepts a modifying inducer', () => {
    const store = createStore()
    const inducer = () => 'a'

    const prevState = store.getState()
    const { state } = store.setState(inducer)

    expect(prevState).not.toBe(state)
    expect(state).toBe('a')
  })

  test('short-circuits if the new state === the current state', () => {
    const store = createStore().hydrate({ a: 1 })
    const prevState = store.getState()

    store.setState({ a: 1 })

    expect(store.getState()).toBe(prevState)
  })

  test('creates a PARTIAL_HYDRATE dispatch effect', () => {
    const effectsSubscriber = jest.fn()
    const store = createStore()
    const hydratedState = { a: 1 }

    store.subscribe({ effects: effectsSubscriber })
    store.setState(hydratedState)

    expect(effectsSubscriber).toHaveBeenCalledWith(
      expect.objectContaining({
        effects: [
          {
            effectType: effectTypes.DISPATCH,
            payload: {
              type: actionTypes.PARTIAL_HYDRATE,
              payload: hydratedState,
            },
          },
        ],
      })
    )
  })

  test('informs subscribers of the new state', () => {
    const subscriber = jest.fn()
    const store = createStore()
    const hydratedState = { a: 1 }

    store.subscribe(subscriber)
    store.setState(hydratedState)

    expect(subscriber).toHaveBeenCalledWith(hydratedState, undefined)
  })

  test('does nothing if the state did not change', () => {
    const store = createStore().hydrate(1)

    const initialState = store.getState()

    const subscriber = jest.fn()
    store.subscribe(subscriber)

    const { state } = store.setState(1)

    expect(subscriber).not.toHaveBeenCalled()
    expect(state).toBe(initialState)
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

    const store = createStore().hydrate(initialState)

    const { state } = store.setState({
      b: {
        c: 4,
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
      .use()
      .use(() => 1)
      .use(null)

    expect(store.$$typeof).toBe(Symbol.for('zedux.store'))
  })
})

describe('store[Symbol.observable]', () => {
  test('returns the store (which is an observable)', () => {
    const store = createStore()

    expect((store[observableSymbol as keyof Store] as any)()).toBe(store)
  })

  test('can be converted to an RxJS observable', () => {
    const store = createStore()
    const state$ = from(store)
    const subscriber = jest.fn()

    state$.subscribe(subscriber)

    store.setState('a')

    expect(subscriber).toHaveBeenCalledWith('a')
    expect(subscriber).toHaveBeenCalledTimes(1)
  })

  test('we can go RxJS crazy with the observable store', () => {
    const store = createStore()
    const subscriber = jest.fn()

    from(store)
      .pipe(filter(state => state !== 'a'))
      .subscribe(subscriber)

    store.setState('a')
    store.setState('b')
    store.setState('a')

    expect(subscriber).toHaveBeenCalledWith('b')
    expect(subscriber).toHaveBeenCalledTimes(1)
  })
})
