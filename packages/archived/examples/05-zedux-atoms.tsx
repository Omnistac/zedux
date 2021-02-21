import React from 'react'
import { createAtom } from '@src'
import { createActor, createReducer, createStore } from '@zedux/core'

export default { title: '05 Zedux Atoms' }

/*
  Atom factories can return a Zedux store.

  This can be used to take advantage of Zedux' more powerful state management and debugging utilities.

  By default, Zedux Atomic creates a store every time an atom is instantiated.
  When returning a store manually from a factory, Zedux Atomic uses that store rather than creating a new one.
*/
const greeterAtom = createAtom({
  factory: () => {
    const store = createStore<string>().hydrate('Hello!')

    store.subscribe((newState, oldState) => {
      console.log('greeterAtom state has changed', { newState, oldState })
    })

    return store
  },
  key: '05-greeter',
})

export const ForDebuggability = () => {
  const [state, setState] = greeterAtom.useState()

  return (
    <>
      <div>{state}</div>
      <div>
        <button onClick={() => setState('Goodbye!')}>Change state</button>
      </div>
    </>
  )
}

/*
  Sometimes a reducer-driven approach is the right approach.
  Zedux stores configured with reducers can be used for atoms with bigger state demands.
*/
const addGreeting = createActor<string>('addGreeting')
const greetingsReducer = createReducer<string[]>([]).reduce(
  addGreeting,
  (state, greeting) => [...state, greeting]
)

const greetingsAtom = createAtom({
  factory: () => createStore(greetingsReducer),
  key: '05-greetings',
})

export const ReducerDriven = () => {
  // First time we've seen `useApi()`. This is a lower-level hook than `useState()`.
  // Here we're using it to get access to the atom's `dispatch` function
  const atomApi = greetingsAtom.useApi()

  return (
    <>
      <div>
        <button onClick={() => atomApi.dispatch?.(addGreeting('Hello!'))}>
          Be Friendly
        </button>
      </div>
      <ul>
        {atomApi.state?.map((greeting, index) => (
          <li key={index}>{greeting}</li>
        ))}
      </ul>
    </>
  )
}
