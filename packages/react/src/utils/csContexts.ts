import { createCallStackContext } from './callStackContext'
import { DiContext } from './types'

export const appCsContext = createCallStackContext<{ appId: string }>()

export const diContext = createCallStackContext<DiContext>()
