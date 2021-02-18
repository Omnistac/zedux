import { useEffect, useState } from 'react'
import { Molecule } from './types'

export const useMolecule = (molecule: Molecule) => {
  const [state, setState] = useState(molecule.store.getState())

  useEffect(() => {
    const { unsubscribe } = molecule.store.subscribe(val => {
      console.log('molecule value!', val)
      setState(val)
    })

    return unsubscribe
  })

  return state
}
