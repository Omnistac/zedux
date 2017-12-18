import { metaTypes } from '../../src/api/constants'

import * as nodeOptions from '../../src/utils/nodeOptions'

import {
  createMockStore, nonPlainObjects, nullNodes, plainObjects
} from '../utils'

import {
  HIERARCHY_DESCRIPTOR,
  NULL,
  REACTOR,
  STORE,
  delegate,
  getHierarchyNodeType,
  hierarchyDescriptorChildrenToReactors,
  hierarchyDescriptorToReactor,
  hierarchyNodeToReactor,
  mergeHierarchyDescriptorNodes,
  mergeHierarchyDescriptors,
  propagateChange,
  wrapStoreInReactor
} from '../../src/utils/hierarchy'


describe('delegate()', () => {

  const action1 = {
    metaType: metaTypes.DELEGATE,
    metaPayload: [ 'a' ],
    action: {
      type: 'b'
    }
  }

  const action2 = {
    metaType: metaTypes.DELEGATE,
    metaPayload: [ 'a', 'b' ],
    action: {
      type: 'c'
    }
  }

  const action3 = {
    metaType: metaTypes.DELEGATE,
    metaPayload: [ 'a', 'b', 'c' ],
    action: {
      metaType: metaTypes.DELEGATE,
      metaPayload: [ 'd', 'e' ],
      action: {
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
      delegate.bind(null, { a: { b: {} } }, action3)
    ).toThrow(ReferenceError)

  })


  test('throws a TypeError if the node at the given path is not a store node', () => {

    expect(
      delegate.bind(null, { a: () => {} }, action1)
    ).toThrow(TypeError)

    expect(
      delegate.bind(null, { a: { b: {} } }, action2)
    ).toThrow(TypeError)

  })


  test('delegates the one-delegate-layer-unwrapped action to the store at the given node and returns true', () => {

    const mockStore = createMockStore()

    expect(
      delegate({ a: mockStore }, action1)
    ).toBe(true)

    expect(mockStore.dispatch).toHaveBeenLastCalledWith(action1.action)

    expect(
      delegate({ a: { b: { c: mockStore } } }, action3)
    ).toBe(true)

    expect(mockStore.dispatch).toHaveBeenLastCalledWith(action3.action)

  })

})


describe('getHierarchyNodeType()', () => {

  test('throws a TypeError if the given node is not a function, a plain object, null, or undefined', () => {

    nonPlainObjects.forEach(
      nonPlainObject => {
        if (
          typeof nonPlainObject === 'function'
          || typeof nonPlainObject === 'undefined'
          || nonPlainObject === null
        ) return

        expect(getHierarchyNodeType.bind(null, nonPlainObject)).toThrow(TypeError)
      }
    )

  })


  test('detects a NULL node', () => {

    nullNodes.forEach(
      emptyNode => {
        expect(getHierarchyNodeType(emptyNode, true)).toBe(NULL)
      }
    )

  })


  test('detects a HIERARCHY_DESCRIPTOR node', () => {

    plainObjects.forEach(
      plainObject => expect(getHierarchyNodeType(plainObject)).toBe(HIERARCHY_DESCRIPTOR)
    )

  })


  test('detects a REACTOR node', () => {

    expect(getHierarchyNodeType(() => {})).toBe(REACTOR)

  })


  test('detects a STORE node', () => {

    const mockStore = createMockStore()

    expect(getHierarchyNodeType(mockStore)).toBe(STORE)

  })

})


describe('hierarchyDescriptorChildrenToReactors()', () => {

  test('does not add NULL nodes to the resulting reactors', () => {

    const hierarchyDescriptor = {
      a: null,
      b: undefined
    }

    const reactors = hierarchyDescriptorChildrenToReactors(
      hierarchyDescriptor,
      null,
      null,
      []
    )

    expect(reactors).not.toHaveProperty('a')
    expect(reactors).not.toHaveProperty('b')

  })

})


describe('hierarchyDescriptorToReactor()', () => {

  test('returns a valid reactor', () => {

    const reactor = hierarchyDescriptorToReactor(null, {})

    expect(typeof reactor).toBe('function')
    expect(typeof reactor.process).toBe('function')

  })

})


describe('hierarchyNodeToReactor()', () => {

  test('given a NULL node, returns null', () => {

    nullNodes.forEach(
      nullNode => expect(hierarchyNodeToReactor(nullNode)).toBe(null)
    )

  })


  test('given a REACTOR node, returns the same reactor as-is', () => {

    const reactor = () => {}

    expect(hierarchyNodeToReactor(reactor)).toBe(reactor)

  })


  test('given a STORE node, registers the subStore and returns a valid reactor', () => {

    const currentPath = []
    const registerSubStore = jest.fn()
    const store = createMockStore()

    const reactor = hierarchyNodeToReactor(
      store,
      null,
      registerSubStore,
      currentPath
    )

    expect(typeof reactor).toBe('function')
    expect(typeof reactor.process).toBe('function')
    expect(registerSubStore).toHaveBeenLastCalledWith(currentPath, store)

  })


  test('given a HIERARCHY_DESCRIPTOR node, returns a valid reactor', () => {

    const nodeOptions = {
      create: () => ({}),
      get: (node, key) => node[key],
      set: (node, key, val) => (node[key] = val, node)
    }

    const hierarchyDescriptor = {
      a: () => {}
    }

    const reactor = hierarchyNodeToReactor(
      hierarchyDescriptor,
      nodeOptions
    )

    expect(typeof reactor).toBe('function')
    expect(typeof reactor.process).toBe('function')

  })

})


describe('mergeHierarchyDescriptorNodes()', () => {

  test('given a NULL node for the new hierarchy, returns null', () => {

    expect(mergeHierarchyDescriptorNodes(null, null)).toBe(null)

  })


  test('given a REACTOR node for the new hierarchy, returns the reactor', () => {

    const reactor = () => {}

    expect(mergeHierarchyDescriptorNodes(null, reactor)).toBe(reactor)

  })


  test('given a STORE node for the new hierarchy, returns the store', () => {

    const store = createMockStore()

    expect(mergeHierarchyDescriptorNodes(null, store)).toBe(store)

  })


  test('given a HIERARCHY_DESCRIPTOR node for the new hierarchy, and any non-HIERARCHY_DESCRIPTOR node for the old, returns the new hierarchy', () => {

    const reactor = () => {}
    const store = createMockStore()
    const hierarchyDescriptor = {
      a: () => {}
    }

    expect(
      mergeHierarchyDescriptorNodes(null, hierarchyDescriptor)
    ).toBe(hierarchyDescriptor)

    expect(
      mergeHierarchyDescriptorNodes(reactor, hierarchyDescriptor)
    ).toBe(hierarchyDescriptor)

    expect(
      mergeHierarchyDescriptorNodes(store, hierarchyDescriptor)
    ).toBe(hierarchyDescriptor)

  })


  test('given two HIERARCHY_DESCRIPTOR nodes, merges them, creating a new object containing the properties of both', () => {

    const oldHierarchy = {
      a: () => {}
    }
    const newHierarchy = {
      b: () => {}
    }

    expect(
      mergeHierarchyDescriptorNodes(oldHierarchy, newHierarchy)
    ).toEqual({
      a: oldHierarchy.a,
      b: newHierarchy.b
    })

  })

})


describe('mergeHierarchyDescriptors()', () => {

  test('creates a new object, rather than mutating', () => {

    const oldHierarchy = {}
    const newHierarchy = {}
    const mergedHierarchy = mergeHierarchyDescriptors(
      oldHierarchy,
      newHierarchy
    )

    expect(mergedHierarchy).not.toBe(oldHierarchy)
    expect(mergedHierarchy).not.toBe(newHierarchy)
    expect(mergedHierarchy).toEqual({})

  })


  test('overwrites properties on the old hierarchy', () => {

    const oldHierarchy = {
      a: () => {}
    }
    const newHierarchy = {
      a: () => {},
      b: createMockStore()
    }
    const mergedHierarchy = mergeHierarchyDescriptors(
      oldHierarchy,
      newHierarchy
    )

    expect(mergedHierarchy.a).not.toBe(oldHierarchy.a)
    expect(mergedHierarchy.a).toBe(newHierarchy.a)
    expect(mergedHierarchy.b).toBe(newHierarchy.b)
    expect(mergedHierarchy).toEqual(newHierarchy)

  })


  test('deletes properties on the old hierarchy', () => {

    const oldHierarchy = {
      a: () => {}
    }
    const newHierarchy = {
      a: null,
      b: createMockStore()
    }
    const mergedHierarchy = mergeHierarchyDescriptors(
      oldHierarchy,
      newHierarchy
    )

    expect(mergedHierarchy.a).toBeUndefined()
    expect(Object.keys(mergedHierarchy)).not.toContain('a')
    expect(mergedHierarchy.b).toBe(newHierarchy.b)
    expect(mergedHierarchy).toEqual({
      b: newHierarchy.b
    })

  })


  test('deep merges nested HIERARCHY_DESCRIPTOR nodes', () => {

    const oldHierarchy = {
      a: {
        b: () => {},
        c: {
          d: {
            e: createMockStore(),
            f: createMockStore(),
            g: () => {}
          }
        }
      }
    }
    const newHierarchy = {
      a: {
        c: {
          d: {
            e: createMockStore(),
            f: null,
            h: () => {}
          }
        }
      }
    }
    const mergedHierarchy = mergeHierarchyDescriptors(
      oldHierarchy,
      newHierarchy
    )

    expect(mergedHierarchy.a.b).toBe(oldHierarchy.a.b)
    expect(mergedHierarchy.a.c.d.e).not.toBe(oldHierarchy.a.c.d.e)
    expect(mergedHierarchy.a.c.d.e).toBe(newHierarchy.a.c.d.e)
    expect(mergedHierarchy.a.c.d.f).toBeUndefined()
    expect(Object.keys(mergedHierarchy.a.c.d)).not.toContain('f')
    expect(mergedHierarchy.a.c.d.g).toBe(oldHierarchy.a.c.d.g)
    expect(mergedHierarchy.a.c.d.h).toBe(newHierarchy.a.c.d.h)

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
    expect(typeof reactor.process).toBe('function')

  })

})
