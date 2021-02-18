import React from 'react'
import { interval, timer } from 'rxjs'
import { map, scan, take } from 'rxjs/operators'
import { createAtom, ReadyState } from '@src'

export default { title: '06 Async Atoms' }

/*
  Atom factories can return promises.

  An internal `readyState` state machine will track the progress of the promise.
  The resolved value of the promise will be set as the atom's state.
*/
const fetchAvatarAtom = createAtom({
  factory: async () => {
    const data = await fetch('https://api.github.com/users/octocat')
    return data.json() as Promise<{ avatar_url: string }>
  },
  key: 'fetchAvatar',
})

export const OneOffRequest = () => {
  // Here we're using `useApi()` to get access to the `readyState` state machine.
  const fetchAvatarApi = fetchAvatarAtom.useApi()

  if (fetchAvatarApi.readyState !== ReadyState.ready) {
    return <div>... Poor Man&apos;s Throbber ...</div>
  }

  return (
    <>
      <div>fetched!</div>
      <div>
        <img src={fetchAvatarApi.state?.avatar_url} />
      </div>
    </>
  )
}

/*
  A snapshot-then-stream example.
  The resolved value of the promise can be an observable or Zedux store.
  If it's an observable, the latest emission will be used as the atom's state (as in the 04-observable-atoms example).
  If it's a store, it will be used as the atom's store (as in the 05-zedux-atoms example).
*/
const snapshot$ = timer(1000).pipe(map(() => ['Hello #1', 'Hello #2']))

const update$ = interval(500).pipe(
  take(3),
  map(num => `Hello #${num + 3}`)
)

const snapshotThenStreamGreetingsAtom = createAtom({
  factory: async () => {
    const snapshotValues = await snapshot$.toPromise()

    return update$.pipe(
      scan((greetings, greeting) => [...greetings, greeting], snapshotValues)
    )
  },
  key: 'snapshotThenStreamGreetings',
})

export const SnapshotThenStream = () => {
  const snapshotThenStreamGreetingsApi = snapshotThenStreamGreetingsAtom.useApi()

  if (snapshotThenStreamGreetingsApi.readyState !== ReadyState.ready) {
    return <div>... Poor Man&apos;s Throbber ...</div>
  }

  return (
    <>
      <div>snapshot complete!</div>
      <ul>
        {snapshotThenStreamGreetingsApi.state?.map(greeting => (
          <li key={greeting}>{greeting}</li>
        ))}
      </ul>
    </>
  )
}

/*
  We've now covered the full return type of `factory`:

  T | Observable<T> | Store<T> | Promise<T> | Promise<Observable<T>> | Promise<Store<T>>
*/
