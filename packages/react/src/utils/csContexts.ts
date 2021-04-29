import { createCallStackContext } from './callStackContext'
import { DiContext } from './types'

export const ecosystemCsContext = createCallStackContext<{
  ecosystemId: string
}>()

export const diContext = createCallStackContext<DiContext>()
