import {
  api,
  atom,
  createStore,
  injectAtomInstance,
  injectAtomValue,
  injectStore,
  useAtomState,
} from '@zedux/react'
import React from 'react'

const localStorageAtom = atom('localStorage', (key: string) => {
  const val = localStorage.getItem(key)

  // using the function overload of `injectStore` to prevent JSON.parse from running unnecesarily on reevaluations:
  const store = injectStore(() =>
    createStore(null, val ? JSON.parse(val) : undefined)
  )

  const update = (newVal: any) => {
    store.setState(newVal)
    localStorage.setItem(key, JSON.stringify(newVal))
  }

  return api(store).setExports({ update })
})

const usernameAtom = atom('username', () => {
  const storageInstance = injectAtomInstance(localStorageAtom, ['username'])
  const { update } = storageInstance.exports
  const storedName = injectAtomValue(storageInstance)

  return api(storedName || '').setExports({ call: (a: string) => 2, update })
})

function Username() {
  const [state, { call, update }] = useAtomState(usernameAtom)

  call('a')

  return <input onChange={event => update(event.target.value)} value={state} />
}
