import { AppProvider } from '@src'
import React from 'react'
import { createAtom } from '@src'

export default { title: '11 Dependency Injection - Composition' }

/*
  Atoms can be composed of other atoms.
  To inject, use `enhancedFactory` instead of `factory` (and `enhancedOverride` instead of `override`).
*/
const fetchAtom = createAtom({
  factory: () => ({ fetch }),
  key: '11-fetch',
})

/*
  The fetchUserAtom injects the current state of fetchAtom
  fetchUserAtom is therefore composed of fetchAtom
*/
const fetchUserAtom = createAtom({
  enhancedFactory: ({ injectState }) => async () => {
    const { fetch } = injectState(fetchAtom)
    const data = await fetch('https://api.github.com/users/octocat')

    return data.json() as Promise<{ avatar_url: string }>
  },
  key: '11-fetchUser',
})

export const Simple = () => {
  const [user] = fetchUserAtom.useState()

  if (!user) return <div>... Poor Man&apos;s Throbber ...</div>

  return (
    <div>
      <img src={user.avatar_url} />
    </div>
  )
}

const mockFetchAtom = fetchAtom.override(() => ({
  fetch: () =>
    (console.log('here??') as any) ||
    (({
      json: () => ({
        avatar_url: 'https://avatars3.githubusercontent.com/u/583231?v=4',
      }),
    } as unknown) as Promise<Response>),
}))

export const InjectedOverride = () => (
  <AppProvider atoms={[mockFetchAtom]}>
    <Simple />
  </AppProvider>
)
