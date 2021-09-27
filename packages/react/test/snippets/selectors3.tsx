import { atom, useAtomSelector, useAtomState, AtomGetters } from '@zedux/react'
import React from 'react'

const atomA = atom('a', () => ({ num: 1 }))
const atomB = atom('b', () => ({ num: 2 }))

const selector = ({ get, getInstance }: AtomGetters) => {
  const result = (get(atomA).num + get(atomB).num) / 2
  console.log('running selector...', result)

  // this getInstance shouldn't ruin the above get's dynamicity
  getInstance(atomA)

  return Math.floor(result)
}

function Child() {
  const val = useAtomSelector(selector)
  console.log('child rendering...', val)

  return (
    <div>
      <div>val: {val}</div>
    </div>
  )
}

function Controls() {
  const [, setA] = useAtomState(atomA)

  return (
    <>
      <button onClick={() => setA(val => ({ num: val.num + 1 }))}>
        Increment
      </button>
    </>
  )
}

function Greeting() {
  return (
    <>
      <Child />
      <Controls />
    </>
  )
}
