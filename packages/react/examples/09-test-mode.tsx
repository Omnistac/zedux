import React from 'react'
import { AppProvider, createAtom } from '@src'

export default { title: '09 Test Mode' }

/*
  Atoms that need to be overridden for testing can be given an `isTestSafe: false` flag
  When an AppProvider turns on `testMode`, any unsafe atoms encountered will log an error.

  (We'll look at how to override an atom next)
*/
const badAtom = createAtom({
  factory: async () => {
    const data = await fetch('https://api.github.com/users/octocat')
    return data.json() as Promise<{ avatar_url: string }>
  },
  isTestSafe: false,
  key: '09-bad',
})

const Child = () => {
  const [state] = badAtom.useState()

  // Checking for atom readiness by seeing if state is defined is probably fine
  if (!state) {
    return <div>... Throbber We Don&apos;t Want To See In Tests ...</div>
  }

  return (
    <div>
      <img src={state.avatar_url} />
    </div>
  )
}

export const Simple = () => (
  <AppProvider testMode>
    <Child />
  </AppProvider>
)
