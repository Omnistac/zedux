import { createStore, react } from '../../src/index'


describe('BranchReactor', () => {

  test('delegates the appropriate state slice to child reducers', () => {

    const reducer = jest.fn(() => 1)
    const store = createStore({
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

    const store = createStore({
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


  test('processor layer skips reactors without a "process" property', () => {

    const processor = jest.fn()
    const reactor1 = () => {}
    const reactor2 = react()
      .to('a')
      .withProcessors(processor)

    const store = createStore({
      b: reactor1,
      c: reactor2
    })

    store.dispatch({ type: 'a' })

    expect(processor).toHaveBeenCalled()
  })

})
