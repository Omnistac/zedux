process.env.NODE_ENV = 'production'

// Use require() instead of an import to force synchronous evaluation:
/* eslint @typescript-eslint/no-var-requires: "off" */
const { invalidAccess } = require('@src/utils/errors')

process.env.NODE_ENV = 'development'

describe('production environment', () => {
  test('informs the user that zedux is running in production mode', () => {
    expect(invalidAccess()).toMatch(/production mode/i)
  })
})
