import React, { createContext, FC, useEffect, useMemo, useState } from 'react'
import { addApp, globalStore, removeApp } from './global/store'
import { Atom } from './types'
import { generateAppId } from './utils'

// by default, if <AppProvider /> isn't rendered above an atom-using component, `app` atoms will actually be `global`
export const appContext = createContext('global')

export const AppProvider: FC<{
  atoms?: Atom[]
  id?: string
  testMode?: boolean
}> = ({ atoms, children, id, testMode }) => {
  // This state approach means we will always delay rendering `children` for at least one render cycle.
  // I think this is fine. Time-wise it's short (depending on async atoms). Tests using @testing-library/react should work.
  // And it's concurrent-mode safe (the alternative is to read from refs during render and mutate global state during render sooo I think this approach is necessary)
  // Definitely Not SSR-Compatible Though!!!
  const [canProceed, setCanProceed] = useState(false)
  const appId = useMemo(() => id || generateAppId(), [id])

  useEffect(() => {
    globalStore.dispatch(addApp({ appId, atoms, testMode }))
    setCanProceed(true)

    return () => {
      const { instances } = globalStore.getState().pools[appId]

      globalStore.dispatch(removeApp({ appId, instances }))
    }
  }, [appId, atoms, testMode])

  if (!canProceed) return null

  return <appContext.Provider value={appId}>{children}</appContext.Provider>
}
