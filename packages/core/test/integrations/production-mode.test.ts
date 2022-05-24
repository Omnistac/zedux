// Use require() instead of an import to force synchronous evaluation:
// eslint-disable-next-line @typescript-eslint/no-var-requires
// const { invalidAccess } = require('@zedux/core/utils/errors')

describe('production environment', () => {
  test('just a test to make jest happy till we get real tests in here', () => {
    expect(1).toBe(1)
  })
})
