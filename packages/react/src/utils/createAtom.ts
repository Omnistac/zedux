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
import { injectAtomWithoutSubscription } from '../injectors'
import { useAtomWithoutSubscription } from '../hooks'

const attachStateHooks = <
  State = any,
  Params extends any[] = [],
  Methods extends Record<string, () => any> = Record<string, () => any>
>(
  newAtom: any
) => {
  newAtom.injectDispatch = (...params: Params) => {
    const atomInstance = injectAtomWithoutSubscription<State, Params, Methods>(
      newAtom,
      params
    )

    return atomInstance.stateStore.dispatch
  }

  newAtom.injectState = (...params: Params) => {
    const atomInstance = injectAtomWithSubscription<State, Params, Methods>(
      'injectState()',
      newAtom,
      params
    )

    return [
      atomInstance.stateStore.getState(),
      atomInstance.stateStore.setState,
    ]
  }

  newAtom.injectStore = (...params: Params) => {
    const atomInstance = injectAtomWithoutSubscription<State, Params, Methods>(
      newAtom,
      params
    )

    return atomInstance.stateStore
  }

  newAtom.useDispatch = (...params: Params) => {
    const atomInstance = useAtomWithoutSubscription<State, Params, Methods>(
      newAtom,
      params
    )

    return atomInstance.stateStore.dispatch
  }

  newAtom.useState = (...params: Params) => {
    const atomInstance = useAtomWithSubscription<State, Params, Methods>(
      newAtom,
      params
    )

    return [
      atomInstance.stateStore.getState(),
      atomInstance.stateStore.setState,
    ]
  }

  newAtom.useStore = (...params: Params) => {
    const atomInstance = useAtomWithoutSubscription<State, Params, Methods>(
      newAtom,
      params
    )

    return atomInstance.stateStore
  }
}

const createReadonlyAppAtom = <
  State = any,
  Params extends any[] = [],
  Methods extends Record<string, () => any> = Record<string, () => any>
>(
  newAtom: AtomBaseProperties<State, Params, Methods>,
  options: ReadonlyAppAtomConfig<State, Params>
) => {
  newAtom.ttl = options.ttl
}

const createAppAtom = <
  State = any,
  Params extends any[] = [],
  Methods extends Record<string, () => any> = Record<string, () => any>
>(
  newAtom: AtomBaseProperties<State, Params, Methods>,
  options: AppAtomConfig<State, Params>
) => {
  newAtom.ttl = options.ttl
  attachStateHooks<State, Params>(newAtom)
}

const createReadonlyGlobalAtom = <
  State = any,
  Params extends any[] = [],
  Methods extends Record<string, () => any> = Record<string, () => any>
>(
  newAtom: AtomBaseProperties<State, Params, Methods>,
  options: ReadonlyGlobalAtomConfig<State, Params>
) => {
  newAtom.ttl = options.ttl
}

const createGlobalAtom = <
  State = any,
  Params extends any[] = [],
  Methods extends Record<string, () => any> = Record<string, () => any>
>(
  newAtom: AtomBaseProperties<State, Params, Methods>,
  options: GlobalAtomConfig<State, Params>
) => {
  newAtom.ttl = options.ttl
  attachStateHooks<State, Params>(newAtom)
}

const createReadonlyLocalAtom = <
  State = any,
  Params extends any[] = [],
  Methods extends Record<string, () => any> = Record<string, () => any>
>(
  newAtom: AtomBaseProperties<State, Params, Methods>,
  options: ReadonlyLocalAtomConfig<State, Params>
) => {}

const createLocalAtom = <
  State = any,
  Params extends any[] = [],
  Methods extends Record<string, () => any> = Record<string, () => any>
>(
  newAtom: AtomBaseProperties<State, Params, Methods>,
  options: LocalAtomConfig<State, Params>
) => {
  attachStateHooks<State, Params>(newAtom)
}

export const createAtom = <
  State = any,
  Params extends any[] = [],
  Methods extends Record<string, () => any> = Record<string, () => any>
>(
  atomBase: AtomBaseProperties<State, Params, Methods>,
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
