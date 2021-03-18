import { Store } from '@zedux/core'
import { injectState } from '../injectors'
import { Molecule } from '../types'

export const molecule = <
  T = any,
  Exports extends Record<string, any> = Record<string, any>
>(
  key: string,
  value: Molecule<T, Exports>['value']
) => {
  // TODO: Make instantiateAtom only create the bare minimum atom properties and
  // let various instantiators add the extra properties

  return molecule
}
