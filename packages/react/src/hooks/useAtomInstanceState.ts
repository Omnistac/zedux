import { Settable } from '@zedux/core'
import { useEffect, useState } from 'react'
import { AtomInstance, AtomInstanceBase } from '../classes'
import { AtomInstanceStateType } from '../types'
import { GraphEdgeSignal } from '../utils'

export const useAtomInstanceState = <
  AI extends AtomInstanceBase<any, any, any>
>(
  instance: AI
): [
  AtomInstanceStateType<AI>,
  (settable: Settable<AtomInstanceStateType<AI>>) => AtomInstanceStateType<AI>
] => {
  const [state, setReactState] = useState<AtomInstanceStateType<AI>>(
    instance._stateStore.getState()
  )
  const [, forceRender] = useState<any>()

  useEffect(() => {
    const unregister = instance.ecosystem._graph.registerExternalDependent(
      instance,
      (signal, val: AtomInstanceStateType<AI>) => {
        if (signal === GraphEdgeSignal.Destroyed) {
          forceRender({})
          return
        }

        setReactState(val)
      },
      'useAtomInstanceState',
      false
    )

    return unregister
  }, [])

  const setState =
    instance instanceof AtomInstance
      ? instance.setState
      : instance._stateStore.setState

  return [state, setState]
}
