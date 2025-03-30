import { useAtomState, useAtomValue } from '@zedux/react'
import { injectStorePromise, storeAtom } from '@zedux/stores'
import React, { Suspense } from 'react'
import { renderInEcosystem } from '../utils/renderInEcosystem'
import { expectTypeOf } from 'expect-type'

describe('injectStorePromise', () => {
  test('dataOnly types are correct', async () => {
    const suspendingAtom = storeAtom('suspending', () => {
      return injectStorePromise(() => Promise.resolve(1), [], {
        dataOnly: true,
      })
    })

    function Child() {
      const value = useAtomValue(suspendingAtom)
      const valueNoSuspense = useAtomValue(suspendingAtom, [], {
        suspend: false,
      })
      const [state] = useAtomState(suspendingAtom)
      const [stateNoSuspense] = useAtomState(suspendingAtom, [], {
        suspend: false,
      })

      expectTypeOf(value).toEqualTypeOf<number>()
      expectTypeOf(valueNoSuspense).toEqualTypeOf<number | undefined>()
      expectTypeOf(state).toEqualTypeOf<number>()
      expectTypeOf(stateNoSuspense).toEqualTypeOf<number | undefined>()

      return (
        <div data-testid="value">
          {value} {valueNoSuspense} {state} {stateNoSuspense}
        </div>
      )
    }

    function Parent() {
      return (
        <Suspense fallback={<div>Loading...</div>}>
          <Child />
        </Suspense>
      )
    }

    const { findByTestId } = renderInEcosystem(<Parent />)
    const div = await findByTestId('value')

    expect(div).toHaveTextContent('1 1 1 1')
  })
})
