import { useContext } from 'react'
import { ecosystem } from '..'
import { ecosystemContext } from '../classes'
import { getEcosystem } from '../store/public-api'

export const useEcosystem = () => {
  const ecosystemId = useContext(ecosystemContext)
  return getEcosystem(ecosystemId) || ecosystem({ id: ecosystemId })
}
