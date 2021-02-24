import React, { createContext, FC, useEffect, useMemo, useRef } from 'react'
import { addApp, globalStore, removeApp, updateApp } from '../store'
import { Atom, AtomContext, AtomContextInstance } from '../types'
import { generateAppId } from '../utils'
import { appCsContext } from '../utils/csContexts'

// by default, if <AppProvider /> isn't rendered above an atom-using component, `app` atoms will actually be `global`
export const appContext = createContext('global')

const mapAtomContexts = (atomContexts?: AtomContextInstance[]) =>
  atomContexts?.reduce((map, atomContext) => {
    map.set(atomContext.atomContext, atomContext)
    return map
  }, new Map<AtomContext, AtomContextInstance>())

const usePreservedReference = (arr: any[]) => {
  const prevArr = useRef(arr)

  return useMemo(() => {
    if (arr === prevArr.current) return prevArr.current

    if (
      arr.length !== prevArr.current.length ||
      arr.some((el, i) => prevArr.current[i] !== el)
    ) {
      prevArr.current = arr
      return arr
    }

    return prevArr.current
  }, [arr])
}

/**
 * AppProvider
 *
 * Creates an atom ecosystem. The behavior of atoms inside this AppProvider can
 * be altered with props passed here.
 */
export const AppProvider: FC<{
  atoms?: Atom[]
  contexts?: AtomContextInstance[]
  flags?: string[]
  id?: string
  preload?: () => unknown
}> = ({ atoms, children, contexts, flags, id, preload }) => {
  const isFirstRenderRef = useRef(true)

  if (atoms && !Array.isArray(atoms)) {
    throw new TypeError(
      "Zedux Error - The AppProvider's `atoms` prop must be an array of Atom objects"
    )
  }
  if (contexts && !Array.isArray(contexts)) {
    throw new TypeError(
      "Zedux Error - The AppProvider's `contexts` prop must be an array of AtomContext objects"
    )
  }
  if (flags && !Array.isArray(flags)) {
    throw new TypeError(
      "Zedux Error - The AppProvider's `flags` prop must be an array of strings"
    )
  }

  const preservedAtoms = usePreservedReference(atoms)
  const preservedContexts = usePreservedReference(contexts)
  const preservedFlags = usePreservedReference(flags)

  const appId = useMemo(() => {
    const val = id || generateAppId()

    // yep. Dispatch this here. We'll make sure no component can ever be updated sychronously from this call (causing state-update-during-render react warnings)
    globalStore.dispatch(
      addApp({
        appId: val,
        atoms: preservedAtoms,
        atomContexts: mapAtomContexts(preservedContexts),
        flags: preservedFlags,
      })
    )

    return val
  }, [id])

  useEffect(() => {
    if (isFirstRenderRef.current) return

    globalStore.dispatch(
      updateApp({
        appId,
        atoms: preservedAtoms,
        atomContexts: mapAtomContexts(preservedContexts),
        flags: preservedFlags,
      })
    )
  }, [preservedAtoms, preservedContexts, preservedFlags]) // don't run this on appId change

  useEffect(() => {
    if (!isFirstRenderRef.current) {
      globalStore.dispatch(
        addApp({
          appId,
          atoms: preservedAtoms,
          atomContexts: mapAtomContexts(preservedContexts),
          flags: preservedFlags,
        })
      )
    }

    return () => {
      const pool = globalStore.getState().pools[appId]
      if (!pool) return

      // TODO: iterate over the instances in an effect and destroy them all
      globalStore.dispatch(removeApp({ appId, instances: pool.instances }))
    }
  }, [appId])

  useEffect(() => {
    // I think it's fine to assume this effect runs after the others in this file. Easy to change approaches if not.
    isFirstRenderRef.current = false
  }, [])

  useEffect(() => {
    if (!preload) return

    appCsContext.provide({ appId }, preload)
  }, [appId]) // only capture the preload variable when appId changes; don't rerun on preload ref change.

  return <appContext.Provider value={appId}>{children}</appContext.Provider>
}
