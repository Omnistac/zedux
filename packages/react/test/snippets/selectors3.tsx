import {
  atom,
  AtomInstanceProvider,
  AtomInstanceType,
  injectAtomSelector,
  injectEffect,
  injectStore,
  useAtomConsumer,
  useAtomInstance,
  useAtomSelector,
  useAtomState,
  useAtomValue,
  GetterUtils,
} from '@zedux/react'
import { ion } from '@zedux/react/factories/ion'
import React, { useState } from 'react'

const atomA = atom('a', () => ({ num: 1 }))
const atomB = atom('b', () => ({ num: 2 }))

const selector = ({ get }: GetterUtils) => {
  return get(atomA).num + get(atomB).num
}

function Child() {
  const val = useAtomSelector(selector)

  return (
    <div>
      <div>val: {val}</div>
    </div>
  )
}

function Controls() {
  const [, setA] = useAtomState(atomA)

  return (
    <>
      <button onClick={() => setA({ num: 2 })}>Set to 2</button>
    </>
  )
}

function Greeting() {
  return (
    <>
      <Child />
      <Controls />
    </>
  )
}
