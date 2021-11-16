import { MachineState } from '../types'
import { detailedTypeof, noop } from './general'

export const assertAreFunctions = DEV
  ? (args: any[], method: string) => {
      for (const arg of args) {
        if (typeof arg !== 'function') {
          throw new TypeError(
            `Zedux Error - ${method} - Expected argument to be a function. Received ${typeof arg}`
          )
        }
      }
    }
  : noop

export const assertIsValidState = DEV
  ? (state: MachineState) => {
      if (
        state &&
        typeof state === 'object' &&
        typeof state.type === 'string'
      ) {
        return
      }

      throw new TypeError(
        `Zedux Error - state.on() - Target state must be either a string or MachineState object. Received ${detailedTypeof(
          state
        )}`
      )
    }
  : noop
