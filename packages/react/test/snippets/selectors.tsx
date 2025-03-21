import {
  AtomProvider,
  injectAtomSelector,
  injectEffect,
  useAtomContext,
  useAtomInstance,
  useAtomSelector,
  useAtomValue,
} from '@zedux/react'
import {
  storeApi,
  storeAtom,
  AtomInstanceType,
  injectStore,
  storeIon,
} from '@zedux/stores'
import React, { useState } from 'react'

const otherAtom = storeAtom('other', () => 'hello')
const paramAtom = storeAtom('param', (param: string) => {
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

const testAtom = storeIon(
  'test',
  ({ ecosystem, get, getInstance }) => {
    const val = injectAtomSelector(({ get }) => get(paramAtom, ['param']).param)

    console.log('rendering stable atom:', { ecosystem, val })
    const other = get(otherAtom)

    return storeApi(other + ' world!' + ' ' + val).setExports({
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

function UnstableChild() {
  const val = useAtomSelector(({ get }) => get(paramAtom, ['param']).counter)

  return (
    <div>
      <div>Unstable component value {val}</div>
    </div>
  )
}

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
      <UnstableChild />
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
