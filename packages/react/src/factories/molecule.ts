import { Store } from '@zedux/core'

export const molecule = <T = any>(key: string, value: () => Store<T>) => {
  // TODO: Make instantiateAtom only create the bare minimum atom properties and
  // let various instantiators add the extra properties
}
