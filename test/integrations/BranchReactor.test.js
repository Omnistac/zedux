import { createStore } from '../../src/index'


describe('BranchReactor', () => {

  test('delegates the appropriate state slice to child reducers', () => {

    const reducer = jest.fn(() => 1)
    const store = createStore()
      .use({
        a: {
          b: {
            c: reducer
          }
        }
      })

    store.dispatch({ type: 'd' })

    expect(reducer).toHaveBeenLastCalledWith(1, { type: 'd' })

  })

  test('delegates the appropriate state slice to child processors', () => {

    const reactor = () => 1
    reactor.process = jest.fn()

    const store = createStore()
      .use({
        a: {
          b: {
            c: reactor
          }
        }
      })

    store.dispatch({ type: 'd' })

    expect(reactor.process).toHaveBeenLastCalledWith(
      expect.any(Function),
      { type: 'd' },
      1
    )

  })

})
