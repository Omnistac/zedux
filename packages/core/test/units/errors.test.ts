import { assertAreFunctions } from '@zedux/core/utils/errors'

describe('assertAreFunctions()', () => {
  test('throws a TypeError if any items are not functions', () => {
    expect(assertAreFunctions.bind(null, [1])).toThrow(TypeError)

    expect(assertAreFunctions.bind(null, [{}])).toThrow(TypeError)

    expect(
      assertAreFunctions.bind(null, [() => {}, () => {}, 'a', () => {}])
    ).toThrow(TypeError)

    expect(assertAreFunctions.bind(null, [() => {}, () => {}])).not.toThrow()
  })
})
