import {
  api,
  atom,
  createStore,
  injectPromise,
  injectStore,
  useAtomValue,
} from '@zedux/react'
import React, { Suspense } from 'react'

const asyncAtom = atom('async', () => {
  const promiseApi = injectPromise(async () => {
    const val = await new Promise<string>((resolve, reject) => {
      setTimeout(() => {
        Math.random() > 0.5 ? resolve('the value!') : reject('the error!')
      }, 2000)
    })

    return val
  }) // no params to re-run every time

  const store = injectStore(
    () =>
      createStore({
        myReducer: () => 2,
        asyncStuff: promiseApi.store,
      }),
    { shouldSubscribe: false }
  )

  return api(store).setPromise(promiseApi.promise as Promise<any>)
})

function Child() {
  console.log('running child...')
  const {
    asyncStuff: { data, error, isError, isLoading, isSuccess },
  } = useAtomValue(asyncAtom)

  return (
    <div>
      {isLoading ? (
        <span>Loading...</span>
      ) : isError ? (
        <span>Error! {error?.message}</span>
      ) : isSuccess ? (
        <span>Success! {data}</span>
      ) : (
        <span>?</span>
      )}
    </div>
  )
}

function Greeting() {
  return (
    <Suspense fallback={<div>Falling Back!</div>}>
      <Child />
    </Suspense>
  )
}
