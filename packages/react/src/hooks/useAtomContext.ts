import { useContext, useMemo } from 'react'
import { appContext } from '../components'
import { AtomContext } from '../types'
import { getAtomContextInstance } from '../utils/getAtomContextInstance'

export const useAtomContext = <T = any>(context: AtomContext<T>) => {
  const appId = useContext(appContext)

  const atomContext = useMemo(() => getAtomContextInstance(appId, context), [
    context,
  ])

  return atomContext
}
