import { useContext } from 'react'
import { createEcosystem } from '../factories/createEcosystem'
import { ecosystemContext } from '../classes/Ecosystem'
import { getEcosystem } from '../store'

export const useEcosystem = () => {
  const id = useContext(ecosystemContext)

  return getEcosystem(id) || createEcosystem({ id })
}
