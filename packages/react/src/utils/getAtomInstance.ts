import { AtomBaseProperties, AtomInstance, Scope } from '../types'
import { instantiateAtom } from './instantiateAtom'
import { globalStore } from '../store'

export const getAtomInstance = <
  State,
  Params extends any[],
  Methods extends Record<string, () => any>
>(
  appId: string,
  atom: AtomBaseProperties<State, Params>,
  keyHash: string,
  params: Params
): AtomInstance<State, Params, Methods> => {
  const globalState = globalStore.getState()
  let appPool = globalState.pools[appId]
  const overrideId = appPool.overrides?.[atom.key]
  const maybeOverriddenAtom = (overrideId
    ? globalState.atoms[atom.key].implementations[overrideId]
    : atom) as AtomBaseProperties<State, Params>

  // to turn off flag checking, just don't pass the `flags` prop to `<AppProvider />`
  if (appPool.flags) {
    const badFlag = maybeOverriddenAtom.flags.find(
      flag => !appPool.flags.includes(flag)
    )

    if (badFlag) {
      console.error(
        `Zedux - encountered unsafe atom "${atom.key}" with flag "${badFlag}. This atom should be overridden in the current environment.`
      )
    }
  }

  // use the global pool if this is a non-overridden global atom
  if (!overrideId && atom.scope === Scope.Global) {
    appPool = globalState.pools.global
  }

  const atomInstanceId = appPool.instances[keyHash]

  if (atomInstanceId) {
    return globalState.atoms[maybeOverriddenAtom.key].instances[
      atomInstanceId
    ] as AtomInstance<State, Params, Methods>
  }

  // Sooooo for some reason ...... React can't catch errors thrown from the `instantiateAtom.ts` file.
  // So catch them here and throw a different error (must be a different error) so ErrorBoundaries work.
  // Yeah. Wut.
  try {
    const newAtomInstance = instantiateAtom<State, Params, Methods>(
      appId,
      maybeOverriddenAtom,
      keyHash,
      params
    )
    return newAtomInstance
  } catch (err) {
    console.error(
      `Zedux caught error while initializing atom "${atom.key}":`,
      err
    )
    throw new Error(`Zedux Error - failed to instantiate atom "${atom.key}"`)
  }
}
