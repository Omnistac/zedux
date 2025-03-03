import { getScheduler, setScheduler } from './utils/scheduler'

export * from './api/actionFactory'
export * from './api/createReducer'
export * from './api/createStore'
export * from './api/detailedTypeof'
export * from './api/is'
export * from './api/isPlainObject'
export * from './api/meta'
export * from './api/zeduxTypes'
export * from './types'

export const getStoreInternals = () => ({ s: getScheduler })
export const setStoreInternals = ({
  s,
}: {
  s: ReturnType<typeof getScheduler>
}) => setScheduler(s)
