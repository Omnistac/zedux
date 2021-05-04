import { useContext, useMemo } from 'react'
import { ecosystemContext } from '../classes/Ecosystem'
import { getEcosystem } from '../store/public-api'
import { AtomContext } from '../types'

export const useAtomContext = <T = any>(context: AtomContext<T>) => {
  const ecosystemId = useContext(ecosystemContext)
  const ecosystem = getEcosystem(ecosystemId)

  const atomContext = useMemo(() => ecosystem.getAtomContextInstance(context), [
    context,
    ecosystem,
  ])

  return atomContext
}
