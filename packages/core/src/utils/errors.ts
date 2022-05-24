import { DEV, noop } from './general'

export const assertAreFunctions = DEV
  ? (args: any[], method: string) => {
      for (const arg of args) {
        if (typeof arg !== 'function') {
          throw new TypeError(
            `Zedux: ${method} - Expected argument to be a function. Received ${typeof arg}`
          )
        }
      }
    }
  : noop
