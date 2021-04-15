import { ReadonlyLocalAtom } from '@zedux/react/types'
import { createStandardAtomInstanceWithDestruction } from './createStandardAtomInstance'

export const createLocalAtomInstance = <
  State,
  Params extends any[],
  Exports extends Record<string, any>
>(
  appId: string,
  atom: ReadonlyLocalAtom<State, Params, Exports>,
  keyHash: string,
  params: Params,
  destroy: () => void
) =>
  createStandardAtomInstanceWithDestruction<State, Params, Exports>(
    appId,
    atom,
    keyHash,
    params,
    destroy
  )
