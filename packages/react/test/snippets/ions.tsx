import { atom } from '@zedux/react'
import { ion } from '@zedux/react/factories/ion'
import React, { useState } from 'react'

const otherAtom = atom('other', () => 'hello')

const testAtom = ion(
  'test',
  ({ get }) => {
    const other = get(otherAtom)
    const setOther = otherAtom.injectSetState()

    return other + ' world!'
  },
  ({ set }, newVal) => {
    set(otherAtom, newVal)
    console.log('setting!', newVal)
  },
  { ttl: 0 }
)

function Child() {
  const [test, setTest] = testAtom.useState()

  return (
    <div>
      <div>test: {test}</div>
      <button
        onClick={() => {
          setTest('yooooo')
        }}
      >
        click me!
      </button>
    </div>
  )
}

function Greeting() {
  const [view, setView] = useState(true)

  return (
    <>
      {view ? <div>the first view!</div> : <Child />}
      <button onClick={() => setView(curr => !curr)}>change view</button>
    </>
  )
}
