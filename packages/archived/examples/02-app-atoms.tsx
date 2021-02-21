import React from 'react'
import { AppProvider, createAtom, Scope } from '@src'

export default { title: '02 App Atoms' }

/*
  App atoms live inside an <AppProvider />
  Unless otherwise specified, they live as long as their app.
  When an app isn't wrapped in <AppProvider />, app atoms use the global scope.
*/
const counterAtom = createAtom({
  factory: () => 0,
  key: 'counter',
  scope: Scope.app, // Scope.app is the default - can omit this line
})

/*
  We don't render an <AppProvider /> in this example. It's therefore using the global scope.
*/
export const GlobalAsDefault = () => {
  const [state, setState] = counterAtom.useState()

  return (
    <>
      <div>counter value: {state}</div>
      <div>
        <button onClick={() => setState(currentState => currentState + 1)}>
          increment
        </button>
        <button onClick={() => setState(currentState => currentState - 1)}>
          decrement
        </button>
      </div>
    </>
  )
}

export const ScopeSharing = () => (
  <>
    <AppProvider>
      <div>These 2 counters are scoped to the same app:</div>
      <GlobalAsDefault />
      <GlobalAsDefault />
    </AppProvider>
    <AppProvider>
      <div>And this one is alone in a different app:</div>
      <GlobalAsDefault />
    </AppProvider>
  </>
)
