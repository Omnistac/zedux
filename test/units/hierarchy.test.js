import { metaTypes } from '../../src/api/constants'

import {
  getHierarchyType, wrapStoreInReactor
} from '../../src/hierarchy/create'

import {
  BRANCH, NULL, REACTOR, STORE
} from '../../src/hierarchy/general'

import { delegate, propagateChange } from '../../src/hierarchy/traverse'
import * as nodeOptions from '../../src/utils/nodeOptions'

import {
  createMockStore, nonPlainObjects, nullNodes, plainObjects
} from '../utils'


describe('delegate()', () => {

  const action1 = {
    metaType: metaTypes.DELEGATE,
    metaData: [ 'a' ],
    payload: {
      type: 'b'
    }
  }

  const action2 = {
    metaType: metaTypes.DELEGATE,
    metaData: [ 'a', 'b' ],
    payload: {
      type: 'c'
    }
  }

  const action3 = {
    metaType: metaTypes.DELEGATE,
    metaData: [ 'a', 'b', 'c' ],
    payload: {
      metaType: metaTypes.DELEGATE,
      metaDAta: [ 'd', 'e' ],
      payload: {
        type: 'd'
      }
    }
  }


  test('does nothing and returns false if the action does not contain the special DELEGATE meta node', () => {

    expect(
      delegate(null, { type: 'a' })
    ).toBe(false)

  })


  test('throws a ReferenceError if the node path does not exist in the hierarchy', () => {

    expect(
      delegate.bind(null, {}, action1)
    ).toThrow(ReferenceError)

    expect(
      delegate.bind(null, {
        children: {
          a: {
            children: {}
          }
        }
      }, action3)
    ).toThrow(ReferenceError)

  })


  test('throws a TypeError if the node at the given path is not a store node', () => {

    expect(
      delegate.bind(null, {
        children: {
          a: {}
        }
      }, action1)
    ).toThrow(TypeError)

    expect(
      delegate.bind(null, {
        children: {
          a: {
            children: {
              b: {}
            }
          }
        }
      }, action2)
    ).toThrow(TypeError)

  })


  test('delegates the one-delegate-layer-unwrapped action to the store at the given node', () => {

    const mockStore = createMockStore()

    delegate({
      children: {
        a: {
          type: STORE,
          store: mockStore
        }
      }
    }, action1)

    expect(mockStore.dispatch).toHaveBeenLastCalledWith(action1.payload)

    delegate({
      children: {
        a: {
          children: {
            b: {
              children: {
                c: {
                  type: STORE,
                  store: mockStore
                }
              }
            }
          }
        }
      }
    }, action3)

    expect(mockStore.dispatch).toHaveBeenLastCalledWith(action3.payload)

  })

})


describe('getHierarchyType()', () => {

  test('throws a TypeError if the given node is not a function, a plain object, null, or undefined', () => {

    nonPlainObjects.forEach(
      nonPlainObject => {
        if (
          typeof nonPlainObject === 'function'
          || typeof nonPlainObject === 'undefined'
          || nonPlainObject === null
        ) return

        expect(getHierarchyType.bind(null, nonPlainObject)).toThrow(TypeError)
      }
    )

  })


  test('detects a NULL node', () => {

    nullNodes.forEach(
      emptyNode => {
        expect(getHierarchyType(emptyNode, true)).toBe(NULL)
      }
    )

  })


  test('detects a BRANCH node', () => {

    plainObjects.forEach(
      plainObject => expect(getHierarchyType(plainObject)).toBe(BRANCH)
    )

  })


  test('detects a REACTOR node', () => {

    expect(getHierarchyType(() => {})).toBe(REACTOR)

  })


  test('detects a STORE node', () => {

    const mockStore = createMockStore()

    expect(getHierarchyType(mockStore)).toBe(STORE)

  })

})


describe('propagateChange()', () => {

  test('base case - if there are no more nodes in the subStorePath, it returns the new state', () => {

    const subStorePath = []
    const newSubStoreState = {}

    propagateChange(null, subStorePath, newSubStoreState)

  })


  test('sets a property on the top level of the state tree', () => {

    const currentState = {
      a: 1
    }
    const subStorePath = [ 'a' ]
    const newSubStoreState = 2

    const newState = propagateChange(
      currentState,
      subStorePath,
      newSubStoreState,
      nodeOptions
    )

    expect(newState).not.toBe(currentState)
    expect(newState).toEqual({
      a: 2
    })

  })


  test('sets a nested property in the state tree', () => {

    const currentState = {
      a: {
        b: {
          c: {}
        },
        d: {} // shouldn't be changed
      }
    }
    const subStorePath = [ 'a', 'b', 'c' ]
    const newSubStoreState = {}

    const newState = propagateChange(
      currentState,
      subStorePath,
      newSubStoreState,
      nodeOptions
    )

    expect(newState).not.toBe(currentState)
    expect(newState.a).not.toBe(currentState.a)
    expect(newState.a.b).not.toBe(currentState.a.b)
    expect(newState.a.b.c).not.toBe(currentState.a.b.c)
    expect(newState.a.b.c).toBe(newSubStoreState)
    expect(newState.a.d).toBe(currentState.a.d)

  })

})


describe('wrapStoreInReactor()', () => {

  test('returns a valid reactor', () => {

    const reactor = wrapStoreInReactor()

    expect(typeof reactor).toBe('function')
    expect(typeof reactor.effects).toBe('function')

  })

})
