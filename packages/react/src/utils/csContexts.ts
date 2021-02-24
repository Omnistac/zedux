import { createCallStackContext } from './callStackContext'
import { DiContext } from './types'

export const appCsContext = createCallStackContext<{ appId: string }>({
  appId: 'global',
})

export const diContext = createCallStackContext<DiContext>({
  appId: 'global',
  atom: {} as any,
  dependencies: {},
  injectors: [],
  isInitializing: true,
  scheduleEvaluation: () => {},
})
