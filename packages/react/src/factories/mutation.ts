import { MutationAtom } from '../types'

export const query = <State, MutationParams extends any[]>(
  key: string,
  value: MutationAtom<State, MutationParams>['value']
) => {
  const newAtom: MutationAtom<State, MutationParams> = {}
}
