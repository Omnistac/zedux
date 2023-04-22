import { createEcosystem, getEcosystem } from '@zedux/atoms'
import { useContext } from 'react'
import { ecosystemContext } from '../utils'

export const useEcosystem = () => {
  const id = useContext(ecosystemContext)

  return getEcosystem(id) || createEcosystem({ id })
}
