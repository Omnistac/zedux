import { atom, AtomGetters } from '@zedux/react'
import {
  ecosystem,
  getSelectorNodes,
  snapshotSelectorNodes,
} from '../utils/ecosystem'
import { mockConsole } from '../utils/console'

const atom1 = atom('1', () => 'a', { ttl: 0 })
const selector1 = ({ get }: AtomGetters) => get(atom1) + 'b'
const selector2 = ({ select }: AtomGetters) => select(selector1) + 'c'
const selector3 = ({ select }: AtomGetters) => select(selector2) + 'd'

describe('the SelectorInstance class', () => {
  test('deeply nested selectors get auto-created', () => {
    const instance = ecosystem.getNode(selector3)
    const expected = {
      id: '@@selector-selector3-0',
      p: [],
      t: selector3,
      v: 'abcd',
      w: [],
    }

    expect(instance).toEqual(expect.objectContaining(expected))
    snapshotSelectorNodes()
  })

  test('on() adds and removes dependents', () => {
    const instance2a = ecosystem.getNode(selector2)

    expect(getSelectorNodes()).toEqual({
      '@@selector-selector1-1': expect.any(Object),
      '@@selector-selector2-0': expect.any(Object),
    })

    // trigger cleanup without adding a dependent first
    instance2a.destroy()

    expect(getSelectorNodes()).toEqual({})

    const instance2b = ecosystem.getNode(selector2)
    const instance1b = ecosystem.getNode(selector1)
    const cleanup = instance1b.on(() => {})

    instance2b.destroy() // destroys only selector2

    expect(getSelectorNodes()).toEqual({
      // id # is still 1 'cause the Selector class's `_refBaseKeys` still holds
      // the cached key despite `instance2b`'s destruction above
      '@@selector-selector1-1': expect.any(Object),
    })

    cleanup()

    expect(getSelectorNodes()).toEqual({})
  })

  test('ecosystem.dehydrate("@@selector") returns all cached selectors', () => {
    ecosystem.getNode(selector3)

    expect(ecosystem.dehydrate('@@selector')).toEqual({
      '@@selector-selector1-2': 'ab',
      '@@selector-selector2-1': 'abc',
      '@@selector-selector3-0': 'abcd', // selector3's id is created first
    })
  })

  test('destroy() does nothing if the instance is already destroyed', () => {
    const instance = ecosystem.getNode(selector3)
    instance.destroy()

    expect(instance.l).toBe('Destroyed')
    expect(ecosystem.viewGraph()).toEqual({})

    expect(() => instance.destroy()).not.toThrow()
    expect(() => ecosystem.getNode(selector2).destroy()).not.toThrow()
  })

  test('if the selector has dependents, `destroyCache()` bails out unless `force` is passed', () => {
    jest.useFakeTimers()
    ecosystem.getNode(selector3)
    const instance1 = ecosystem.getNode(selector1)
    const instance2 = ecosystem.getNode(selector2)

    ecosystem.getNode(selector1).destroy() // does nothing
    ecosystem.getNode(selector2).destroy() // does nothing

    expect(instance1.l).toBe('Active')
    expect(instance2.l).toBe('Active')
    expect(ecosystem.dehydrate('@@selector')).toEqual({
      '@@selector-selector1-2': 'ab',
      '@@selector-selector2-1': 'abc',
      '@@selector-selector3-0': 'abcd',
    })

    ecosystem.getNode(selector2, []).destroy(true) // destroys both 1 & 2
    jest.runAllTimers()

    expect(instance1.l).toBe('Destroyed')
    expect(instance2.l).toBe('Destroyed')
    expect(ecosystem.dehydrate('@@selector')).toEqual({
      // ids 2 & 1 - the refs are still cached in the Selector class's
      // `_refBaseKeys`
      '@@selector-selector1-2': 'ab',
      '@@selector-selector2-1': 'abc',
      '@@selector-selector3-0': 'abcd',
    })

    ecosystem.getNode(selector3).destroy()

    expect(ecosystem.dehydrate('@@selector')).toEqual({})
  })

  test('ecosystem.find() returns the first selector instance that matches the passed string', () => {
    ecosystem.getNode(selector3)
    const instance2 = ecosystem.getNode(selector2)

    expect(ecosystem.find('selector2')).toBe(instance2)
  })

  // TODO: address the problems in these two tests
  test.skip('ecosystem.findAll() accepts selector refs or string ids', () => {
    const instance = ecosystem.getNode(selector3)
    const allNodes = ecosystem.findAll()

    expect(Object.keys(allNodes)).toEqual([
      '1',
      '@@selector-selector1-2',
      '@@selector-selector2-1',
      '@@selector-selector3-0', // the id for selector3 is generated first
    ])

    const instances1 = ecosystem.findAll('selector2')

    expect(instances1).toEqual({
      '@@selector-selector2-1': ecosystem.getNode(selector2),
    })

    const instances2 = ecosystem.findAll(selector3)

    expect(instances2).toEqual({
      '@@selector-selector3-0': instance,
    })
  })

  test.skip("ecosystem.findAll() returns an empty object if the selector hasn't been cached", () => {
    ecosystem.getNode(selector2)

    expect(ecosystem.findAll(selector3)).toEqual({})
  })

  test('getNode(instance) returns the passed instance', () => {
    const instance = ecosystem.getNode(selector1)

    expect(ecosystem.getNode(instance)).toBe(instance)
  })

  test('selector errors are caught', () => {
    const mock = mockConsole('error')

    const atom1 = atom('1', 'a')

    // @ts-expect-error accessing undefined property
    const selector1 = ({ get }: AtomGetters) => get(atom1).nothing()

    expect(() => ecosystem.getNode(selector1)).toThrowError(/not a function/i)

    expect(mock).toHaveBeenCalledTimes(1)
    expect(mock).toHaveBeenCalledWith(
      expect.stringContaining('encountered an error while running selector'),
      expect.any(TypeError)
    )
  })

  test('different arg-accepting selectors with the exact same name and args create different instances', () => {
    const selector1 = function commonName(_: AtomGetters, id: string) {
      return `${id}b`
    }

    const selector2 = function commonName(_: AtomGetters, id: string) {
      return `${id}c`
    }

    ecosystem.getNode(selector1, ['a'])
    ecosystem.getNode(selector2, ['a'])

    snapshotSelectorNodes()
  })
})
