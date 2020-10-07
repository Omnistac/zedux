import { createStore, isZeduxStore } from '@src/index'
import {
  ARRAY,
  COMPLEX_OBJECT,
  detailedTypeof,
  isPlainObject,
  NO_PROTOTYPE,
  NULL,
  PLAIN_OBJECT,
} from '@src/utils/general'

import { nonPlainObjects, plainObjects } from '@test/utils'

describe('detailedTypeof()', () => {
  test('returns the detailed type of the given variable', () => {
    expect(detailedTypeof(undefined)).toBe('undefined')
    expect(detailedTypeof(null)).toBe(NULL)
    expect(detailedTypeof('a')).toBe('string')
    expect(detailedTypeof(1)).toBe('number')
    expect(detailedTypeof([])).toBe(ARRAY)
    expect(detailedTypeof(() => {})).toBe('function')
    expect(detailedTypeof(new Map())).toBe(COMPLEX_OBJECT)
    expect(detailedTypeof(Object.create(null))).toBe(NO_PROTOTYPE)

    plainObjects.forEach(plainObject =>
      expect(detailedTypeof(plainObject)).toBe(PLAIN_OBJECT)
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

describe('isZeduxStore()', () => {
  test('returns true if the given variable is a zedux store', () => {
    const store = createStore()

    expect(isZeduxStore(store)).toBe(true)
    expect(isZeduxStore(null)).toBe(null)
  })
})
