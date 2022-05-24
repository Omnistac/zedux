import { Atom, AtomInstance } from '../types'
import { getFullKey } from '../utils'
import { instantiateAtom } from './instantiateAtom'
import { globalStore } from './store'

export const getAtomInstance = <T, A extends any[]>(
  appId: string,
  atom: Atom<T, A>,
  params: A
): AtomInstance<T> => {
  const globalState = globalStore.getState()
  const appPool = globalState.pools[appId]
  const overrideId = appPool.overrides?.[atom.key]
  const maybeOverriddenAtom = overrideId
    ? globalState.atoms[atom.key].implementations[overrideId]
    : atom

  if (appPool.isTestMode && maybeOverriddenAtom.isTestSafe === false) {
    console.error(
      `Zedux: encountered unsafe atom "${atom.key}". This atom should be overridden when testing`
    )
  }

  // every time a local atom is got, a new instance is created
  const fullKey = getFullKey(maybeOverriddenAtom, params)
  const atomInstanceId = appPool.instances[fullKey]

  if (atomInstanceId) {
    return globalState.atoms[maybeOverriddenAtom.key].instances[atomInstanceId]
  }

  const newAtomInstance = instantiateAtom(
    appId,
    maybeOverriddenAtom,
    fullKey,
    params
  )

  return newAtomInstance
}
