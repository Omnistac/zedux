import { Ecosystem } from '../classes/Ecosystem'
import { EcosystemConfig } from '../types'

export const ecosystem = (config: EcosystemConfig) => new Ecosystem(config)

/*
Global ecosystem:

import { GlobalEcosystem } from '@zedux/react'

GlobalEcosystem.loadAtom(myAtom)













const injectMultiple = <State, Params extends any[]>(atom: Atom<State, Params, any>, paramsArrays: Params[][]) => {
  const load = atom.injectLazy()
  const subscriptionsRef = injectRef([])
  const [states, setStates
  
  injectEffect(() => {
    
  }, [])

  return states
}
*/
