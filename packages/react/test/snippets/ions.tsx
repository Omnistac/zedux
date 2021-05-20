import { atom, AtomInstanceType } from '@zedux/react'
import { ion } from '@zedux/react/factories/ion'
import React, { useState } from 'react'

const otherAtom = atom('other', () => 'hello')

const testAtom = ion(
  'test',
  ({ ecosystem, get }) => {
    console.log('the ecosystem:', ecosystem)
    const other = get(otherAtom)

    return other + ' world!'
  },
  ({ set }, newVal) => {
    set(otherAtom, newVal)
  },
  { ttl: 0 }
)

const upperCaseAtom = ion(
  'upperCase',
  ({ get }, instance: AtomInstanceType<typeof testAtom>) =>
    get(instance).toUpperCase()
)

function Child() {
  const testInstance = testAtom.useConsumer()
  const upperCase = upperCaseAtom.useValue(testInstance)

  return (
    <div>
      <div>test: {upperCase}</div>
      <button
        onClick={() => {
          testInstance.setState('yooooo')
        }}
      >
        click me!
      </button>
    </div>
  )
}

function Greeting() {
  const [view, setView] = useState(true)
  const testInstance = testAtom.useInstance()

  return (
    <testInstance.Provider>
      {view ? <div>the first view!</div> : <Child />}
      <button onClick={() => setView(curr => !curr)}>change view</button>
    </testInstance.Provider>
  )
}
