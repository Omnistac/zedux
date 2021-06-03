import { createCallStackContext } from './callStackContext'
import { DiContext } from './types'

export const diContext = createCallStackContext<DiContext>()
