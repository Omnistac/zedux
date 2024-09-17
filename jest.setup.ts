import '@testing-library/jest-dom/extend-expect'

let callstacks: Record<string, string> = {}
let id = 0

afterEach(() => {
  callstacks = {}
  id = 0
})

const generateId = () => {
  const stack =
    (new Error().stack || '')
      .split('\n')
      .find(line => /\.test\.tsx:/.test(line)) || ''

  return (callstacks[stack] ||= `:r${id++}:`)
}

jest.mock('react', () => ({
  ...jest.requireActual('react'),
  useId: generateId,
}))

// React's `useId` gives new ids in the same callstack when a component tree is
// destroyed/unmounted. Call this to manually force ids to be recreated in tests
// to mimic React's behavior.
;(globalThis as any).clearUseIdEntry = (idNum: number) => {
  const key = Object.keys(callstacks).find(
    key => callstacks[key] === `:r${idNum}:`
  )

  if (key) {
    delete callstacks[key]
  }
}
