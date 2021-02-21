import React, { useState } from 'react'
import { timer } from 'rxjs'
import { createAtom, ReadyState } from '@src'

export default { title: '07 Ttl' }

/*
  An atom's longevity can be controlled with the `ttl` field.
  Ttl kicks off a timer when an atom's refcount reaches 0.
  When that timer ends, the atom will be deleted.
  If the atom's refcount leaves 0 during the timeout, the timeout will be cancelled.

  Set to 0 to immediately clean up the atom.
*/
const lazyHelloWorldAtom = createAtom({
  factory: async () => {
    await timer(1000).toPromise()

    return 'Oh haii'
  },
  key: 'lazyHelloWorld',
  ttl: 0,
})

const LazyChild = () => {
  const lazyHelloWorldApi = lazyHelloWorldAtom.useApi()

  if (lazyHelloWorldApi.readyState !== ReadyState.ready)
    return <div>... Throb much? ...</div>

  return <div>{lazyHelloWorldApi.state}</div>
}

export const TtlZero = () => {
  const [isRenderingChild, setIsRenderingChild] = useState(true)

  return (
    <>
      <div>
        <button onClick={() => setIsRenderingChild(state => !state)}>
          Toggle Child
        </button>
      </div>
      {isRenderingChild ? <LazyChild /> : null}
    </>
  )
}

/*
  This atom will keep its state around for 3 seconds after all components that use it are unmounted
*/
const lessLazyHelloWorldAtom = createAtom({
  factory: async () => {
    await timer(500).toPromise()

    return 'Oh hallo'
  },
  key: 'lazyHelloWorld',
  ttl: 3000,
})

const LessLazyChild = () => {
  const lessLazyHelloWorldApi = lessLazyHelloWorldAtom.useApi()

  if (lessLazyHelloWorldApi.readyState !== ReadyState.ready) {
    return <div>... Throb much? ...</div>
  }

  return <div>{lessLazyHelloWorldApi.state}</div>
}

export const TtlThreeSeconds = () => {
  const [isRenderingChild, setIsRenderingChild] = useState(true)

  return (
    <>
      <div>
        <button onClick={() => setIsRenderingChild(state => !state)}>
          Toggle Child
        </button>
      </div>
      {isRenderingChild ? <LessLazyChild /> : null}
    </>
  )
}
