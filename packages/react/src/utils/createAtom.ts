import {
  AppAtomConfig,
  AtomBaseProperties,
  AtomConfig,
  GlobalAtomConfig,
  LocalAtomConfig,
  ReadonlyAppAtomConfig,
  ReadonlyGlobalAtomConfig,
  ReadonlyLocalAtomConfig,
  Scope,
} from '../types'
import { useAtomWithSubscription } from '../hooks/useAtomWithSubscription'
import { injectAtomWithSubscription } from '../injectors/injectAtomWithSubscription'

const attachStateHooks = <State = any, Params extends any[] = []>(
  newAtom: any
) => {
  newAtom.injectState = (...params: Params) => {
    const atomInstance = injectAtomWithSubscription<State, Params>(
      'injectState()',
      newAtom,
      params
    )

    return [
      atomInstance.stateStore.getState(),
      atomInstance.stateStore.setState,
    ]
  }

  newAtom.useState = (...params: Params) => {
    const atomInstance = useAtomWithSubscription(newAtom, params)

    return [
      atomInstance.stateStore.getState(),
      atomInstance.stateStore.setState,
    ]
  }
}

const createReadonlyAppAtom = <State = any, Params extends any[] = []>(
  newAtom: AtomBaseProperties<State, Params>,
  options: ReadonlyAppAtomConfig<State, Params>
) => {
  newAtom.ttl = options.ttl
}

const createAppAtom = <State = any, Params extends any[] = []>(
  newAtom: AtomBaseProperties<State, Params>,
  options: AppAtomConfig<State, Params>
) => {
  newAtom.ttl = options.ttl
  attachStateHooks<State, Params>(newAtom)
}

const createReadonlyGlobalAtom = <State = any, Params extends any[] = []>(
  newAtom: AtomBaseProperties<State, Params>,
  options: ReadonlyGlobalAtomConfig<State, Params>
) => {
  newAtom.ttl = options.ttl
}

const createGlobalAtom = <State = any, Params extends any[] = []>(
  newAtom: AtomBaseProperties<State, Params>,
  options: GlobalAtomConfig<State, Params>
) => {
  newAtom.ttl = options.ttl
  attachStateHooks<State, Params>(newAtom)
}

const createReadonlyLocalAtom = <State = any, Params extends any[] = []>(
  newAtom: AtomBaseProperties<State, Params>,
  options: ReadonlyLocalAtomConfig<State, Params>
) => {}

const createLocalAtom = <State = any, Params extends any[] = []>(
  newAtom: AtomBaseProperties<State, Params>,
  options: LocalAtomConfig<State, Params>
) => {
  attachStateHooks<State, Params>(newAtom)
}

export const createAtom = <State = any, Params extends any[] = []>(
  atomBase: AtomBaseProperties<State>,
  options: AtomConfig<State, Params>
) => {
  switch (atomBase.scope) {
    case Scope.App:
      return atomBase.readonly
        ? createReadonlyAppAtom(
            atomBase,
            options as ReadonlyAppAtomConfig<State, Params>
          )
        : createAppAtom(atomBase, options as AppAtomConfig<State, Params>)
    case Scope.Global:
      return atomBase.readonly
        ? createReadonlyGlobalAtom(
            atomBase,
            options as ReadonlyGlobalAtomConfig<State, Params>
          )
        : createGlobalAtom(atomBase, options as GlobalAtomConfig<State, Params>)
    case Scope.Local:
      return atomBase.readonly
        ? createReadonlyLocalAtom(
            atomBase,
            options as ReadonlyLocalAtomConfig<State, Params>
          )
        : createLocalAtom(atomBase, options as LocalAtomConfig<State, Params>)
  }
}
