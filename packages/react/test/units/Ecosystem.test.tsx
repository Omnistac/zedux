import { atom, createEcosystem } from '@zedux/react'
import { ecosystem } from '../utils/ecosystem'
import { mockConsole } from '../utils/console'

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

  test('flags must be an array', () => {
    // @ts-expect-error flags must be an array
    expect(() => createEcosystem({ flags: { a: true } })).toThrowError(
      /must be an array/i
    )
  })

  test('overrides must be an array', () => {
    // @ts-expect-error overrides must be an array
    expect(() => createEcosystem({ overrides: { a: true } })).toThrowError(
      /must be an array/i
    )
  })

  test('atom override flags are also respected', () => {
    const mock = mockConsole('error')
    const atom1 = atom('1', 'a', { flags: ['test-flag'] })
    const atom1Override = atom1.override('aa')

    const testEcosystem = createEcosystem({
      flags: [],
      overrides: [atom1Override],
    })

    const instance = testEcosystem.getInstance(atom1)

    expect(instance.t).toBe(atom1Override)
    expect(mock).toHaveBeenCalledTimes(1)
    expect(mock).toHaveBeenCalledWith(
      expect.stringContaining('encountered unsafe atom')
    )

    testEcosystem.destroy()
  })

  test('onReady cleanup is called on ecosystem reset and destroy', () => {
    const cleanup = jest.fn()
    const onReady = jest.fn(() => cleanup)
    const a = { a: 1 }
    const b = { a: 2 }

    const testEcosystem = createEcosystem({ context: a, onReady })

    expect(onReady).toHaveBeenCalledTimes(1)
    expect(onReady).toHaveBeenCalledWith(testEcosystem)
    expect(cleanup).not.toHaveBeenCalled()

    testEcosystem.reset(b)

    expect(onReady).toHaveBeenCalledTimes(2)
    expect(onReady).toHaveBeenLastCalledWith(testEcosystem, a)
    expect(cleanup).toHaveBeenCalledTimes(1)

    testEcosystem.destroy()

    expect(onReady).toHaveBeenCalledTimes(2)
    expect(onReady).toHaveBeenLastCalledWith(testEcosystem, a)
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

    const instances = Array(10)
      .fill(null)
      .map((_, i) => ecosystem.getInstance(atom1, [i]))
    const expected = Object.fromEntries(
      instances.map(instance => [instance.id, instance])
    )

    expect(ecosystem.findAll()).toEqual(expected)
  })

  test('getInstance() throws an error if bad values are passed', () => {
    const atom1 = atom('1', (param: string) => param)

    // @ts-expect-error first param must be an atom template or instance
    expect(() => ecosystem.getInstance({})).toThrowError(
      /Expected a template or node. Received object/i
    )

    // @ts-expect-error first param must be an atom template or instance
    expect(() => ecosystem.getInstance()).toThrowError(
      "Cannot read properties of undefined (reading 'izn')"
    )

    // @ts-expect-error second param must be an array or undefined
    expect(() => ecosystem.getInstance(atom1, 'a')).toThrowError(
      /Expected atom params to be an array. Received string/i
    )
  })

  test('getNode() throws an error if bad values are passed', () => {
    const atom1 = atom('1', (param: string) => param)

    // @ts-expect-error first param must be an atom template or instance
    expect(() => ecosystem.getNode({})).toThrowError(
      /Expected a template or node. Received object/i
    )

    // @ts-expect-error first param must be an atom template or instance
    expect(() => ecosystem.getNode()).toThrowError(
      "Cannot read properties of undefined (reading 'izn')"
    )

    // @ts-expect-error second param must be an array or undefined
    expect(() => ecosystem.getNode(atom1, 'a')).toThrowError(
      /Expected atom params to be an array. Received string/i
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
})
