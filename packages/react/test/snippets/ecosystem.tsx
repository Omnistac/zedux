import {
  createEcosystem,
  EcosystemProvider,
  injectAtomInstance,
  injectAtomValue,
  injectWhy,
  useAtomValue,
} from '@zedux/react'
import { storeAtom, injectStore } from '@zedux/stores'
import React from 'react'

const testEcosystem = createEcosystem({ id: 'test' })

const atom1 = storeAtom('atom1', () => {
  console.log('evaluating atom1')
  const store = injectStore('1', { subscribe: false })

  return store
})

const atom2 = storeAtom('atom2', () => {
  console.log('evaluating atom2')
  const atom1val = injectAtomValue(atom1)

  return atom1val + '2'
})

const atom3 = storeAtom('atom3', (id: string) => {
  console.log('evaluating atom3')
  const atom1val = injectAtomValue(atom1)
  const atom2val = injectAtomValue(atom2)

  return `${id} ${atom1val} ${atom2val}`
})

const atom4 = storeAtom('atom4', () => {
  console.log('evaluating atom4')
  const atom3val = injectAtomValue(atom3, ['1'])
  const atom1val = injectAtomValue(atom1)

  return `${atom3val} ${atom1val}`
})

const atom5 = storeAtom('atom5', () => {
  console.log('evaluating atom5')
  const atom2val = injectAtomValue(atom2)
  const atom4val = injectAtomValue(atom4)
  const atom1val = injectAtomValue(atom1)

  const reasons = injectWhy()
  console.log('why did atom5 evaluate?', reasons)

  return `${atom4val} ${atom2val} ${atom1val}`
})

const setterAtom = storeAtom('setter', () => {
  const setters = [
    injectAtomInstance(atom1).setState,
    injectAtomInstance(atom2).setState,
    injectAtomInstance(atom3, ['1']).setState,
    injectAtomInstance(atom4).setState,
    injectAtomInstance(atom5).setState,
  ]

  return () => setters[Math.floor(Math.random() * setters.length)]
})

function Child() {
  const atom5val = useAtomValue(atom5)
  const atom4val = useAtomValue(atom4)
  const atom3val = useAtomValue(atom3, ['1'])
  const atom2val = useAtomValue(atom2)
  const atom1val = useAtomValue(atom1)
  const getSetter = useAtomValue(setterAtom)

  console.log('rendering Child', {
    atom5val,
    atom4val,
    atom3val,
    atom2val,
    atom1val,
  })

  return (
    <>
      <div>{atom1val}</div>
      <div>{atom2val}</div>
      <div>{atom3val}</div>
      <div>{atom4val}</div>
      <div>{atom5val}</div>
      <button
        onClick={() => getSetter()(Math.floor(Math.random() * 20).toString())}
      >
        Change One
      </button>
      <button onClick={() => console.log(testEcosystem)}>log ecosystem</button>
      <button onClick={() => testEcosystem.reset()}>reset ecosystem</button>
      <button
        onClick={() =>
          console.log(testEcosystem.dehydrate({ transform: false }))
        }
      >
        inspect instance values
      </button>
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
