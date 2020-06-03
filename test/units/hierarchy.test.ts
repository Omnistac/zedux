import { metaTypes } from '@src/api/constants'
import { getHierarchyType, wrapStoreInReducer } from '@src/hierarchy/create'
import { delegate, propagateChange } from '@src/hierarchy/traverse'
import { HierarchyType } from '@src/utils/general'
import * as hierarchyConfig from '@src/utils/hierarchyConfig'
import {
  createMockStore,
  nonPlainObjects,
  nullNodes,
  plainObjects,
} from '@test/utils'

describe('delegate()', () => {
  const action1 = {
    metaType: metaTypes.DELEGATE,
    metaData: ['a'],
    payload: {
      type: 'b',
    },
  }

  const action2 = {
    metaType: metaTypes.DELEGATE,
    metaData: ['a', 'b'],
    payload: {
      type: 'c',
    },
  }

  const action3 = {
    metaType: metaTypes.DELEGATE,
    metaData: ['a', 'b', 'c'],
    payload: {
      metaType: metaTypes.DELEGATE,
      metaDAta: ['d', 'e'],
      payload: {
        type: 'd',
      },
    },
  }

  test('does nothing and returns false if the action does not contain the special DELEGATE meta node', () => {
    expect(delegate(null, { type: 'a' })).toBe(false)
  })

  test('throws a ReferenceError if the node path does not exist in the hierarchy', () => {
    expect(delegate.bind(null, {}, action1)).toThrow(ReferenceError)

    expect(
      delegate.bind(
        null,
        {
          children: {
            a: {
              children: {},
            },
          },
        },
        action3
      )
    ).toThrow(ReferenceError)
  })

  test('throws a TypeError if the node at the given path is not a store node', () => {
    expect(
      delegate.bind(
        null,
        {
          children: {
            a: {},
          },
        },
        action1
      )
    ).toThrow(TypeError)

    expect(
      delegate.bind(
        null,
        {
          children: {
            a: {
              children: {
                b: {},
              },
            },
          },
        },
        action2
      )
    ).toThrow(TypeError)
  })

  test('delegates the one-delegate-layer-unwrapped action to the store at the given node', () => {
    const mockStore = createMockStore()

    delegate(
      {
        type: HierarchyType.Branch,
        children: {
          a: {
            type: HierarchyType.Store,
            store: mockStore,
          },
        },
      },
      action1
    )

    expect(mockStore.dispatch).toHaveBeenLastCalledWith(action1.payload)

    delegate(
      {
        type: HierarchyType.Branch,
        children: {
          a: {
            type: HierarchyType.Branch,
            children: {
              b: {
                type: HierarchyType.Branch,
                children: {
                  c: {
                    type: HierarchyType.Store,
                    store: mockStore,
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
      expect(getHierarchyType(emptyNode)).toBe(HierarchyType.Null)
    })
  })

  test('detects a Branch node', () => {
    plainObjects.forEach(plainObject =>
      expect(getHierarchyType(plainObject)).toBe(HierarchyType.Branch)
    )
  })

  test('detects a Reducer node', () => {
    expect(getHierarchyType(() => 1)).toBe(HierarchyType.Reducer)
  })

  test('detects a Store node', () => {
    const mockStore = createMockStore()

    expect(getHierarchyType(mockStore)).toBe(HierarchyType.Store)
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
  test('returns a valid reactor', () => {
    const mockStore = createMockStore()
    const reactor = wrapStoreInReducer(mockStore)

    expect(typeof reactor).toBe('function')
  })
})
