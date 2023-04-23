import { createStore, zeduxTypes } from '@zedux/core'
import {
  getHierarchyType,
  wrapStoreInReducer,
} from '@zedux/core/hierarchy/create'
import { delegate, propagateChange } from '@zedux/core/hierarchy/traverse'
import {
  BranchNodeType,
  NullNodeType,
  ReducerNodeType,
  StoreNodeType,
} from '@zedux/core/utils/general'
import * as hierarchyConfig from '@zedux/core/utils/hierarchyConfig'
import {
  createMockStore,
  nonPlainObjects,
  nullNodes,
  plainObjects,
  toggleDevMode,
} from '../utils'

describe('delegate()', () => {
  const action1 = {
    metaType: zeduxTypes.delegate,
    metaData: ['a'],
    payload: {
      type: 'b',
    },
  }

  const action2 = {
    metaType: zeduxTypes.delegate,
    metaData: ['a', 'b'],
    payload: {
      type: 'c',
    },
  }

  const action3 = {
    metaType: zeduxTypes.delegate,
    metaData: ['a', 'b', 'c'],
    payload: {
      metaType: zeduxTypes.delegate,
      metaData: ['d', 'e'],
      payload: {
        type: 'f',
      },
    },
  }

  test('does nothing and returns false if the action does not contain the special `delegate` meta node', () => {
    // @ts-expect-error null isn't a valid node
    expect(delegate(null, { type: 'a' })).toBe(false)
  })

  test('throws an error if the node path does not exist in the hierarchy', () => {
    toggleDevMode(() => {
      // @ts-expect-error {} isn't a valid node
      expect(() => delegate({}, action1)).toThrowError()

      expect(() =>
        delegate(
          {
            children: {
              // @ts-expect-error {} isn't a valid node
              a: {
                children: {},
              },
            },
          },
          action3
        )
      ).toThrowError()

      expect(() =>
        delegate(
          {
            type: 1,
            children: {
              a: {
                type: 1,
                children: {},
              },
            },
          },
          action3
        )
      ).toThrowError()
    })
  })

  test('throws an error if the node at the given path is not a store node', () => {
    toggleDevMode(() => {
      expect(() =>
        delegate(
          {
            type: 1,
            children: {
              a: {
                reducer: () => {},
                type: 3,
              },
            },
          },
          action1
        )
      ).toThrowError()

      expect(() =>
        delegate(
          {
            children: {
              a: {
                children: {
                  // @ts-expect-error {} isn't a valid node
                  b: {},
                },
              },
            },
          },
          action2
        )
      ).toThrowError()
    })
  })

  test('delegates the one-delegate-layer-unwrapped action to the store at the given node', () => {
    const mockStore = createMockStore()

    delegate(
      {
        type: BranchNodeType,
        children: {
          a: {
            reducer: () => 1,
            store: mockStore,
            type: StoreNodeType,
          },
        },
      },
      action1
    )

    expect(mockStore.dispatch).toHaveBeenLastCalledWith(action1.payload)

    delegate(
      {
        type: BranchNodeType,
        children: {
          a: {
            type: BranchNodeType,
            children: {
              b: {
                type: BranchNodeType,
                children: {
                  c: {
                    reducer: () => 1,
                    store: mockStore,
                    type: StoreNodeType,
                  },
                },
              },
            },
          },
        },
      },
      action3
    )

    expect(mockStore.dispatch).toHaveBeenLastCalledWith(action3.payload)
  })

  test('delegates the action through multiple stores', () => {
    const childStore = createStore()
    const parentStore = createStore({ d: { e: childStore } })

    childStore.dispatch = jest.fn(childStore.dispatch)

    delegate(
      {
        type: BranchNodeType,
        children: {
          a: {
            type: BranchNodeType,
            children: {
              b: {
                type: BranchNodeType,
                children: {
                  c: {
                    reducer: () => 1,
                    store: parentStore,
                    type: StoreNodeType,
                  },
                },
              },
            },
          },
        },
      },
      action3
    )

    expect(childStore.dispatch).toHaveBeenCalledTimes(1)
    expect(childStore.dispatch).toHaveBeenLastCalledWith(
      action3.payload.payload
    )
  })
})

describe('getHierarchyType()', () => {
  test('throws a TypeError if the given node is not a function, a plain object, null, or undefined', () => {
    nonPlainObjects.forEach(nonPlainObject => {
      if (
        typeof nonPlainObject === 'function' ||
        typeof nonPlainObject === 'undefined' ||
        nonPlainObject === null
      )
        return

      expect(getHierarchyType.bind(null, nonPlainObject)).toThrow(TypeError)
    })
  })

  test('detects a Null node', () => {
    nullNodes.forEach(emptyNode => {
      expect(getHierarchyType(emptyNode)).toBe(NullNodeType)
    })
  })

  test('detects a Branch node', () => {
    plainObjects.forEach(plainObject =>
      expect(getHierarchyType(plainObject)).toBe(BranchNodeType)
    )
  })

  test('detects a Reducer node', () => {
    expect(getHierarchyType(() => 1)).toBe(ReducerNodeType)
  })

  test('detects a Store node', () => {
    const mockStore = createStore()

    expect(getHierarchyType(mockStore)).toBe(StoreNodeType)
  })
})

describe('propagateChange()', () => {
  test('base case - if there are no more nodes in the subStorePath, it returns the new state', () => {
    const subStorePath: any[] = []
    const newSubStoreState = {}

    propagateChange(null, subStorePath, newSubStoreState, hierarchyConfig)
  })

  test('sets a property on the top level of the state tree', () => {
    const currentState = {
      a: 1,
    }
    const subStorePath = ['a']
    const newSubStoreState = 2

    const newState = propagateChange(
      currentState,
      subStorePath,
      newSubStoreState,
      hierarchyConfig
    )

    expect(newState).not.toBe(currentState)
    expect(newState).toEqual({
      a: 2,
    })
  })

  test('sets a nested property in the state tree', () => {
    const currentState = {
      a: {
        b: {
          c: {},
        },
        d: {}, // shouldn't be changed
      },
    }
    const subStorePath = ['a', 'b', 'c']
    const newSubStoreState = {}

    const newState = propagateChange(
      currentState,
      subStorePath,
      newSubStoreState,
      hierarchyConfig
    )

    expect(newState).not.toBe(currentState)
    expect(newState.a).not.toBe(currentState.a)
    expect(newState.a.b).not.toBe(currentState.a.b)
    expect(newState.a.b.c).not.toBe(currentState.a.b.c)
    expect(newState.a.b.c).toBe(newSubStoreState)
    expect(newState.a.d).toBe(currentState.a.d)
  })
})

describe('wrapStoreInReducer()', () => {
  test('returns a valid reducer', () => {
    const mockStore = createMockStore()
    const reducer = wrapStoreInReducer(mockStore)

    expect(typeof reducer).toBe('function')
  })
})
