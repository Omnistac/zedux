import { act } from '@testing-library/react'
import { createEcosystem } from '@zedux/react'

export const ecosystem = createEcosystem({ id: 'test' })

let idCounter = 0

export const generateIdMock = jest.fn(
  (prefix: string) => `${prefix}-${idCounter++}`
)

const now = 123456789

export const nowMock = jest.fn((highRes?: boolean) =>
  highRes ? performance.now() : now
)

ecosystem._idGenerator.generateId = generateIdMock
ecosystem._idGenerator.now = nowMock

afterAll(() => ecosystem.destroy())

afterEach(() => {
  idCounter = 0

  act(() => {
    ecosystem.reset()
    ecosystem.setOverrides([])
  })
})
