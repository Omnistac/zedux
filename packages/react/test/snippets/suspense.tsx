import {
  api,
  atom,
  injectAtomInstance,
  injectAtomValue,
  injectPromise,
  useAtomInstance,
  useAtomValue,
} from '@zedux/react'
import React, { Suspense } from 'react'

const wait = (time: number) =>
  new Promise<string>(resolve => setTimeout(() => resolve('whatever'), time))

const suspendingAtom = atom('suspending', (param?: string) => {
  const { dataSignal, promise } = injectPromise(async () => {
    const val = await wait(2500)
    return val
  }, [])

  return api("I am the value you're looking for").setPromise(promise)
})

const forwardingAtom = atom('forwarding', (param?: string) => {
  const instance = injectAtomInstance(suspendingAtom, [param])
  const val = injectAtomValue(instance)

  return api(val).setPromise(instance.promise)
})

function Grandchild() {
  const instance = useAtomInstance(forwardingAtom, ['param'])

  return <div>The Second Value! {instance.get()}</div>
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
