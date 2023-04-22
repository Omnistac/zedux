import {
  api,
  atom,
  injectMachineStore,
  injectStore,
  ion,
  useAtomSelector,
  useAtomValue,
} from '@zedux/react'
import React, { Suspense, useState } from 'react'

const a = atom('a', () => injectStore('a'))
const b = atom('b', () => api(injectStore('a')))
const c = atom('c', () =>
  injectMachineStore(state => [state('a').on('next', 'b')])
)
const d = atom('d', () =>
  api(injectMachineStore(state => [state('a').on('next', 'b')]))
)
const e = atom('e', () => api(new Promise<string>(resolve => resolve('a'))))
const f = ion('f', () => injectStore('a'))
const g = ion('g', () => api(injectStore('a')))
const h = ion('h', () =>
  injectMachineStore(state => [state('a').on('next', 'b')])
)
const i = ion('i', () =>
  api(injectMachineStore(state => [state('a').on('next', 'b')]))
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
