import React from 'react'
import { interval } from 'rxjs'
import { map, scan, take } from 'rxjs/operators'
import { createAtom } from '@src'

export default { title: '04 Observable Atoms' }

/*
  Atom factories can return an observable.
  The observable will be subscribed to when the atom is used.
  The observable will be unsubscribed to when the atom is no longer used anywhere.
  The latest emission from the observable will be set as the atom's state.
*/
const latestGreetingAtom = createAtom({
  factory: () =>
    interval(500).pipe(
      take(5),
      map(num => `Hello #${num}`)
    ),
  key: 'latestGreetings',
})

export const Simple = () => {
  const [latestGreeting] = latestGreetingAtom.useState()

  return <p>Latest Greeting: {latestGreeting}</p>
}

/*
  The `scan` operator can be used to accumulate state over time.
*/
const greetingsAtom = createAtom({
  factory: () =>
    interval(500).pipe(
      take(5),
      map(num => `Hello #${num}`),
      scan((greetings, greeting) => [...greetings, greeting], [] as string[])
    ),
  key: 'greetings',
})

export const Advanced = () => {
  const [greetings] = greetingsAtom.useState()

  console.log('greetings:', { greetings })

  return (
    <ul>
      {greetings?.map(greeting => (
        <li key={greeting}>{greeting}</li>
      ))}
    </ul>
  )
}
