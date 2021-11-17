import { CallStackContext, CallStackContextInstance } from './types'

const stack: CallStackContextInstance[] = []

export const createCallStackContext = <T = any>() => {
  const consume = (throwError = true) => {
    const instance: CallStackContextInstance<T> | undefined = stack.find(
      item => item.context === context
    )

    if (!instance && throwError) {
      throw new Error('Zedux: Injectors can only be used in instance factories')
    }

    return instance?.value || null
  }

  const provide = <R = any>(value: T, callback: () => R) => {
    stack.unshift({ context, value })
    const ret = callback()
    stack.shift()

    return ret
  }

  const context: CallStackContext<T> = { consume: consume as any, provide }

  return context
}
