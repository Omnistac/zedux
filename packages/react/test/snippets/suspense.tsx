import {
  api,
  atom,
  injectAtomValue,
  injectMemo,
  useAtomInstance,
  useAtomValue,
} from '@zedux/react'
import React, { Suspense } from 'react'

const wait = (time: number) =>
  new Promise(resolve => setTimeout(() => resolve('whatever'), time))

const suspendingAtom = atom('suspending', (param?: string) => {
  const promise = injectMemo(() => wait(2500), [])

  return api("I am the value you're looking for").setPromise(promise)
})

const forwardingAtom = atom(
  'forwarding',
  (param?: string) => {
    return injectAtomValue(suspendingAtom, [param])
  },
  { forwardPromises: true }
)

function Grandchild() {
  const instance = useAtomInstance(forwardingAtom, ['param'])

  return <div>The Second Value! {instance.store.getState()}</div>
}

function Child() {
  const value = useAtomValue(forwardingAtom, [])

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
