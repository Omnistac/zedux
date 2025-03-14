import {
  AtomProvider,
  useAtomContext,
  useAtomInstance,
  useAtomValue,
} from '@zedux/react'
import { storeApi, storeAtom, AtomInstanceType, storeIon } from '@zedux/stores'
import React, { useState } from 'react'

const otherAtom = storeAtom('other', () => 'hello')

const testAtom = storeIon(
  'test',
  ({ ecosystem, get, getInstance }) => {
    console.log('the ecosystem:', ecosystem)
    const other = get(otherAtom)

    return storeApi(other + ' world!').setExports({
      update: (newVal: string) => getInstance(otherAtom).setState(newVal),
    })
  },
  { ttl: 0 }
)

const upperCaseAtom = storeIon(
  'upperCase',
  ({ get }, instance: AtomInstanceType<typeof testAtom>) =>
    get(instance).toUpperCase()
)

function Child() {
  const testInstance = useAtomContext(testAtom, [])
  const { update } = testInstance.exports
  const upperCase = useAtomValue(upperCaseAtom, [testInstance])

  return (
    <div>
      <div>test: {upperCase}</div>
      <button
        onClick={() => {
          update('yooooo')
        }}
      >
        click me!
      </button>
    </div>
  )
}

function Greeting() {
  const [view, setView] = useState(true)
  const testInstance = useAtomInstance(testAtom)

  return (
    <AtomProvider instance={testInstance}>
      {view ? <div>the first view!</div> : <Child />}
      <button onClick={() => setView(curr => !curr)}>change view</button>
    </AtomProvider>
  )
}
