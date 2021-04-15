import { AtomBaseProperties, AtomInstanceBase } from '../types'
import { createAtomInstance } from './createAtomInstance'
import { globalStore } from '../store'

export const getExistingInstance = (keyHash: string) => {
  const globalState = globalStore.getState()

  return globalState.instances[keyHash]
}

export const resolveAtom = <AtomType extends AtomBaseProperties<any, any[]>>(
  appId: string,
  atom: AtomType
) => {
  const globalState = globalStore.getState()
  const ecosystem = globalState.ecosystems[appId]
  const override = ecosystem.overrides?.[atom.key]
  const maybeOverriddenAtom = (override || atom) as AtomType

  // to turn off flag checking, just don't pass the `flags` prop to `<AppProvider />`
  if (ecosystem.flags) {
    const badFlag = maybeOverriddenAtom.flags?.find(
      flag => !ecosystem.flags?.includes(flag)
    )

    if (badFlag) {
      console.error(
        `Zedux - encountered unsafe atom "${atom.key}" with flag "${badFlag}. This atom should be overridden in the current environment.`
      )
    }
  }

  return maybeOverriddenAtom
}

export const getAtomInstance = <
  State,
  Params extends any[],
  InstanceType extends AtomInstanceBase<State, Params>
>(
  appId: string,
  atom: AtomBaseProperties<State, Params, InstanceType>,
  keyHash: string,
  params: Params
): InstanceType => {
  // try to find an existing instance
  const existingInstance = getExistingInstance(keyHash)
  if (existingInstance) return existingInstance as InstanceType

  // create a new instance
  const resolvedAtom = resolveAtom(appId, atom)

  return createAtomInstance(
    appId,
    resolvedAtom,
    keyHash,
    params
  ) as InstanceType
}
