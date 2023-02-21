import { actionFactory } from '@zedux/core'
import { extractActionTypes } from '@zedux/core/utils/actions'

describe('extractActionTypes()', () => {
  test('extracts mixed strings and action factories', () => {
    const a = actionFactory('a')

    expect(extractActionTypes([a, 'b'], 'test')).toEqual(['a', 'b'])
  })

  test('throws an error if a non action factory function or other object is passed', () => {
    expect(() => extractActionTypes([{}], 'test')).toThrow(TypeError)
    expect(() => extractActionTypes([() => {}], 'test')).toThrow(TypeError)
  })
})
