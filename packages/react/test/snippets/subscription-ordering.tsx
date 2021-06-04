import { atom, injectAtomValue, injectWhy, useAtomState } from '@zedux/react'
import React, { useState } from 'react'

const greetingAtom = atom('greeting', 'Hello, world!')
const atom2 = atom('2', () => {
  return injectAtomValue(greetingAtom)
})

const atom3 = atom('3', (id: string) => {
  const greeting = injectAtomValue(greetingAtom)
  const atom2val = injectAtomValue(atom2)

  console.log('atom3 evaluating..', { greeting, atom2val })
  const reasons = injectWhy()
  console.log('why??', reasons)

  return greeting + ' ' + atom2val + ' id: ' + id
})

function GreetingPreview() {
  const [id, setId] = useState('1')
  const [greeting] = useAtomState(atom3, [id])
  const [greeting2] = useAtomState(atom2)
  const toggle = () => setId(currentId => (currentId === '1' ? '2' : '1'))
  console.log('rendering..', greeting)

  return (
    <div>
      The greeting: {greeting} <button onClick={toggle}>toggle id</button>
    </div>
  )
}

function EditGreeting() {
  const [greeting, setGreeting] = useAtomState(greetingAtom)

  return (
    <input
      onChange={({ target }) => setGreeting(target.value)}
      value={greeting}
    />
  )
}

const Greeting = () => (
  <>
    <GreetingPreview />
    <EditGreeting />
  </>
)
