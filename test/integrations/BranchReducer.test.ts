import { createStore } from '@src/index'
import { createMockReducer } from '@test/utils'

describe('BranchReducer', () => {
  test('delegates the appropriate state slice to child reducers', () => {
    const reducer = createMockReducer(1)
    const store = createStore({
      a: {
        b: {
          c: reducer,
        },
      },
    })

    store.dispatch({ type: 'd' })

    expect(reducer).toHaveBeenLastCalledWith(1, { type: 'd' })
  })
})
