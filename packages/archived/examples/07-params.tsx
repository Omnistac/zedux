import React from 'react'
import { createAtom } from '@src'

export default { title: '07 Params' }

/*
  Atom factories can take parameters.
  Passing different parameters creates new instances of an atom.
*/
const helloAtom = createAtom({
  factory: (name: string) => `Hello, ${name}`,
  key: 'hello',
})

export const UniqueInstances = () => {
  const [helloJohn] = helloAtom.useState('John')
  const [helloAdam] = helloAtom.useState('Adam')

  return (
    <>
      <div>{helloJohn}</div>
      <div>{helloAdam}</div>
    </>
  )
}

/*
  When a parameterized atom is used, the passed params are deep-compared against the params for existing instances.
  If an atom has already been instantiated with those exact params, no new atom instance will be created.
*/
const advancedHelloAtom = createAtom({
  factory: (firstName: string, { lastName }: { lastName: string }) =>
    `Hello, ${firstName} ${lastName}`,
  key: 'advancedHello',
})

export const InstanceReuse = () => {
  const [state1, setState1] = advancedHelloAtom.useState('Frodo', {
    lastName: 'Baggins',
  })

  // Since these 2 usages passed the same params, they reference the exact same atom instance
  const [state2, setState2] = advancedHelloAtom.useState('Bilbo', {
    lastName: 'Baggins',
  })
  const [state3, setState3] = advancedHelloAtom.useState('Bilbo', {
    lastName: 'Baggins',
  })

  return (
    <>
      <div>{state1}</div>
      <div>
        <button onClick={() => setState1(currentState => currentState + '!')}>
          Exclaim
        </button>
      </div>
      <div>{state2}</div>
      <div>
        <button onClick={() => setState2(currentState => currentState + '!')}>
          Exclaim
        </button>
      </div>
      <div>{state3}</div>
      <div>
        <button onClick={() => setState3(currentState => currentState + '!')}>
          Exclaim
        </button>
      </div>
    </>
  )
}

/*
  Atom instances are reused across components.
*/
export const CrossComponent = () => {
  const [state, setState] = advancedHelloAtom.useState('Bilbo', {
    lastName: 'Baggins',
  })

  return (
    <>
      <div>{state}</div>
      <div>
        <button onClick={() => setState(currentState => currentState + '!')}>
          Exclaim
        </button>
      </div>
      <InstanceReuse />
    </>
  )
}
