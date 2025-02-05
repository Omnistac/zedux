import '@testing-library/jest-dom/extend-expect'

let callstacks: Record<string, string> = {}
let id = 0
let prevIds: string[] = []
let useIdMode: 'overridden' | 'react19' | 'react18' = 'overridden'

afterEach(() => {
  callstacks = {}
  id = 0
  prevIds = []
  useIdMode = 'overridden'
})

const react = jest.requireActual('react')

const generateId = () => {
  if (useIdMode === 'react19') return react.useId()

  if (useIdMode === 'react18') {
    const id1 = react.useId()
    const id2 = react.useId()

    if (prevIds.includes(id1)) return id2

    prevIds.push(id1)

    return id1
  }

  const stack =
    (new Error().stack || '')
      .split('\n')
      .find(line => /\.test\.tsx:/.test(line)) || ''

  return (callstacks[stack] ||= `:r${id++}:`)
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
;(globalThis as any).useReact19UseId = () => {
  useIdMode = 'react19'
}
;(globalThis as any).useReact18UseId = () => {
  useIdMode = 'react18'
}
