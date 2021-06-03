import {
  api,
  atom,
  injectMemo,
  useAtomInstance,
  useAtomValue,
} from '@zedux/react'
import React, { Suspense } from 'react'

const suspendingAtom = atom('suspending', (param?: string) => {
  const promise = injectMemo(() => {
    return new Promise(resolve => {
      setTimeout(() => {
        resolve('whatever')
      }, 3000)
    })
  }, [])

  return api("I am the value you're looking for").setPromise(promise)
})

function Grandchild() {
  const instance = useAtomInstance(suspendingAtom, ['param'])

  return <div>The Second Value! {instance.store.getState()}</div>
}

function Child() {
  const value = useAtomValue(suspendingAtom)

  return (
    <>
      <div>The Value! {value}</div>
      <Suspense fallback={<div>Falling Back Again!</div>}>
        <Grandchild />
      </Suspense>
    </>
  )
}

function Greeting() {
  return (
    <Suspense fallback={<div>Falling Back!</div>}>
      <Child />
    </Suspense>
  )
}
