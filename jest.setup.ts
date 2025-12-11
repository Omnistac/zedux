import '@testing-library/jest-dom'

let callstacks: Record<string, string> = {}
let prevIds: string[] = []
let useIdMode: 'react19' | 'react18' = 'react19'

afterEach(() => {
  callstacks = {}
  prevIds = []
  useIdMode = 'react19'
})

const react = jest.requireActual('react')

const generateId = () => {
  if (useIdMode === 'react19') return react.useId()

  const id1 = react.useId()
  const id2 = react.useId()

  if (prevIds.includes(id1)) return id2

  prevIds.push(id1)

  return id1
}

jest.mock('react', () => ({
  ...react,
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
;(globalThis as any).useReact18UseId = () => {
  useIdMode = 'react18'
}
