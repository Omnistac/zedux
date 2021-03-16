import { Store } from '@zedux/core'
import { injectState } from '../injectors'
import { Molecule } from '../types2'

export const molecule = <T = any, Exports extends Record<string, any> = Record<string, any>>(key: string, value: () => Store<T>) => {
  // TODO: Make instantiateAtom only create the bare minimum atom properties and
  // let various instantiators add the extra properties
  const molecule: Molecule<T, Exports> = {
    injectExports,
    injectInvalidate,
    injectSelector
    injectState,
    injectStore,
    internalId,
    key,
    useExports,
    useInvalidate,
    useSelector,
    useState,
    useStore,
    value
  }

  return molecule
}
