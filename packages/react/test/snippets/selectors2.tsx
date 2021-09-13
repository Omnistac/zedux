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
} from '@zedux/react'
import { ion } from '@zedux/react/factories/ion'
import React, { useState } from 'react'

const atomA = atom('a', () => ({ num: 1 } as { num: number | undefined }))

function Child() {
  const val = useAtomSelector(atomA, ({ num }) => num)

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
      <button onClick={() => setA({ num: undefined })}>Set Undefined</button>
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
