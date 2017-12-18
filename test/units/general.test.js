import {
  ARRAY,
  COMPLEX_OBJECT,
  NO_PROTOTYPE,
  NULL,
  PLAIN_OBJECT,
  isPlainObject,
  detailedTypeof
} from '../../src/utils/general'

import { nonPlainObjects, plainObjects } from '../utils'


describe('isPlainObject()', () => {

  test('returns true if the given variable is a plain object', () => {

    plainObjects.forEach(
      plainObject => expect(isPlainObject(plainObject)).toBe(true)
    )

  })


  test('returns false if the given variable is not a plain object', () => {

    nonPlainObjects.forEach(
      nonPlainObject => expect(isPlainObject(nonPlainObject)).toBe(false)
    )

  })

})


describe('detailedTypeof()', () => {

  test('returns the detailed type of the given variable', () => {

    expect(detailedTypeof()).toBe('undefined')
    expect(detailedTypeof(null)).toBe(NULL)
    expect(detailedTypeof('a')).toBe('string')
    expect(detailedTypeof(1)).toBe('number')
    expect(detailedTypeof([])).toBe(ARRAY)
    expect(detailedTypeof(() => {})).toBe('function')
    expect(detailedTypeof(new Map())).toBe(COMPLEX_OBJECT)
    expect(detailedTypeof(Object.create(null))).toBe(NO_PROTOTYPE)

    plainObjects.forEach(
      plainObject => expect(detailedTypeof(plainObject)).toBe(PLAIN_OBJECT)
    )

  })

})
