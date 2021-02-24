interface CallStackContext<T = any> {
  consume: () => T
  provide: <R = any>(value: T, callback: () => R) => R
}

interface CallStackContextInstance<T = any> {
  context: CallStackContext<T>
  value: T
}

const stack: CallStackContextInstance[] = []

export const createCallStackContext = <T = any>(defaults: T) => {
  const consume = (useDefaults = true) => {
    const instance: CallStackContextInstance<T> = stack.find(
      item => item.context === context
    )

    return instance?.value ?? (useDefaults ? defaults : null)
  }

  const provide = <R = any>(value: T, callback: () => R) => {
    stack.unshift({ context, value })
    const ret = callback()
    stack.shift()

    return ret
  }

  const context = { consume, provide }

  return context
}
