import { react } from '../../src/index'


describe('Zedux.react()', () => {

  test('returns a ZeduxReactor', () => {

    const reactor = react()

    expect(typeof reactor).toBe('function')
    expect(reactor).toEqual(expect.objectContaining({
      process: expect.any(Function),
      to: expect.any(Function),
      toEverything: expect.any(Function),
      withProcessors: expect.any(Function),
      withReducers: expect.any(Function)
    }))

  })

})
