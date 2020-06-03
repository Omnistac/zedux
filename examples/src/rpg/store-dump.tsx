import React, { useContext } from 'react'
import { useZeduxState } from '../hooks/useZeduxState'
import { RootContext } from './root-store'

export const StoreDump = () => {
  const { rootStore } = useContext(RootContext)
  const rootState = useZeduxState(rootStore)

  return (
    <section>
      <h2>Root store state:</h2>
      <pre>{JSON.stringify(rootState, null, 2)}</pre>
    </section>
  )
}
