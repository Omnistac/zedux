import { globalStore, wipe as wipeAction } from './store'

export * from '@zedux/core'
export * from './components'
export * from './factories'
export * from './hooks'
export * from './injectors'
export * from './types'

export const wipe = () => globalStore.dispatch(wipeAction())
