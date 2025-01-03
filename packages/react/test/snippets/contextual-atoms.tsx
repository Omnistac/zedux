import {
  atom,
  api,
  ion,
  AtomGetters,
  injectMemo,
  injectAtomGetters,
  injectSelf,
} from '@zedux/atoms'
import {
  useAtomValue,
  useAtomContext,
  useAtomInstance,
  AtomProvider,
} from '@zedux/react'
import React, {
  createContext,
  use as reactUse,
  useContext,
  Suspense,
  Context,
} from 'react'

const use = reactUse as <T>(context: Context<T>) => T

interface User {
  name: string
}

const fetchUser = () =>
  new Promise<User>(resolve =>
    setTimeout(() => resolve({ name: 'Test User' }), 2000)
  )

const userAtom = atom('user', () => api(fetchUser()))

const userNameCapsAtom = atom('userNameCaps', () => {
  const { ecosystem } = injectAtomGetters()

  const name = injectMemo(() => use(userContext)?.name, [])

  return name?.toUpperCase()
})

function injectReactContext<T>(context: Context<T>) {
  const { id } = injectSelf()

  return injectMemo(() => {
    const value = use(context)

    if (value == null) {
      throw new Error(
        `context was not provided during initial evaluation of atom "${id}"`
      )
    }

    return value
  }, [])
}

const userNameAtom = atom(
  'userName',
  () => injectReactContext(userContext).name
)

const loadedUserDataAtom = ion('loadedUserData', ({ get }) => {
  const userData = get(userAtom)

  if (!userData) {
    throw new Error('tried accessing loaded user data before it was loaded')
  }

  return userData
})

const userContext = createContext(undefined as undefined | User)
const getUserName = ({ get }: AtomGetters) => get(loadedUserDataAtom).data?.name

// interface AuthContext {
//   userInstance: AtomInstanceType<typeof userAtom>
// }

// interface RouteContext {
//   path
// }

const useUserFromZedux = () => {
  const userData = useAtomValue(useAtomContext(userAtom, true)).data

  if (!userData) throw new Error('user not provided')

  return userData
}

const useUserFromReact = () => {
  const userData = useContext(userContext)

  if (!userData) throw new Error('user not provided')

  return userData
}

function UserName() {
  const userName = useAtomValue(userNameAtom)

  return userName == null ? null : <span>{userName}</span>
}

function AuthedApp() {
  const userFromZedux = useUserFromZedux()
  const userFromReact = useUserFromReact()

  return (
    <div>
      The Authed App! {userFromZedux.name} {userFromReact.name} <UserName />
    </div>
  )
}

function AuthGate() {
  const userInstance = useAtomInstance(userAtom)

  return (
    <AtomProvider instance={userInstance}>
      <userContext.Provider value={userInstance.get().data}>
        <AuthedApp />
      </userContext.Provider>
    </AtomProvider>
  )
}

export function App() {
  return (
    <Suspense fallback={<div>Loading User Data</div>}>
      <AuthGate />
    </Suspense>
  )
}
