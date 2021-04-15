import { QueryAtom } from '../types'

export const query = <State, Params extends any[]>(
  key: string,
  value: QueryAtom<State, Params>['value']
) => {
  const newAtom: QueryAtom<State, Params> = {}
}
