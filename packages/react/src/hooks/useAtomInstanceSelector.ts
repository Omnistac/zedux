import { useEffect, useRef, useState } from 'react'
import { AtomInstanceBase } from '../classes'
import { AtomInstanceStateType } from '../types'
import { GraphEdgeSignal } from '../utils'

export const useAtomInstanceSelector = <
  AI extends AtomInstanceBase<any, any, any>,
  D extends any = any
>(
  instance: AI,
  selector: (state: AtomInstanceStateType<AI>) => D
) => {
  const [state, setState] = useState(() =>
    selector(instance._stateStore.getState())
  )
  const [, forceRender] = useState<any>()
  const selectorRef = useRef(selector)
  selectorRef.current = selector

  useEffect(() => {
    const unregister = instance.ecosystem._graph.registerExternalDependent(
      instance,
      (signal, val: AtomInstanceStateType<AI>) => {
        if (signal === GraphEdgeSignal.Destroyed) {
          forceRender({})
          return
        }

        setState(selectorRef.current(val))
      },
      'useAtomInstanceSelector',
      false
    )

    return unregister
  }, [])

  return state
}
