import { atom, injectWhy } from '@zedux/react'
import React, { useState } from 'react'

const greetingAtom = atom('greeting', 'Hello, world!')
const atom2 = atom('2', () => {
  return greetingAtom.injectValue()
})

const atom3 = atom('3', (id: string) => {
  const greeting = greetingAtom.injectValue()
  const atom2val = atom2.injectValue()

  console.log('atom3 evaluating..', { greeting, atom2val })
  injectWhy(reason => console.log('why??', reason))

  return greeting + ' ' + atom2val + ' id: ' + id
})

function GreetingPreview() {
  const [id, setId] = useState('1')
  const [greeting] = atom3.useState(id)
  const [greeting2] = atom2.useState()
  const toggle = () => setId(currentId => (currentId === '1' ? '2' : '1'))
  console.log('rendering..', greeting)

  return (
    <div>
      The greeting: {greeting} <button onClick={toggle}>toggle id</button>
    </div>
  )
}

function EditGreeting() {
  const [greeting, setGreeting] = greetingAtom.useState()

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
