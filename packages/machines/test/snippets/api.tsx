import { useAtomSelector, useAtomValue } from '../../../react/src'
import { injectMachineStore } from '@zedux/machines'
import { storeApi, storeAtom, injectStore, storeIon } from '@zedux/stores'
import React, { Suspense, useState } from 'react'

const a = storeAtom('a', () => injectStore('a'))
const b = storeAtom('b', () => storeApi(injectStore('a')))
const c = storeAtom('c', () =>
  injectMachineStore(state => [state('a').on('next', 'b')])
)
const d = storeAtom('d', () =>
  storeApi(injectMachineStore(state => [state('a').on('next', 'b')]))
)
const e = storeAtom('e', () =>
  storeApi(new Promise<string>(resolve => resolve('a')))
)
const f = storeIon('f', () => injectStore('a'))
const g = storeIon('g', () => storeApi(injectStore('a')))
const h = storeIon('h', () =>
  injectMachineStore(state => [state('a').on('next', 'b')])
)
const i = storeIon('i', () =>
  storeApi(injectMachineStore(state => [state('a').on('next', 'b')]))
)

function Child() {
  const [
    storeA,
    storeB,
    storeC,
    storeD,
    storeE,
    storeF,
    storeG,
    storeH,
    storeI,
  ] = useAtomSelector(
    ({ getInstance }) =>
      [
        getInstance(a).store,
        getInstance(b).store,
        getInstance(c).store,
        getInstance(d).store,
        getInstance(e).store,
        getInstance(f).store,
        getInstance(g).store,
        getInstance(h).store,
        getInstance(i).store,
      ] as const
  )

  storeA.getState().slice()
  storeB.getState().slice()
  storeC.is('a')
  storeD.is('a')
  storeE.getState().data
  storeF.getState().slice()
  storeG.getState().slice()
  storeH.is('a')
  storeI.is('a')

  return (
    <div>
      {useAtomValue(a)} {useAtomValue(b)} {useAtomValue(c).value}{' '}
      {useAtomValue(d).value} {useAtomValue(e).data} {useAtomValue(f)}{' '}
      {useAtomValue(g)} {useAtomValue(h).value} {useAtomValue(i).value}
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
