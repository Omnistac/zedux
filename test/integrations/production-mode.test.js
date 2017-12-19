process.env.NODE_ENV = 'production'

// Use require() instead of an import to force synchronous evaluation:
const { invalidAccess } = require('../../src/utils/errors')


describe('production environment', () => {

  test('informs the user that zedux is running in production mode', () => {

    expect(
      invalidAccess()
    ).toMatch(/production mode.*try running zedux in development/i)

  })

})
