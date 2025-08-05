import { atom, createEcosystem, injectEcosystem, ion } from '@zedux/react'
import { ecosystem } from '../utils/ecosystem'
import { mockConsole } from '../utils/console'
import { expectTypeOf } from 'expect-type'

describe('Ecosystem', () => {
  test('passing a SelectorInstance to .select() and .get() returns the result of the passed instance', () => {
    const selector1 = () => ({ a: 1 })

    const instance = ecosystem.getNode(selector1)
    const selectValue = ecosystem.select(instance)
    const getValue = ecosystem.get(instance, [])

    expect(selectValue).toEqual({ a: 1 })
    expect(getValue).toEqual({ a: 1 })
    expect(instance.v).toBe(selectValue)
    expect(instance.v).toBe(getValue)
  })

  test('tags must be an array', () => {
    // @ts-expect-error tags must be an array
    expect(() => createEcosystem({ tags: { a: true } })).toThrowError(
      /must be an array/i
    )
  })

  test('overrides must be an array', () => {
    // @ts-expect-error overrides must be an array
    expect(() => createEcosystem({ overrides: { a: true } })).toThrowError(
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

  test('getInstance() throws an error if bad values are passed', () => {
    const atom1 = atom('1', (param: string) => param)

    // @ts-expect-error first param must be an atom template or instance
    expect(() => ecosystem.getInstance({})).toThrowError(
      /Expected a template, selector, or graph node/i
    )

    // @ts-expect-error first param must be an atom template or instance
    expect(() => ecosystem.getInstance()).toThrowError(
      "Cannot read properties of undefined (reading 'izn')"
    )

    // @ts-expect-error second param must be an array or undefined
    expect(() => ecosystem.getInstance(atom1, 'a')).toThrowError(
      /Expected atom params to be an array/i
    )
  })

  test('getNode() throws an error if bad values are passed', () => {
    const atom1 = atom('1', (param: string) => param)

    // @ts-expect-error first param must be an atom template or instance
    expect(() => ecosystem.getNode({})).toThrowError(
      /Expected a template, selector, or graph node/i
    )

    // @ts-expect-error first param must be an atom template or instance
    expect(() => ecosystem.getNode()).toThrowError(
      "Cannot read properties of undefined (reading 'izn')"
    )

    // @ts-expect-error second param must be an array or undefined
    expect(() => ecosystem.getNode(atom1, 'a')).toThrowError(
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

  test('on() throws an error when passed an invalid ecosystem event name', () => {
    // @ts-expect-error invalid event name
    expect(() => ecosystem.on('nothing', () => {})).toThrowError(
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
})
