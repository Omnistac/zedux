import {
  atom,
  ecosystem,
  EcosystemProvider,
  injectEffect,
  injectStore,
} from '@zedux/react'
import React, { useState } from 'react'

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

const atom3 = atom(
  'atom3',
  (id: string) => {
    console.log('evaluating atom3')
    const atom1val = atom1.injectValue()
    const atom2val = atom2.injectValue()

    injectEffect(
      () => () => {
        console.log('cleaning up atom3 :(', { id })
      },
      []
    )

    return `${id} ${atom1val} ${atom2val}`
  },
  { ttl: 0 }
)

const atom4 = atom(
  'atom4',
  () => {
    console.log('evaluating atom4')
    const atom3val = atom3.injectValue('1')
    const atom1val = atom1.injectValue()

    injectEffect(
      () => () => {
        console.log('cleaning up atom4!')
      },
      []
    )

    return `${atom3val} ${atom1val}`
  },
  { ttl: 2000 }
)

function One() {
  const atom3val = atom3.useConsumer().useValue()
  const atom2val = atom2.useValue()
  const atom1val = atom1.useConsumer().useValue()

  return (
    <>
      <div>{atom1val}</div>
      <div>{atom2val}</div>
      <div>{atom3val}</div>
    </>
  )
}

function Two() {
  const atom4val = atom4.useValue()
  const atom3val = atom3.useConsumer().useValue()

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
      <button onClick={() => testEcosystem.wipe()}>wipe ecosystem</button>
    </>
  )
}

function Parent() {
  const instance1 = atom1.useInstance()
  const instance3 = atom3.useInstance('1')

  return (
    <instance1.Provider>
      <instance3.Provider>
        <Child />
      </instance3.Provider>
    </instance1.Provider>
  )
}

function Greeting() {
  return (
    <EcosystemProvider ecosystem={testEcosystem}>
      <Parent />
    </EcosystemProvider>
  )
}
