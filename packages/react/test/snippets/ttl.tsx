import {
  createEcosystem,
  EcosystemProvider,
  injectAtomGetters,
  injectAtomValue,
  injectEffect,
  injectSelf,
  useAtomValue,
} from '@zedux/react'
import { storeAtom, injectStore } from '@zedux/stores'
import React, { useState } from 'react'

const testEcosystem = createEcosystem({ id: 'test' })

const atom1 = storeAtom('atom1', () => {
  console.log('evaluating atom1')
  const store = injectStore('1')

  return store
})

const atom2 = storeAtom('atom2', () => {
  console.log('evaluating atom2')
  const atom1val = injectAtomValue(atom1)

  return atom1val + '2'
})

const atom3 = storeAtom(
  'atom3',
  (id: string) => {
    console.log('evaluating atom3')
    const atom1val = injectAtomValue(atom1)
    const atom2val = injectAtomValue(atom2)

    injectEffect(
      () => () => {
        console.log('cleaning up atom3!', { id })
      },
      []
    )

    return `${id} ${atom1val} ${atom2val}`
  },
  { ttl: 0 }
)

const atom4 = storeAtom(
  'atom4',
  () => {
    const roll = Math.random() > 0.5
    console.log('evaluating atom4', { roll })
    const { get } = injectAtomGetters()
    const self = injectSelf()
    const atom3val = get(atom3, ['1'])
    const otherVal = roll ? get(atom1) : get(atom2)

    injectEffect(() => {
      console.log('setting interval for atom4!')
      const intervalId = setInterval(() => {
        self.invalidate()
      }, 5000)

      return () => {
        clearInterval(intervalId)
        console.log('cleaning up atom4!')
      }
    }, [])

    return `${atom3val} ${otherVal}`
  },
  { ttl: 2000 }
)

function One() {
  const atom3val = useAtomValue(atom3, ['1'])
  const atom2val = useAtomValue(atom2)
  const atom1val = useAtomValue(atom1)

  return (
    <>
      <div>{atom1val}</div>
      <div>{atom2val}</div>
      <div>{atom3val}</div>
    </>
  )
}

function Two() {
  const atom4val = useAtomValue(atom4)
  const atom3val = useAtomValue(atom3, ['1'])

  return (
    <>
      <div>{atom3val}</div>
      <div>{atom4val}</div>
    </>
  )
}

function Child() {
  const [view, setView] = useState(false)

  return (
    <>
      {view ? <One /> : <Two />}
      <button onClick={() => setView(curr => !curr)}>Change Children</button>
      <button onClick={() => console.log(testEcosystem)}>log ecosystem</button>
      <button onClick={() => testEcosystem.reset()}>reset ecosystem</button>
    </>
  )
}

function Greeting() {
  return (
    <EcosystemProvider ecosystem={testEcosystem}>
      <Child />
    </EcosystemProvider>
  )
}
