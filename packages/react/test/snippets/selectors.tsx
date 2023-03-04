import {
  api,
  atom,
  AtomInstanceProvider,
  AtomInstanceType,
  injectAtomSelector,
  injectEffect,
  injectStore,
  useAtomConsumer,
  useAtomInstance,
  useAtomSelector,
  useAtomValue,
} from '@zedux/react'
import { ion } from '@zedux/react/factories/ion'
import React, { useState } from 'react'

const otherAtom = atom('other', () => 'hello')
const paramAtom = atom('param', (param: string) => {
  const store = injectStore({
    param: param.toUpperCase(),
    counter: 0,
  })

  injectEffect(() => {
    setInterval(() => {
      store.setState(state => ({ ...state, counter: state.counter + 1 }))
    }, 1000)
  }, [])

  return store
})

const testAtom = ion(
  'test',
  ({ ecosystem, get, getInstance }) => {
    const val = injectAtomSelector(({ get }) => get(paramAtom, ['param']).param)

    console.log('rendering stable atom:', { ecosystem, val })
    const other = get(otherAtom)

    return api(other + ' world!' + ' ' + val).setExports({
      update: (newVal: string) => getInstance(otherAtom).setState(newVal),
    })
  },
  { ttl: 0 }
)

const upperCaseAtom = ion(
  'upperCase',
  ({ get }, instance: AtomInstanceType<typeof testAtom>) =>
    get(instance).toUpperCase()
)

function UnstableChild() {
  const val = useAtomSelector(({ get }) => get(paramAtom, ['param']).counter)

  return (
    <div>
      <div>Unstable component value {val}</div>
    </div>
  )
}

function Child() {
  const testInstance = useAtomConsumer(testAtom, [])
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
      <UnstableChild />
    </div>
  )
}

function Greeting() {
  const [view, setView] = useState(true)
  const testInstance = useAtomInstance(testAtom)

  return (
    <AtomInstanceProvider instance={testInstance}>
      {view ? <div>the first view!</div> : <Child />}
      <button onClick={() => setView(curr => !curr)}>change view</button>
    </AtomInstanceProvider>
  )
}
