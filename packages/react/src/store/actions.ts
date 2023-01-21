import { actionFactory } from '@zedux/core'
import { Ecosystem } from '../classes/Ecosystem'

export const addEcosystem = actionFactory<Ecosystem>(
  '@@zedux/react/addEcosystem'
)

export const removeEcosystem = actionFactory<{
  ecosystemId: string
}>('removeEcosystem')

export const wipe = actionFactory('wipe')
