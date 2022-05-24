import {
  atom,
  useAtomState,
  AtomGetters,
  ion,
  useAtomValue,
  useAtomInstance,
} from '@zedux/react'
import React from 'react'

const atomA = atom('a', () => ({ num: 1, otherNum: 11 }))
const atomB = atom('b', () => ({ num: 2, otherNum: 22 }))

const selector = ({ select }: AtomGetters, tag: string) => {
  const result =
    (select(({ get }) => get(atomA).num) +
      select(({ get }) => get(atomB).otherNum)) /
    2
  console.log('running selector...', tag, result)

  return Math.floor(result)
}

const selectorWrapper = ({ select }: AtomGetters, tag: string) =>
  select(({ select }) => select(({ select }) => select(selector, tag)))

const ion1 = ion('1', ({ select }) =>
  select(
    {
      resultsComparator: (newResult, oldResult) => newResult - 5 < oldResult,
      selector: selectorWrapper,
    },
    Math.round(Math.random()) ? 'a' : 'b'
  )
)

function Child() {
  const val = useAtomValue(ion1)
  console.log('child rendering...', val)

  return (
    <div>
      <div>val: {val}</div>
    </div>
  )
}

function Controls() {
  const { invalidate } = useAtomInstance(ion1)
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
      <button onClick={() => invalidate()}>Invalidate Ion</button>
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
