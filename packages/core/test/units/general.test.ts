import {
  createStore,
  detailedTypeof,
  is,
  isPlainObject,
  Store,
} from '@zedux/core'
import { nonPlainObjects, plainObjects } from '../utils'

describe('detailedTypeof()', () => {
  test('returns the detailed type of the given variable', () => {
    expect(detailedTypeof(undefined)).toBe('undefined')
    expect(detailedTypeof(null)).toBe('null')
    expect(detailedTypeof('a')).toBe('string')
    expect(detailedTypeof(1)).toBe('number')
    expect(detailedTypeof([])).toBe('array')
    expect(detailedTypeof(() => {})).toBe('function')
    expect(detailedTypeof(new Map())).toBe('complex object')
    expect(detailedTypeof(Object.create(null))).toBe('prototype-less object')

    plainObjects.forEach(plainObject =>
      expect(detailedTypeof(plainObject)).toBe('object')
    )
  })
})

describe('isPlainObject()', () => {
  test('returns true if the given variable is a plain object', () => {
    plainObjects.forEach(plainObject =>
      expect(isPlainObject(plainObject)).toBe(true)
    )
  })

  test('returns false if the given variable is not a plain object', () => {
    nonPlainObjects.forEach(nonPlainObject =>
      expect(isPlainObject(nonPlainObject)).toBe(false)
    )
  })
})

describe('is()', () => {
  test('returns true if the given variable is a zedux store', () => {
    const store = createStore()

    expect(is(store, Store)).toBe(true)
    expect(is(null, Store)).toBe(false)
  })
})
