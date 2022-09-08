import {
  api,
  atom,
  injectAtomInstance,
  injectAtomValue,
  injectMemo,
  injectPromise,
  useAtomInstance,
  useAtomValue,
} from '@zedux/react'
import React, { Suspense } from 'react'

const wait = (time: number) =>
  new Promise<string>(resolve => setTimeout(() => resolve('whatever'), time))

const suspendingAtom = atom('suspending', (param?: string) => {
  const promiseApi = injectPromise(
    async () => {
      const val = await wait(2500)
      return val
    },
    [],
    { dataOnly: true }
  )

  return api("I am the value you're looking for").setPromise(promiseApi.promise)
})

const forwardingAtom = atom('forwarding', (param?: string) => {
  const instance = injectAtomInstance(suspendingAtom, [param])
  const val = injectAtomValue(instance)

  return api(val).setPromise(instance.promise)
})

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
