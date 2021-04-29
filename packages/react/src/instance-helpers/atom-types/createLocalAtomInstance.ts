import { ReadonlyLocalAtom } from '@zedux/react/types'
import { createStandardAtomInstanceWithDestruction } from './createStandardAtomInstance'

export const createLocalAtomInstance = <
  State,
  Params extends any[],
  Exports extends Record<string, any>
>(
  ecosystemId: string,
  atom: ReadonlyLocalAtom<State, Params, Exports>,
  keyHash: string,
  params: Params,
  destroy: () => void
) =>
  createStandardAtomInstanceWithDestruction<State, Params, Exports>(
    ecosystemId,
    atom,
    keyHash,
    params,
    destroy
  )
