import { act } from '@testing-library/react'
import { createEcosystem } from '@zedux/react'

export const ecosystem = createEcosystem()

let idCounter = 0

export const generateIdMock = jest.fn(function generateIdMock(
  this: typeof ecosystem._idGenerator,
  prefix: string
) {
  return `${prefix}-${idCounter++}`
})

ecosystem._idGenerator.generateId = generateIdMock.bind(ecosystem._idGenerator)

afterAll(() => ecosystem.destroy())

afterEach(() => {
  act(() => {
    ecosystem.reset()
  })
})
