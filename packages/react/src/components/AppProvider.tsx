import React, { createContext, FC, useEffect, useMemo, useRef } from 'react'
import { addApp, globalStore, removeApp } from '../store'
import { Atom } from '../types'
import { generateAppId } from '../utils'

// by default, if <AppProvider /> isn't rendered above an atom-using component, `app` atoms will actually be `global`
export const appContext = createContext('global')

export const AppProvider: FC<{
  atoms?: Atom[]
  flags?: string[]
  id?: string
}> = ({ atoms, children, flags, id }) => {
  const isFirstRenderRef = useRef(true)
  const appId = useMemo(() => {
    const val = id || generateAppId()

    // yep. Dispatch this here. We'll make sure no component can ever be updated sychronously from this call (causing state-update-during-render react warnings)
    globalStore.dispatch(addApp({ appId: val, atoms, flags }))

    return val
  }, [id])

  useEffect(() => {
    if (isFirstRenderRef.current) {
      isFirstRenderRef.current = false
    } else {
      globalStore.dispatch(addApp({ appId, atoms, flags }))
    }

    return () => {
      const { instances } = globalStore.getState().pools[appId]

      globalStore.dispatch(removeApp({ appId, instances }))
    }
  }, [appId, atoms, flags])

  return <appContext.Provider value={appId}>{children}</appContext.Provider>
}
