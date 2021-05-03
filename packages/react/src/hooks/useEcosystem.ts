import { useContext } from 'react'
import { ecosystemContext } from '../classes'
import { getEcosystem } from '../store/public-api'

export const useEcosystem = () => getEcosystem(useContext(ecosystemContext))
