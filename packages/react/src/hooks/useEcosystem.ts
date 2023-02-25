import { useContext } from 'react'
import { createEcosystem } from '../factories/createEcosystem'
import { getEcosystem } from '../store'
import { ecosystemContext } from '../utils/general'

export const useEcosystem = () => {
  const id = useContext(ecosystemContext)

  return getEcosystem(id) || createEcosystem({ id })
}
