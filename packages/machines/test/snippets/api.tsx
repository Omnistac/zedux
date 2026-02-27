import { useAtomSelector, useAtomValue } from '../../../react/src'
import { injectMachineSignal } from '@zedux/machines'
import { atom, api } from '@zedux/atoms'
import { storeApi, storeAtom, injectStore, storeIon } from '@zedux/stores'
import React, { Suspense, useState } from 'react'

const a = storeAtom('a', () => injectStore('a'))
const b = storeAtom('b', () => storeApi(injectStore('a')))
const c = atom('c', () =>
  injectMachineSignal(state => [state('a').on('next', 'b')])
)
const d = atom('d', () =>
  api(injectMachineSignal(state => [state('a').on('next', 'b')]))
)
const e = storeAtom('e', () =>
  storeApi(new Promise<string>(resolve => resolve('a')))
)
const f = storeIon('f', () => injectStore('a'))
const g = storeIon('g', () => storeApi(injectStore('a')))

function Child() {
  const [storeA, storeB, instanceC, instanceD, storeE, storeF, storeG] =
    useAtomSelector(
      ({ getInstance }) =>
        [
          getInstance(a).store,
          getInstance(b).store,
          getInstance(c),
          getInstance(d),
          getInstance(e).store,
          getInstance(f).store,
          getInstance(g).store,
        ] as const
    )

  storeA.getState().slice()
  storeB.getState().slice()
  instanceC.v.value
  instanceD.v.value
  storeE.getState().data
  storeF.getState().slice()
  storeG.getState().slice()

  return (
    <div>
      {useAtomValue(a)} {useAtomValue(b)} {useAtomValue(c).value}{' '}
      {useAtomValue(d).value} {useAtomValue(e).data} {useAtomValue(f)}{' '}
      {useAtomValue(g)}
    </div>
  )
}

function Greeting() {
  const [view, setView] = useState(true)

  return (
    <>
      {view ? (
        <div>the first view!</div>
      ) : (
        <Suspense fallback={<div>suspended...</div>}>
          <Child />
        </Suspense>
      )}
      <button onClick={() => setView(curr => !curr)}>change view</button>
    </>
  )
}
