import React from 'react'
import { AppProvider, createAtom } from '@src'

export default { title: '10 Dependency Injection - Overrides' }

/*
  Atoms can be overridden. This is a form of Dependency Injection.

  This DI pattern helps promote code isolation and modularization.
  This is particularly useful in feature-based or micro-frontend architectures.
  And testing, of course.
*/
const badAtom = createAtom({
  factory: async () => {
    const data = await fetch('https://api.github.com/users/octocat')
    return data.json() as Promise<{ avatar_url: string }>
  },
  isTestSafe: false,
  key: '10-bad',
})

const Child = () => {
  const [state] = badAtom.useState() // this uses goodAtom instead

  // Checking for atom readiness by seeing if state is defined can be fine
  if (!state) {
    return <div>... Throbber We Don&apos;t Want To See In Tests ...</div>
  }

  return (
    <div>
      <img src={state.avatar_url} />
    </div>
  )
}

/*
  An override "clone" of an atom is made with `atom.override()`.
  The override inherits all types and properties of the overridden atom.
  The override only needs to specify a new factory.
*/
const goodAtom = badAtom.override(() => {
  console.log('good')
  return { avatar_url: 'https://avatars3.githubusercontent.com/u/583231?v=4' }
})

/*
  The final piece:
  Override atoms are registered with `<AppProvider atoms={[...overrides]} />`.
  Atoms thus passed to AppProvider will be injected everywhere the overridden atom is used inside that app.
*/
export const Simple = () => (
  <AppProvider atoms={[goodAtom]} testMode>
    <Child />
  </AppProvider>
)
