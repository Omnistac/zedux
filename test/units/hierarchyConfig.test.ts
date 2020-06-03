import { clone, create, get, set } from '@src/utils/hierarchyConfig'

describe('clone()', () => {
  test('returns a shallow copy of the passed object', () => {
    const obj1 = { a: 1 }
    const obj2 = { a: 1, b: { c: 3 } }

    const obj1Clone = clone(obj1)
    const obj2Clone = clone(obj2)

    expect(obj1Clone).not.toBe(obj1)
    expect(obj1Clone).toEqual(obj1)

    expect(obj2Clone).not.toBe(obj2)
    expect(obj2Clone).toEqual(obj2)
    expect(obj2Clone.b).toBe(obj2.b)
  })
})

describe('create()', () => {
  test('returns a new, empty object', () => {
    expect(create()).toEqual({})
  })
})

describe('get()', () => {
  test('retrieves a value from the given object', () => {
    expect(get({ a: 1 }, 'a')).toBe(1)
    expect(get({ b: 2 }, 'c')).not.toBeDefined()
  })
})

describe('set()', () => {
  test('sets a value on the given object mutatively', () => {
    const obj1 = { a: 1 }

    set(obj1, 'b', 2)

    expect(obj1).toEqual({ a: 1, b: 2 })
  })
})
