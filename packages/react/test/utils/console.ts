const cleanups: (() => void)[] = []

export const mockConsole = <K extends keyof typeof console>(
  key: K,
  callback?: (...args: any[]) => any
) => {
  const original = console[key]
  const mock = (console[key] = jest.fn(callback))

  cleanups.push(() => (console[key] = original))

  return mock
}

afterEach(() => {
  cleanups.forEach(cleanup => cleanup())
})
