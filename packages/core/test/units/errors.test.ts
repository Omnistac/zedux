import {
  assertAreFunctions,
  assertIsNullHierarchyDescriptorNode,
  assertIsPlainObject,
  assertIsValidAction,
  assertIsValidActor,
  assertIsValidNodeOption,
  invalidAccess,
  invalidAction,
  invalidActor,
  invalidDelegation,
  invalidHierarchyDescriptorNode,
  invalidNodeOptionKey,
  invalidNonFunction,
  invalidNonPlainObject,
} from '@zedux/core/utils/errors'

import {
  dispatchables,
  nonDispatchables,
  nonPlainObjects,
  plainObjects,
} from '@zedux/core-test/utils'

describe('assertAreFunctions()', () => {
  test('throws a TypeError if any items are not functions', () => {
    expect(assertAreFunctions.bind(null, [1])).toThrow(TypeError)

    expect(assertAreFunctions.bind(null, [{}])).toThrow(TypeError)

    expect(
      assertAreFunctions.bind(null, [() => {}, () => {}, 'a', () => {}])
    ).toThrow(TypeError)

    expect(assertAreFunctions.bind(null, [() => {}, () => {}])).not.toThrow()
  })
})

describe('assertIsNullHierarchyDescriptorNode()', () => {
  test('throws a TypeError if the node is not null or undefined', () => {
    nonPlainObjects
      .slice(0, 2)
      .forEach(
        nullObject =>
          expect(assertIsNullHierarchyDescriptorNode.bind(null, nullObject)).not
            .toThrow
      )

    nonPlainObjects
      .slice(2)
      .forEach(nonNullObject =>
        expect(
          assertIsNullHierarchyDescriptorNode.bind(null, nonNullObject)
        ).toThrow(TypeError)
      )
  })
})

describe('assertIsPlainObject()', () => {
  test('throws a TypeError if the action is not a plain object', () => {
    nonPlainObjects.forEach(nonPlainObject =>
      expect(assertIsPlainObject.bind(null, nonPlainObject)).toThrow(TypeError)
    )

    plainObjects.forEach(plainObject =>
      expect(assertIsPlainObject.bind(null, plainObject)).not.toThrow()
    )
  })
})

describe('assertIsValidAction()', () => {
  test('throws a TypeError if the action does not have a "type" property', () => {
    nonDispatchables.forEach(nonDispatchable =>
      expect(assertIsValidAction.bind(null, nonDispatchable)).toThrow(TypeError)
    )
  })

  test('does not throw if the action is valid', () => {
    dispatchables.forEach(dispatchable =>
      expect(expect(assertIsValidAction.bind(null, dispatchable)).not.toThrow())
    )
  })
})

describe('assertIsValidActor()', () => {
  test('throws a TypeError if the actor is invalid', () => {
    nonDispatchables.forEach(nonDispatchable =>
      expect(assertIsValidActor.bind(null, nonDispatchable)).toThrow(TypeError)
    )

    const actor1 = () => {}
    actor1.type = 0

    const actor2: any = () => {}
    actor2.type = []

    const actor3 = () => {}
    actor3.type = undefined

    const actor4 = () => {}
    actor4.type = ''

    expect(assertIsValidActor.bind(null, actor1)).toThrow(TypeError)
    expect(assertIsValidActor.bind(null, actor2)).toThrow(TypeError)
    expect(assertIsValidActor.bind(null, actor3)).toThrow(TypeError)
    expect(assertIsValidActor.bind(null, actor4)).not.toThrow()
  })

  test('does not throw if the actor is valid', () => {
    const actor = () => {}
    actor.type = 'a'

    expect(assertIsValidActor.bind(null, actor)).not.toThrow()
  })
})

describe('assertIsValidNodeOption()', () => {
  test('throws an Error of the given option is not in the validOptions list', () => {
    const validOptions = {
      clone: true,
      create: true,
      get: true,
      set: true,
    }

    expect(assertIsValidNodeOption.bind(null, validOptions, 'a')).toThrow(Error)
  })

  test('throws a TypeError of the given value is not a function', () => {
    const validOptions = {
      clone: true,
      create: true,
      get: true,
      set: true,
    }

    expect(
      assertIsValidNodeOption.bind(null, validOptions, 'clone', 'a')
    ).toThrow(TypeError)
  })
})

describe('invalidAccess()', () => {
  test('returns a string containing the method name', () => {
    const methodName = 'test method name'

    expect(invalidAccess(methodName)).toMatch(methodName)
  })
})

describe('invalidAction()', () => {
  test('returns a string containing the detailed type of the invalid "type" property', () => {
    expect(invalidAction({ type: 'a' })).toMatch(/received string/i)

    expect(invalidAction({ type: 1 } as any)).toMatch(/received number/i)

    expect(invalidAction({ type: [] } as any)).toMatch(/received array/i)

    expect(invalidAction({ type: null })).toMatch(/received null/i)

    expect(invalidAction({ type: new Map() } as any)).toMatch(
      /received complex object/i
    )

    expect(invalidAction({ type: Object.create(null) })).toMatch(
      /received prototype-less object/i
    )
  })
})

describe('invalidActor()', () => {
  test('returns a string containing the type of the invalid actor', () => {
    expect(invalidActor('a')).toMatch(/received string/i)

    expect(invalidActor(1)).toMatch(/received number/i)

    expect(invalidActor([])).toMatch(/received object/i)

    expect(invalidActor(undefined)).toMatch(/received undefined/i)
  })

  test('returns a string containing the type of the invalid "type" property of the actor', () => {
    const actor = () => {}
    actor.type = 1

    expect(invalidActor(actor)).toMatch(
      /function with invalid "type" property - number/i
    )
  })
})

describe('invalidDelegation()', () => {
  test('returns a string containing the sub-store path separated by " -> "', () => {
    const subStorePath = ['a', 'b', 'c']

    expect(invalidDelegation(subStorePath)).toMatch(subStorePath.join(' -> '))
  })
})

describe('invalidHierarchyDescriptorNode()', () => {
  test('returns a string containing the detailed type of the invalid node', () => {
    expect(invalidHierarchyDescriptorNode('a')).toMatch(/received string/i)

    expect(invalidHierarchyDescriptorNode(1)).toMatch(/received number/i)

    expect(invalidHierarchyDescriptorNode([])).toMatch(/received array/i)

    expect(invalidHierarchyDescriptorNode(null)).toMatch(/received null/i)
  })
})

describe('invalidNodeOptionKey()', () => {
  test('returns a string containing the passed key and a helpful error message', () => {
    expect(invalidNodeOptionKey('a')).toMatch(
      /received invalid node option, "a".*valid options are/i
    )
  })
})

describe('invalidNonFunction()', () => {
  test('returns a string containg the basic type of the invalid argument', () => {
    expect(invalidNonFunction('a')).toMatch(/received string/i)

    expect(invalidNonFunction(1)).toMatch(/received number/i)

    expect(invalidNonFunction([])).toMatch(/received object/i)
  })
})

describe('invalidNonPlainObject()', () => {
  test('returns a string containing the detailed type of the invalid action', () => {
    expect(invalidNonPlainObject('a')).toMatch(/received string/i)

    expect(invalidNonPlainObject(1)).toMatch(/received number/i)

    expect(invalidNonPlainObject([])).toMatch(/received array/i)

    expect(invalidNonPlainObject(null)).toMatch(/received null/i)

    expect(invalidNonPlainObject(new Map())).toMatch(/received complex object/i)

    expect(invalidNonPlainObject(Object.create(null))).toMatch(
      /received prototype-less object/i
    )
  })
})
