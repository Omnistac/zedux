import {
  Reactable,
  MachineStateRepresentation,
  ZeduxMachineState,
} from '../types'
import { extractActionType, extractStateType } from '../utils/actor'

const method = 'createState()'

export const createState = <Type extends string = string>(stateType: Type) => {
  const transitions: Record<string, string> = {}

  const is = (str: string) => str === stateType

  const on = (actor: Reactable, targetState: MachineStateRepresentation) => {
    const actionType = extractActionType(actor, method)

    transitions[actionType] = extractStateType(targetState)

    return state
  }

  const state: ZeduxMachineState<Type> = {
    is,
    on,
    transitions,
    type: stateType,
  }

  return state
}

// I cannot believe I figured this out:
type MapToMachineState<T extends string[]> = T extends [string, ...infer Rest]
  ? Rest extends string[]
    ? [ZeduxMachineState<T[0]>, ...MapToMachineState<Rest>]
    : never
  : []

export const states = <T extends string[]>(
  ...stateTypes: [...T]
): MapToMachineState<T> => {
  const states = stateTypes.map(stateType => createState(stateType))
  return states as any
}
