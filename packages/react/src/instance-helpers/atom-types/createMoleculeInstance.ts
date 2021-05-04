import { AtomInstanceBase, Molecule } from '@zedux/react/types'
import { createAtomInstanceInternals } from '../createAtomInstanceInternals'

export const createMoleculeInstance = <
  State,
  Params extends any[],
  Exports extends Record<string, any>
>(
  ecosystemId: string,
  atom: Molecule<State, Exports>,
  keyHash: string,
  params: Params
) => {
  const evaluate = () => {
    return atom.value()
  }

  const internals = createAtomInstanceInternals(
    ecosystemId,
    atom,
    keyHash,
    params,
    evaluate
  )

  return { internals } as AtomInstanceBase<State, Params>
}
