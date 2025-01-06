import { injectAtomInstance, injectAtomValue, useAtomState } from '@zedux/react'
import { api, atom, createStore, injectStore } from '@zedux/stores'
import React from 'react'

const localStorageAtom = atom('localStorage', (key: string) => {
  const val = localStorage.getItem(key)

  // using the function overload of `injectStore` to prevent JSON.parse from running unnecesarily on reevaluations:
  const store = injectStore<any>(() =>
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
  const val = (storedName as any) || ''

  return api(val as string).setExports({
    call: (a: string) => 2,
    update,
  })
})

function Username() {
  const [state, { call, update }] = useAtomState(usernameAtom)

  call('a')

  return <input onChange={event => update(event.target.value)} value={state} />
}
