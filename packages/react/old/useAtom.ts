import { useContext, useLayoutEffect, useState } from 'react'
import { appContext } from './AppProvider'
import { getAtomInstance } from './global/getAtomInstance'
import { Atom, AtomInstance, AtomMetadata } from './types'
import { getFullKey } from './utils'

// useAtom is a low-level hook that probably shouldn't be used directly
// use the hooks built into atoms - e.g. `myAtom.useState()`
export const useAtom: <T = any, A extends any[] = []>(
  atom: Atom<T, A>,
  params?: A
) => AtomInstance<T> | undefined = <T = any, A extends any[] = []>(
  atom: Atom<T>,
  params?: A
) => {
  const appId = useContext(appContext)
  const [atomInstance, setAtomInstance] = useState<AtomInstance<T>>()
  const [, setReactState] = useState<AtomMetadata<T>>()

  // TODO: Should this be memoized?
  const fullKey = getFullKey(atom, params)

  // NOTE: We don't want to re-run when params change - the array could change every time
  // Calculate the full key from the params and use that to determine when items in the params list change.
  useLayoutEffect(() => {
    const subscriber = (metadata: AtomMetadata<T>) => setReactState(metadata)
    const targetAtomInstance = getAtomInstance(appId, atom, params || [])
    const unsubscribe = targetAtomInstance.addSubscriber(subscriber)

    setAtomInstance(targetAtomInstance)

    return unsubscribe
  }, [appId, atom, fullKey, setReactState]) // see above note

  return atomInstance
}

/*
problems we're solving:

1. global stream cache with customizable ttl per stream

2. render waterfalls with per-component stream subscriptions

3. local, isolated component state (like context) that can be used by other isolated components

4. dependency injection(?)

the problem with context is re-renders. Need to use a subscription model - where the context's actual value never changes. Child components register subscriptions and are notified directly of changes.

Atomic libraries (recoil, jotai (not quite zustand), pullState) hide the top-down model of React from you



createAtom can create 3 types of atoms:

- global

const testTradingAccountsAtom = createAtom({
  key: 'tradingAccounts',
  factory: () => testData()
})

<RootProvider atoms={[testTradingAccountsAtom]}>
  
</RootProvider>

const tradingAccountsAtom = createAtom({
  key: 'tradingAccounts',
  factory: () => getStreamDataAndStreamStuff(),
  scope: 'global',
  ttl: subject,
})

useAtom(tradingAccountsAtom)

dies with the javascript runtime by default
create with `createAtom({ ... scope: 'global' })`
`ttl: number` destroys the atom instance `number` milliseconds after its refcount hits 0
`ttl: Observable` destroys the atom instance when `Observable` has emitted and refcount is 0

- app

dies with the app-level <RootProvider /> component by default
create with `createAtom({ ... scope: 'app' })`
`ttl: number` destroys the atom instance `number` milliseconds after its refcount hits 0
`ttl: Observable` destroys the atom instance when `Observable` has emitted and refcount is 0

- local

dies with the `<LocalProvider atom={atom}>` component by default
create with `createAtom({ ... scope: 'local' })`
`ttl: number` destroys the atom instance `number` milliseconds after its refcount hits 0
`ttl: Observable` destroys the atom instance when `Observable` has emitted and refcount is 0

atom instantiation is deferred until the atom is actually `useAtom`d in a component.



could circumvent render waterfalls:

const SomeChild = () => {
  return useSuspense([() => useAtom(anotherAsyncAtom)], (
    ...
  ))
}

const SomeParent = () => {
  return useSuspense([useSomePromiseThrowingHook, () => useAtom(someStreamAtom)], (
    <div>
      <SomeChild />
    </div>
  ))
}

const App = () => {
  return (
    <Suspense fallback={<Throbber />}>
      <SomeParent />
    </Suspense>
  )
}

`useSomePromiseThrowingHook`, `useAtom(someStreamAtom)`, and `useAtom(anotherAsyncAtom)` will all be called in parallel - their promises will be caught and after all promises have started, the first one will be thrown off the top to the parent <Suspense /> component



maybe add a `useFactory` overload of `createAtom` that allows you to use hooks in the factory (e.g. to create atom dependencies)












Suspense has problems - it completely remounts suspended components

useFactory probably won't work - as a hook, it would be tied to the lifecycle of the first component to use that atom



const localInstance = useAtom(someLocalAtom)

return (
  <LocalProvider atom={localInstance}>
    
  </LocalProvider>
)


*/
