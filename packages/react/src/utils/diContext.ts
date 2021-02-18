import { createCallStackContext } from './callStackContext'
import { DiContext } from './types'

export const diContext = createCallStackContext<DiContext>({
  appId: 'global',
  atom: {} as any,
  dependencies: {},
  injectors: [],
  isInitializing: true,
  scheduleEvaluation: () => {},
})
