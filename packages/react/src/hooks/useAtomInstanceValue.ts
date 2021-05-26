import { useEffect, useState } from 'react'
import { AtomInstanceBase } from '../classes'
import { AtomInstanceStateType } from '../types'
import { GraphEdgeSignal } from '../utils'

export const useAtomInstanceValue = <
  AI extends AtomInstanceBase<any, any, any>
>(
  instance: AI
) => {
  const [state, setState] = useState<AtomInstanceStateType<AI>>(
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

        setState(val)
      },
      'useAtomInstanceValue',
      false
    )

    return unregister
  }, [instance])

  return state
}
