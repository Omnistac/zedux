import React from 'react'
import { createAtom, Scope } from '@src'

export default { title: '03 Local Atoms' }

/*
  Local atoms are drop-in replacements for React context
  Every time you `useLocalAtom()` or inject a local atom, a new atom instance is created
  Unless otherwise specified, local atoms live as long as their app (same as app atoms)

  The advantage of atoms over context is their subscription model
*/
const inputAtom = createAtom({
  factory: () => '',
  key: 'input',
  scope: Scope.local,
})

const Child = () => {
  const [input, setState] = inputAtom.useState()

  return (
    <>
      <div>The input: {input}</div>
      <div>
        <input onChange={event => setState(event.target.value)} value={input} />
      </div>
    </>
  )
}

export const Simple = () => {
  const inputInstance = inputAtom.useLocalAtom()

  return (
    <inputInstance.Provider>
      <Child />
    </inputInstance.Provider>
  )
}
