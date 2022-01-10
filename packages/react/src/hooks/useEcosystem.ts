import { useContext } from 'react'
import { createEcosystem } from '../factories/createEcosystem'
import { ecosystemContext } from '../classes/Ecosystem'
import { getEcosystem } from '../store/public-api'

export const useEcosystem = () => {
  const ecosystemId = useContext(ecosystemContext)
  return getEcosystem(ecosystemId) || createEcosystem({ id: ecosystemId })
}
