import { atom, ecosystem, injectStore, injectWhy } from '@zedux/react'
import React from 'react'

const testEcosystem = ecosystem({ id: 'test' })

const atom1 = atom('atom1', () => {
  console.log('evaluating atom1')
  const store = injectStore('1', true)

  return store
})

const atom2 = atom('atom2', () => {
  console.log('evaluating atom2')
  const atom1val = atom1.injectValue()

  return atom1val + '2'
})

const atom3 = atom('atom3', (id: string) => {
  console.log('evaluating atom3')
  const atom1val = atom1.injectValue()
  const atom2val = atom2.injectValue()

  return `${id} ${atom1val} ${atom2val}`
})

const atom4 = atom('atom4', () => {
  console.log('evaluating atom4')
  const atom3val = atom3.injectValue('1')
  const atom1val = atom1.injectValue()

  return `${atom3val} ${atom1val}`
})

const atom5 = atom('atom5', () => {
  console.log('evaluating atom5')
  const atom2val = atom2.injectValue()
  const atom4val = atom4.injectValue()
  const atom1val = atom1.injectValue()

  injectWhy(reasons => console.log('why did atom5 evaluate?', reasons))

  return `${atom4val} ${atom2val} ${atom1val}`
})

const setterAtom = atom('setter', () => {
  const setters = [
    atom1.injectSetState(),
    atom2.injectSetState(),
    atom3.injectSetState('1'),
    atom4.injectSetState(),
    atom5.injectSetState(),
  ]

  return () => setters[Math.floor(Math.random() * setters.length)]
})

function Child() {
  const atom5val = atom5.useValue()
  const atom4val = atom4.useValue()
  const atom3val = atom3.useValue('1')
  const atom2val = atom2.useValue()
  const atom1val = atom1.useValue()
  const getSetter = setterAtom.useValue()

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
      <button onClick={() => testEcosystem.wipe()}>wipe ecosystem</button>
    </>
  )
}

function Greeting() {
  return (
    <testEcosystem.Provider>
      <Child />
    </testEcosystem.Provider>
  )
}
