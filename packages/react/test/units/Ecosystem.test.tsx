import {
  atom,
  createEcosystem,
  injectEffect,
  injectEcosystem,
  ion,
} from '@zedux/react'
import { ecosystem } from '../utils/ecosystem'
import { mockConsole } from '../utils/console'
import { expectTypeOf } from 'expect-type'

describe('Ecosystem', () => {
  test('passing a SelectorInstance to .select() and .get() returns the result of the passed instance', () => {
    const selector1 = () => ({ a: 1 })

    const instance = ecosystem.getNode(selector1)

    // since the selector instance has no observers, this call destroys it ...
    const selectValue = ecosystem.select(instance)

    // ... and this call recreates then redestroys it
    const getValue = ecosystem.get(instance, [])

    expect(selectValue).toEqual({ a: 1 })
    expect(getValue).toEqual({ a: 1 })
    expect(instance.v).toBe(selectValue)
    expect(instance.v).toEqual(getValue)

    // different instances of the same selector returned different objects
    expect(selectValue).not.toBe(getValue)
  })

  test('tags must be an array', () => {
    // @ts-expect-error tags must be an array
    expect(() => createEcosystem({ tags: { a: true } })).toThrow(
      /must be an array/i
    )
  })

  test('overrides must be an array', () => {
    // @ts-expect-error overrides must be an array
    expect(() => createEcosystem({ overrides: { a: true } })).toThrow(
      /must be an array/i
    )
  })

  test('atom override tags are also respected', () => {
    const mock = mockConsole('error')
    const atom1 = atom('1', 'a', { tags: ['test-tag'] })
    const atom1Override = atom1.override('aa')

    const testEcosystem = createEcosystem({
      tags: [],
      overrides: [atom1Override],
    })

    const instance = testEcosystem.getInstance(atom1)

    expect(instance.t).toBe(atom1Override)
    expect(mock).toHaveBeenCalledTimes(1)
    expect(mock).toHaveBeenCalledWith(
      expect.stringContaining('encountered unsafe atom')
    )

    testEcosystem.reset()
  })

  test('onReady cleanup is called on ecosystem reset', () => {
    const cleanup = jest.fn()
    const onReady = jest.fn(() => cleanup)
    const a = { a: 1 }
    const b = { a: 2 }

    const testEcosystem = createEcosystem({ context: a, onReady })

    expect(onReady).toHaveBeenCalledTimes(1)
    expect(onReady).toHaveBeenCalledWith(testEcosystem)
    expect(cleanup).not.toHaveBeenCalled()

    testEcosystem.reset({ context: b })

    expect(onReady).toHaveBeenCalledTimes(2)
    expect(onReady).toHaveBeenLastCalledWith(testEcosystem, a)
    expect(cleanup).toHaveBeenCalledTimes(1)

    testEcosystem.reset()

    expect(onReady).toHaveBeenCalledTimes(3)
    expect(onReady).toHaveBeenLastCalledWith(testEcosystem, b)
    expect(cleanup).toHaveBeenCalledTimes(2)
  })

  test('find() with string returns the exact match if possible', () => {
    const atom1 = atom('1', (id?: string) => id)
    const atom2 = atom('someLongKey1', 1)
    const atom3 = atom('someLongKey11', 1)
    const atom4 = atom('someLongKey111', 1)

    ecosystem.getInstance(atom1, ['a'])
    ecosystem.getInstance(atom1)
    ecosystem.getNode(atom1, ['b'])
    ecosystem.getInstance(atom2)
    ecosystem.getInstance(atom3)
    ecosystem.getInstance(atom4)

    expect(ecosystem.find('1')).toBe(ecosystem.getNode(atom1))
    expect(ecosystem.find('someLongKey11')).toBe(ecosystem.getInstance(atom3))

    // if no exact match, `.find()` does a fuzzy search
    expect(ecosystem.find('1-["b')).toBe(ecosystem.getInstance(atom1, ['b']))

    // some more checks for fun
    expect(ecosystem.find(atom4)).toBe(ecosystem.getInstance(atom4))
    expect(ecosystem.find(atom1, ['a'])).toBe(
      ecosystem.getInstance(atom1, ['a'])
    )
    expect(ecosystem.find(atom1, ['b'])).toBe(
      ecosystem.getInstance(atom1, ['b'])
    )
  })

  test('find() with params only returns exact matches', () => {
    const atom1 = atom('1', (id?: string) => id)
    const atom2 = atom('someLongKey1', 1)
    const atom3 = atom('someLongKey11', 1)
    const atom4 = atom('someLongKey111', 1)

    ecosystem.getNode(atom1, ['a'])
    ecosystem.getInstance(atom1)
    ecosystem.getInstance(atom1, ['b'])
    ecosystem.getInstance(atom2)
    ecosystem.getNode(atom3)
    ecosystem.getNode(atom4)

    expect(ecosystem.find('someLongKey', [])).toBeUndefined()
    expect(ecosystem.find(atom1, ['b'])?.get()).toBe('b')
    expect(ecosystem.find(atom1, ['c'])).toBeUndefined()
    expect(ecosystem.find(atom3, [])?.get()).toBe(1)
  })

  test('findAll() with no params returns all atom instances', () => {
    const atom1 = atom('1', (id: number) => id)

    const expected = Array(10)
      .fill(null)
      .map((_, i) => ecosystem.getInstance(atom1, [i]))

    expect(ecosystem.findAll()).toEqual(expected)
  })

  test('get() outside a reactive context destroys observerless selectors', () => {
    const selector1 = () => 1
    const instance = ecosystem.getNode(selector1)

    expect(ecosystem.get(instance)).toBe(1)
    expect(ecosystem.viewGraph()).toEqual({})
    expect(instance.status).toBe('Destroyed')
  })

  test('get() outside a reactive context does not destroy observed selectors', () => {
    const selector1 = () => 1
    const instance = ecosystem.getNode(selector1)

    const cleanup = instance.on('change', () => {}, { active: true })

    expect(ecosystem.get(instance)).toBe(1)
    expect(ecosystem.viewGraph()).toMatchInlineSnapshot(`
      {
        "@listener(@selector(selector1)-1)-2": {
          "observers": [],
          "sources": [
            {
              "key": "@selector(selector1)-1",
              "operation": "on",
            },
          ],
          "weight": 2,
        },
        "@selector(selector1)-1": {
          "observers": [
            {
              "key": "@listener(@selector(selector1)-1)-2",
              "operation": "on",
            },
          ],
          "sources": [],
          "weight": 1,
        },
      }
    `)

    cleanup()

    expect(ecosystem.viewGraph()).toEqual({})
  })

  test('getInstance() throws an error if bad values are passed', () => {
    const atom1 = atom('1', (param: string) => param)

    // @ts-expect-error first param must be an atom template or instance
    expect(() => ecosystem.getInstance({})).toThrow(
      /Expected a template, selector, or graph node/i
    )

    // @ts-expect-error first param must be an atom template or instance
    expect(() => ecosystem.getInstance()).toThrow(
      "Cannot read properties of undefined (reading 'izn')"
    )

    // @ts-expect-error second param must be an array or undefined
    expect(() => ecosystem.getInstance(atom1, 'a')).toThrow(
      /Expected atom params to be an array/i
    )
  })

  test('getNode() throws an error if bad values are passed', () => {
    const atom1 = atom('1', (param: string) => param)

    // @ts-expect-error first param must be an atom template or instance
    expect(() => ecosystem.getNode({})).toThrow(
      /Expected a template, selector, or graph node/i
    )

    // @ts-expect-error first param must be an atom template or instance
    expect(() => ecosystem.getNode()).toThrow(
      "Cannot read properties of undefined (reading 'izn')"
    )

    // @ts-expect-error second param must be an array or undefined
    expect(() => ecosystem.getNode(atom1, 'a')).toThrow(
      /Expected atom params to be an array/i
    )
  })

  test('getNodeOnce() does not register graph edges in reactive contexts', () => {
    const atom1 = atom('1', () => 1)
    const atom2 = ion('2', ({ getNode, getNodeOnce }, isReactive: boolean) =>
      (isReactive ? getNode(atom1) : getNodeOnce(atom1)).getOnce()
    )

    const node1 = ecosystem.getNode(atom1)
    node1.set(11)

    const reactiveNode2 = ecosystem.getNode(atom2, [true])
    const staticNode2 = ecosystem.getNode(atom2, [false])

    expect(reactiveNode2.get()).toBe(11)
    expect(staticNode2.get()).toBe(11)

    node1.destroy(true)

    expect(reactiveNode2.get()).toBe(1) // re-ran on source node force-destroy
    expect(staticNode2.get()).toBe(11)
  })

  test("getOnce() returns the resolved node's value", () => {
    const atomA = atom('a', 1)
    const atomB = atom('b', () => injectEcosystem().getOnce(atomA))
    const valueA = ecosystem.getOnce(atomA)
    const valueB = ecosystem.getOnce(atomB)

    expectTypeOf(valueA).toEqualTypeOf<number>()
    expect(valueA).toBe(1)
    expectTypeOf(valueB).toEqualTypeOf<number>()
    expect(valueB).toBe(1)

    ecosystem.getNode(atomA).set(2)
    expect(ecosystem.getOnce(atomA)).toBe(2)
    expect(ecosystem.getOnce(atomB)).toBe(1) // getOnce registers no deps

    expect(ecosystem.getNode(atomB).s.size).toBe(0)
  })

  test('getOnce() does not register graph edges in reactive contexts', () => {
    const atom1 = atom('1', () => 1)
    const atom2 = ion('2', ({ get, getOnce }, isReactive: boolean) =>
      isReactive ? get(atom1) : getOnce(atom1)
    )

    const node1 = ecosystem.getNode(atom1)
    node1.set(11)

    const reactiveNode2 = ecosystem.getNode(atom2, [true])
    const staticNode2 = ecosystem.getNode(atom2, [false])

    expect(reactiveNode2.get()).toBe(11)
    expect(staticNode2.get()).toBe(11)

    node1.destroy(true)

    expect(reactiveNode2.get()).toBe(1) // re-ran on source node force-destroy
    expect(staticNode2.get()).toBe(11)
  })

  test('getOnce() outside a reactive context destroys observerless selectors', () => {
    const selector1 = () => 1
    const instance = ecosystem.getNode(selector1)

    expect(ecosystem.getOnce(instance)).toBe(1)
    expect(ecosystem.viewGraph()).toEqual({})
    expect(instance.status).toBe('Destroyed')
  })

  test('getOnce() outside a reactive context does not destroy observed selectors', () => {
    const selector1 = () => 1
    const instance = ecosystem.getNode(selector1)

    const cleanup = instance.on('change', () => {}, { active: true })

    expect(ecosystem.getOnce(instance)).toBe(1)
    expect(ecosystem.viewGraph()).toMatchInlineSnapshot(`
      {
        "@listener(@selector(selector1)-1)-2": {
          "observers": [],
          "sources": [
            {
              "key": "@selector(selector1)-1",
              "operation": "on",
            },
          ],
          "weight": 2,
        },
        "@selector(selector1)-1": {
          "observers": [
            {
              "key": "@listener(@selector(selector1)-1)-2",
              "operation": "on",
            },
          ],
          "sources": [],
          "weight": 1,
        },
      }
    `)

    cleanup()

    expect(ecosystem.viewGraph()).toEqual({})
  })

  test('on() throws an error when passed an invalid ecosystem event name', () => {
    // @ts-expect-error invalid event name
    expect(() => ecosystem.on('nothing', () => {})).toThrow(
      /Invalid event name "nothing"/
    )
  })

  test('removeOverrides() accepts atom templates and string keys', () => {
    const atom1 = atom('1', 'a')
    const atom1Override = atom1.override('aa')

    ecosystem.setOverrides([atom1Override])

    expect(ecosystem.overrides).toEqual({ 1: atom1Override })

    ecosystem.removeOverrides(['1'])

    expect(ecosystem.overrides).toEqual({})

    ecosystem.addOverrides([atom1Override])

    expect(ecosystem.overrides).toEqual({ 1: atom1Override })

    ecosystem.removeOverrides([atom1])

    expect(ecosystem.overrides).toEqual({})
  })

  test('select() returns the cached value if there is one', () => {
    const a = { a: 1 }
    const selector1 = () => a

    const instance = ecosystem.getNode(selector1)

    expect(instance.v).toBe(a)
    expect(ecosystem.select(selector1)).toBe(a)
  })

  test('select() statically runs an AtomSelectorConfig selector', () => {
    const a = { a: 1 }
    const selector1 = () => a
    const selectorConfig = {
      resultsComparator: jest.fn(() => true), // ignored
      selector: selector1,
    }

    const result1 = ecosystem.select(selectorConfig)
    const result2 = ecosystem.select(selectorConfig)

    expect(result1).toBe(a)
    expect(result2).toBe(a)
    expect(selectorConfig.resultsComparator).not.toHaveBeenCalled()
  })

  test('why() returns undefined if called outside atom or selector evaluation', () => {
    expect(ecosystem.why()).toBeUndefined()
  })

  test('when the ecosystem contains signals, `.findAll` with `includeTags` or `excludeTags` skips them', () => {
    const signal = ecosystem.signal(1)

    expect(ecosystem.findAll({ includeTags: ['example'] })).toEqual([])
    expect(ecosystem.findAll({ excludeTags: ['example'] })).toEqual([signal])
  })

  describe('ephemeral selector destruction does not cascade', () => {
    test('get() with an inline selector does not destroy its source atoms', () => {
      const atom1 = atom('1', () => 'a')
      // Pre-create the atom instance so it exists in the graph
      const instance = ecosystem.getNode(atom1)

      // Call get() with a selector outside a reactive context - this creates
      // an ephemeral selector that reads atom1, then destroys it
      const result = ecosystem.get(({ get }) => get(atom1))

      expect(result).toBe('a')
      // The source atom must still be alive
      expect(instance.status).toBe('Active')
      expect(ecosystem.n.get('1')).toBe(instance)
    })

    test('getOnce() with an inline selector does not destroy its source atoms', () => {
      const atom1 = atom('1', () => 'a')
      const instance = ecosystem.getNode(atom1)

      const result = ecosystem.getOnce(({ get }) => get(atom1))

      expect(result).toBe('a')
      expect(instance.status).toBe('Active')
      expect(ecosystem.n.get('1')).toBe(instance)
    })

    test('get() does not destroy source atoms that have zero observers', () => {
      // This is the exact scenario from the bug report: the source atom has
      // no observers, and the ephemeral selector is its only (transient) one
      const atom1 = atom('1', () => 'a')

      // getNode creates the instance but nothing observes it
      const instance = ecosystem.getNode(atom1)
      expect(instance.o.size).toBe(0)

      const result = ecosystem.get(({ get }) => get(atom1))

      expect(result).toBe('a')
      expect(instance.status).toBe('Active')
      expect(instance.o.size).toBe(0)
    })

    test('get() does not cascade-destroy a chain of zero-observer atoms', () => {
      const atom1 = atom('1', () => 'a', { ttl: 0 })
      const atom2 = ion('2', ({ get }) => get(atom1) + 'b', { ttl: 0 })

      // Create both atoms. atom2 observes atom1.
      const instance2 = ecosystem.getNode(atom2)
      const instance1 = ecosystem.n.get('1')!

      // Now remove atom2's only external observer (there is none besides
      // the edge from atom2 -> atom1). atom1 has 1 observer (atom2).
      expect(instance1.o.size).toBe(1)

      // Use get() with a selector that reads atom2. The ephemeral selector
      // becomes atom2's only observer. When it's destroyed, atom2 should
      // not be cascade-destroyed (and therefore atom1 should not either).
      const result = ecosystem.get(({ get }) => get(atom2))

      expect(result).toBe('ab')
      expect(instance1.status).toBe('Active')
      expect(instance2.status).toBe('Active')
    })

    test('get() does not destroy source atoms even when the selector reads multiple atoms', () => {
      const atom1 = atom('1', () => 1)
      const atom2 = atom('2', () => 2)
      const atom3 = atom('3', () => 3)

      const instance1 = ecosystem.getNode(atom1)
      const instance2 = ecosystem.getNode(atom2)
      const instance3 = ecosystem.getNode(atom3)

      const result = ecosystem.get(
        ({ get }) => get(atom1) + get(atom2) + get(atom3)
      )

      expect(result).toBe(6)
      expect(instance1.status).toBe('Active')
      expect(instance2.status).toBe('Active')
      expect(instance3.status).toBe('Active')
    })

    test('the ephemeral selector itself is still destroyed', () => {
      const atom1 = atom('1', () => 'a')
      ecosystem.getNode(atom1)

      ecosystem.get(({ get }) => get(atom1))

      // Only the atom should remain in the graph, not the selector
      const nodeIds = [...ecosystem.n.keys()]
      expect(nodeIds).toEqual(['1'])
    })

    test('get() inside injectEffect does not destroy source atoms', () => {
      const atom1 = atom('1', () => 'value')
      const atom2 = atom('2', () => {
        const eco = injectEcosystem()

        injectEffect(() => {
          // This calls ecosystem.get() with a selector outside evaluation
          // context (effects run outside evaluation). This must not destroy
          // atom1.
          eco.get(({ get }) => get(atom1))
        }, [])

        return 'b'
      })

      ecosystem.getNode(atom1)
      ecosystem.getNode(atom2)

      expect(ecosystem.n.get('1')!.status).toBe('Active')
      expect(ecosystem.n.get('2')!.status).toBe('Active')
    })

    test('getOnce() does not cascade-destroy source atoms with zero observers', () => {
      const atom1 = atom('1', () => 'a')
      const instance = ecosystem.getNode(atom1)
      expect(instance.o.size).toBe(0)

      const result = ecosystem.getOnce(({ get }) => get(atom1))

      expect(result).toBe('a')
      expect(instance.status).toBe('Active')
    })

    test('get() with a selector that reads an observed selector does not destroy it', () => {
      const atom1 = atom('1', () => 1)
      const selector1 = ({ get }: { get: typeof ecosystem.get }) => get(atom1) * 2

      // Pre-cache the selector and give it an active observer so it's not ephemeral
      const selectorNode = ecosystem.getNode(selector1)
      const atomNode = ecosystem.getNode(atom1)
      const cleanup = selectorNode.on('change', () => {}, { active: true })

      // Now use get() with another selector that reads selector1
      const result = ecosystem.get(({ get }) => get(selector1) + 10)

      expect(result).toBe(12)
      expect(selectorNode.status).toBe('Active')
      expect(atomNode.status).toBe('Active')

      cleanup()
    })

    test('get() does cascade-destroy observerless transitive selectors', () => {
      const atom1 = atom('1', () => 1)
      const selector1 = ({ get }: { get: typeof ecosystem.get }) => get(atom1) * 2

      // Pre-cache selector1 - it has no observers other than what the
      // ephemeral selector will add
      const selectorNode = ecosystem.getNode(selector1)
      const atomNode = ecosystem.getNode(atom1)

      const result = ecosystem.get(({ get }) => get(selector1) + 10)

      expect(result).toBe(12)
      // The observerless selector is cleaned up (it's equally ephemeral)
      expect(selectorNode.status).toBe('Destroyed')
      // But the atom survives
      expect(atomNode.status).toBe('Active')
    })

    test('source atoms remain functional after ephemeral selector cleanup', () => {
      const atom1 = atom('1', () => 'a')
      const instance = ecosystem.getNode(atom1)

      ecosystem.get(({ get }) => get(atom1))

      // The atom should still be fully functional - can set and get values
      instance.set('b')
      expect(instance.get()).toBe('b')

      // And can still be observed by new selectors
      const selectorNode = ecosystem.getNode(
        ({ get }: { get: typeof ecosystem.get }) => get(atom1) + '!'
      )
      expect(selectorNode.get()).toBe('b!')

      // And reactivity should still work
      instance.set('c')
      expect(selectorNode.get()).toBe('c!')
    })

    test('normal (non-ephemeral) selector destruction still cascades', () => {
      // Ensure the fix doesn't break normal cascade behavior
      const atom1 = atom('1', () => 'a', { ttl: 0 })
      const selector1 = ({ get }: { get: typeof ecosystem.get }) => get(atom1)

      const selectorNode = ecosystem.getNode(selector1)
      const atomNode = ecosystem.n.get('1')!

      // atom1's only observer is selector1
      expect(atomNode.o.size).toBe(1)

      // Force-destroying the selector should cascade to atom1 (ttl: 0)
      selectorNode.destroy(true)

      expect(selectorNode.status).toBe('Destroyed')
      expect(atomNode.status).toBe('Destroyed')
    })

    test('multiple sequential get() calls do not destroy shared source atoms', () => {
      const atom1 = atom('1', () => 10)
      const instance = ecosystem.getNode(atom1)

      // Multiple ephemeral selectors reading the same atom
      const r1 = ecosystem.get(({ get }) => get(atom1) + 1)
      const r2 = ecosystem.get(({ get }) => get(atom1) + 2)
      const r3 = ecosystem.get(({ get }) => get(atom1) + 3)

      expect(r1).toBe(11)
      expect(r2).toBe(12)
      expect(r3).toBe(13)
      expect(instance.status).toBe('Active')
    })

    test('get() with a selector does not destroy atoms created during selector evaluation', () => {
      const atom1 = atom('1', () => 'hello')

      // No pre-creation - the atom will be created lazily by the selector
      const result = ecosystem.get(({ get }) => get(atom1) + ' world')

      expect(result).toBe('hello world')
      // The atom was created during selector evaluation and must survive
      expect(ecosystem.n.get('1')!.status).toBe('Active')
    })
  })
})
