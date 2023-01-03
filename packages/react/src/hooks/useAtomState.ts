import { AtomInstance, StandardAtomBase } from '../classes'
import {
  AtomExportsType,
  AtomInstanceExportsType,
  AtomInstanceStateType,
  AtomParamsType,
  AtomStateType,
  StateHookTuple,
  ZeduxHookConfig,
} from '../types'
import { useAtomInstanceDynamic } from './useAtomInstanceDynamic'

export const useAtomState: {
  <A extends StandardAtomBase<any, [], any, any>>(atom: A): StateHookTuple<
    AtomStateType<A>,
    AtomExportsType<A>
  >

  <A extends StandardAtomBase<any, [...any], any, any>>(
    atom: A,
    params: AtomParamsType<A>,
    config?: ZeduxHookConfig
  ): StateHookTuple<AtomStateType<A>, AtomExportsType<A>>

  <AI extends AtomInstance<any, [...any], any, any>>(
    instance: AI,
    params?: [],
    config?: ZeduxHookConfig
  ): StateHookTuple<AtomInstanceStateType<AI>, AtomInstanceExportsType<AI>>
} = <A extends StandardAtomBase<any, [...any], any, any>>(
  atom: A,
  params?: AtomParamsType<A>,
  config: ZeduxHookConfig = { operation: 'useAtomState' }
): StateHookTuple<AtomStateType<A>, AtomExportsType<A>> => {
  const [state, instance] = useAtomInstanceDynamic(
    atom,
    params as AtomParamsType<A>,
    config
  )

  const setState: any = (settable: any, meta?: any) =>
    instance.setState(settable, meta)

  Object.assign(setState, instance.exports)

  return [state, setState]
}
