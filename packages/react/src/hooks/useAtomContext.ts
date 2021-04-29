import { useContext, useMemo } from 'react'
import { ecosystemContext } from '../classes/Ecosystem'
import { AtomContext } from '../types'
import { getAtomContextInstance } from '../utils/getAtomContextInstance'

export const useAtomContext = <T = any>(context: AtomContext<T>) => {
  const ecosystemId = useContext(ecosystemContext)

  const atomContext = useMemo(
    () => getAtomContextInstance(ecosystemId, context),
    [context]
  )

  return atomContext
}
