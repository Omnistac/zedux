import {
  atom,
  AtomProvider,
  createEcosystem,
  EcosystemProvider,
  injectAtomValue,
  injectEffect,
  injectStore,
  useAtomContext,
  useAtomInstance,
  useAtomValue,
} from '@zedux/react'
import React, { useState } from 'react'

const testEcosystem = createEcosystem({ id: 'test' })

const atom1 = atom('atom1', () => {
  console.log('evaluating atom1')
  const store = injectStore('1')

  return store
})

const atom2 = atom('atom2', () => {
  console.log('evaluating atom2')
  const atom1val = injectAtomValue(atom1)

  return atom1val + '2'
})

const atom3 = atom(
  'atom3',
  (id: string) => {
    console.log('evaluating atom3')
    const atom1val = injectAtomValue(atom1)
    const atom2val = injectAtomValue(atom2)

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
    const atom3val = injectAtomValue(atom3, ['1'])
    const atom1val = injectAtomValue(atom1)

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
  const atom3val = useAtomValue(useAtomContext(atom3, ['1']))
  const atom2val = useAtomValue(atom2)
  const atom1val = useAtomValue(useAtomContext(atom1, []))

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
  const atom3val = useAtomValue(useAtomContext(atom3, ['1']))

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
  const instance1 = useAtomInstance(atom1)
  const instance3 = useAtomInstance(atom3, ['1'])

  return (
    <AtomProvider instances={[instance1, instance3]}>
      <Child />
    </AtomProvider>
  )
}

function Greeting() {
  return (
    <EcosystemProvider ecosystem={testEcosystem}>
      <Parent />
    </EcosystemProvider>
  )
}
