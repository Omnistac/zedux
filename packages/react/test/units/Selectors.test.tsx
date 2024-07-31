import { atom, AtomGetters } from '@zedux/react'
import { ecosystem } from '../utils/ecosystem'
import { mockConsole } from '../utils/console'

const atom1 = atom('1', () => 'a', { ttl: 0 })
const selector1 = ({ get }: AtomGetters) => get(atom1) + 'b'
const selector2 = ({ select }: AtomGetters) => select(selector1) + 'c'
const selector3 = ({ select }: AtomGetters) => select(selector2) + 'd'

describe('the Selectors class', () => {
  test('deeply nested selectors get auto-created', () => {
    const cache = ecosystem.selectors.getCache(selector3)
    const cache3 = {
      args: [],
      id: '@@selector-selector3-0',
      nextReasons: [],
      prevReasons: [],
      result: 'abcd',
      selectorRef: selector3,
    }

    expect(cache).toEqual(cache3)

    expect(ecosystem.selectors._items).toEqual({
      '@@selector-selector1-2': {
        args: [],
        id: '@@selector-selector1-2',
        nextReasons: [],
        prevReasons: [],
        result: 'ab',
        selectorRef: selector1,
      },
      '@@selector-selector2-1': {
        args: [],
        id: '@@selector-selector2-1',
        nextReasons: [],
        prevReasons: [],
        result: 'abc',
        selectorRef: selector2,
      },
      [cache3.id]: cache3,
    })
  })

  test('addDependent() adds and removes dependents', () => {
    const cache2a = ecosystem.selectors.getCache(selector2)

    expect(ecosystem.selectors._items).toEqual({
      '@@selector-selector1-1': expect.any(Object),
      '@@selector-selector2-0': expect.any(Object),
    })

    // trigger cleanup without adding a dependent first
    ecosystem.selectors.destroyCache(cache2a)

    expect(ecosystem.selectors._items).toEqual({})

    const cache2b = ecosystem.selectors.getCache(selector2)
    const cache1b = ecosystem.selectors.getCache(selector1)
    const cleanup = ecosystem.selectors.addDependent(cache1b)

    ecosystem.selectors.destroyCache(cache2b) // destroys only selector2

    expect(ecosystem.selectors._items).toEqual({
      // id # is still 1 'cause the Selector class's `_refBaseKeys` still holds
      // the cached key despite `cache2b`'s destruction above
      '@@selector-selector1-1': expect.any(Object),
    })

    cleanup()

    expect(ecosystem.selectors._items).toEqual({})
  })

  test('dehydrate() returns a map of cache keys to current values', () => {
    ecosystem.selectors.getCache(selector3)

    expect(ecosystem.selectors.dehydrate()).toEqual({
      '@@selector-selector1-2': 'ab',
      '@@selector-selector2-1': 'abc',
      '@@selector-selector3-0': 'abcd', // selector3's id is created first
    })
  })

  test('destroyCache() does nothing if the cache is already destroyed', () => {
    const cache = ecosystem.selectors.getCache(selector3)
    ecosystem.selectors.destroyCache(cache)

    expect(cache.isDestroyed).toBe(true)
    expect(ecosystem.viewGraph()).toEqual({})

    expect(() => ecosystem.selectors.destroyCache(cache)).not.toThrow()
    expect(() => ecosystem.selectors.destroyCache(selector2)).not.toThrow()
  })

  test('if the selector has dependents, `destroyCache()` bails out unless `force` is passed', () => {
    jest.useFakeTimers()
    ecosystem.selectors.getCache(selector3)
    const cache1 = ecosystem.selectors.getCache(selector1)
    const cache2 = ecosystem.selectors.getCache(selector2)

    ecosystem.selectors.destroyCache(selector1) // does nothing
    ecosystem.selectors.destroyCache(selector2) // does nothing

    expect(cache1.isDestroyed).toBeUndefined()
    expect(cache2.isDestroyed).toBeUndefined()
    expect(ecosystem.selectors.dehydrate()).toEqual({
      '@@selector-selector1-2': 'ab',
      '@@selector-selector2-1': 'abc',
      '@@selector-selector3-0': 'abcd',
    })

    ecosystem.selectors.destroyCache(selector2, [], true) // destroys both 1 & 2
    jest.runAllTimers()

    expect(cache1.isDestroyed).toBe(true)
    expect(cache2.isDestroyed).toBe(true)
    expect(ecosystem.selectors.dehydrate()).toEqual({
      // ids 2 & 1 - the refs are still cached in the Selector class's
      // `_refBaseKeys`
      '@@selector-selector1-2': 'ab',
      '@@selector-selector2-1': 'abc',
      '@@selector-selector3-0': 'abcd',
    })

    ecosystem.selectors.destroyCache(selector3)

    expect(ecosystem.selectors.dehydrate()).toEqual({})
  })

  test('find() returns the passed cache', () => {
    const cache = ecosystem.selectors.getCache(selector1)

    expect(ecosystem.selectors.find(cache)).toBe(cache)
  })

  test('find() returns the first cache that matches the passed string', () => {
    ecosystem.selectors.getCache(selector3)
    const cache2 = ecosystem.selectors.getCache(selector2)

    expect(ecosystem.selectors.find('selector2')).toBe(cache2)
  })

  test('findAll() accepts selector refs, caches, or string ids', () => {
    const cache = ecosystem.selectors.getCache(selector3)
    const allCaches = ecosystem.selectors.findAll()

    expect(Object.keys(allCaches)).toEqual([
      '@@selector-selector1-2',
      '@@selector-selector2-1',
      '@@selector-selector3-0', // the id for selector3 is generated first
    ])

    const caches1 = ecosystem.selectors.findAll('selector2')

    expect(caches1).toEqual({
      '@@selector-selector2-1': ecosystem.selectors.getCache(selector2),
    })

    const caches2 = ecosystem.selectors.findAll(selector3)

    expect(caches2).toEqual({
      '@@selector-selector3-0': cache,
    })

    const caches3 = ecosystem.selectors.findAll(cache)

    expect(caches3).toEqual({
      '@@selector-selector3-0': cache,
    })
  })

  test("findAll() returns an empty object if the selector hasn't been cached", () => {
    ecosystem.selectors.getCache(selector2)

    expect(ecosystem.selectors.findAll(selector3)).toEqual({})
  })

  test('getCache() returns the passed cache', () => {
    const cache = ecosystem.selectors.getCache(selector1)

    expect(ecosystem.selectors.getCache(cache)).toBe(cache)
  })

  test('selector errors are caught', () => {
    const mock = mockConsole('error')

    const atom1 = atom('1', 'a')

    // @ts-expect-error accessing undefined property
    const selector1 = ({ get }: AtomGetters) => get(atom1).nothing()

    expect(() => ecosystem.selectors.getCache(selector1)).toThrowError(
      /not a function/i
    )

    expect(mock).toHaveBeenCalledTimes(1)
    expect(mock).toHaveBeenCalledWith(
      expect.stringContaining('encountered an error while running selector'),
      expect.any(TypeError)
    )
  })

  test('different arg-accepting selectors with the exact same name and args create different cache entries', () => {
    const selector1 = function commonName(_: AtomGetters, id: string) {
      return `${id}b`
    }

    const selector2 = function commonName(_: AtomGetters, id: string) {
      return `${id}c`
    }

    ecosystem.selectors.getCache(selector1, ['a'])
    ecosystem.selectors.getCache(selector2, ['a'])

    expect(ecosystem.selectors._items).toMatchInlineSnapshot(`
      {
        "@@selector-commonName-0-["a"]": SelectorCache {
          "args": [
            "a",
          ],
          "id": "@@selector-commonName-0-["a"]",
          "nextReasons": [],
          "prevReasons": [],
          "result": "ab",
          "selectorRef": [Function],
        },
        "@@selector-commonName-1-["a"]": SelectorCache {
          "args": [
            "a",
          ],
          "id": "@@selector-commonName-1-["a"]",
          "nextReasons": [],
          "prevReasons": [],
          "result": "ac",
          "selectorRef": [Function],
        },
      }
    `)
  })
})
