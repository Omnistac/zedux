import React from 'react'
import { createAtom, Scope } from '@src'

export default { title: '01 Global Atoms' }

/*
  Global atoms live completely outside of React.
  Unless otherwise specified, they live as long as the JS runtime.
*/
const helloWorldAtom = createAtom({
  factory: () => 'Hello, World!',
  key: 'helloWorld',
  scope: Scope.global,
})

export const Simple = () => {
  const [state, setState] = helloWorldAtom.useState()
  console.log('stuff:', { state, setState, helloWorldAtom })

  return (
    <>
      <div>{state}</div>
      <div>
        <button onClick={() => setState('Goodbye :(')}>Update State</button>
      </div>
    </>
  )
}

export const Advanced = () => (
  <>
    <Simple />
    <Simple />
  </>
)
