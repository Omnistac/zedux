import { AtomInstanceBase, Molecule } from '@zedux/react/types'
import { createAtomInstanceInternals } from '../createAtomInstanceInternals'

export const createMoleculeInstance = <
  State,
  Params extends any[],
  Exports extends Record<string, any>
>(
  appId: string,
  atom: Molecule<State, Exports>,
  keyHash: string,
  params: Params,
  destroy: () => void
) => {
  const evaluate = () => {
    return atom.value()
  }

  const internals = createAtomInstanceInternals(
    appId,
    atom,
    keyHash,
    params,
    evaluate,
    destroy
  )

  return { internals } as AtomInstanceBase<State, Params>
}
