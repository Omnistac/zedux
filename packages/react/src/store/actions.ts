import { createActorFactory } from '@zedux/core'
import { Ecosystem } from '../classes/Ecosystem'

const createActor = createActorFactory('@@react-zedux', 'global')
export const addEcosystem = createActor<Ecosystem>('addEcosystem')

export const removeEcosystem = createActor<{
  ecosystemId: string
}>('removeEcosystem')

export const wipe = createActor('wipe')
