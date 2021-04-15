import { AtomBaseProperties, AtomInstanceBase } from '@zedux/react/types'
import { createAtomInstanceInternals } from '../createAtomInstanceInternals'

export const createExternalInstance = <
  State,
  Params extends any[],
  InstanceType extends AtomInstanceBase<State, Params>
>(
  appId: string,
  atom: AtomBaseProperties<State, Params, InstanceType>,
  keyHash: string,
  params: Params,
  destroy: () => void
) => {
  // TODO: allow plugins to provide instantiation logic
  const internals = createAtomInstanceInternals(
    appId,
    atom,
    keyHash,
    params,
    () => undefined,
    destroy
  )

  return { internals } as AtomInstanceBase<State, Params>
}
