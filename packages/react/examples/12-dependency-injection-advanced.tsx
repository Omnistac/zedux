import React from 'react'
import { timer } from 'rxjs'
import { createAtom } from '@src'

export default { title: '12 Dependency Injection - Advanced' }

/*
  `injectState` and `injectStore` try to resolve the injected atom synchronously.
  But when the injected atom is async, that isn't possible.
  In this situation, `inject*` throws a promise - just like React Suspense.
  Enhanced Factories are therefore interruptible.

  This allows the DI system to be fully synchronous when no async atoms are involved.
  The caveat is that you have to remember: No expensive operations should be done until all dependencies are injected.
*/
const zeroAtom = createAtom({
  factory: (delay: number) => timer(delay).toPromise(),
  key: '12-lazy',
})

const zerosAtom = createAtom({
  enhancedFactory: ({ injectState }) => () => {
    console.log('I log 3 times')
    const zero1 = injectState(zeroAtom, [1000])
    console.log('I log 2 times')

    // using the same params re-uses the atom instance
    const zero2 = injectState(zeroAtom, [1500])
    console.log('I log once')
    const zero3 = injectState(zeroAtom, [1500])
    console.log('I also log once')

    // All deps are injected! Expensive operations go here.

    return [zero1, zero2, zero3]
  },
  key: '12-zeros',
})

export const NotSimple = () => {
  const [state] = zerosAtom.useState()

  if (!state) return <div>... Sir Throbsalot ...</div>

  return (
    <>
      <div>Zeros:</div>
      <ul>
        {state.map((zero, index) => (
          <li key={index}>{zero}</li>
        ))}
      </ul>
    </>
  )
}
