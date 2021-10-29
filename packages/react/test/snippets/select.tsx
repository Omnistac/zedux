import { atom, useAtomSelector, useAtomState, AtomGetters } from '@zedux/react'
import React from 'react'

const atomA = atom('a', () => ({ num: 1, otherNum: 11 }))
const atomB = atom('b', () => ({ num: 2, otherNum: 22 }))

const selector = ({ select }: AtomGetters) => {
  const result =
    (select(atomA, val => val.num) + select(({ get }) => get(atomB).otherNum)) /
    2
  console.log('running selector...', result)

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
      <button
        onClick={() =>
          setA(val => ({ num: val.num + 1, otherNum: val.otherNum }))
        }
      >
        Increment Num
      </button>
      <button
        onClick={() =>
          setA(val => ({ num: val.num, otherNum: val.otherNum + 1 }))
        }
      >
        Increment Other Num
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
