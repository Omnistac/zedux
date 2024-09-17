import { act } from '@testing-library/react'
import { AtomInstance, createEcosystem } from '@zedux/atoms'

export const ecosystem = createEcosystem({ id: 'test' })

let idCounter = 0

export const generateIdMock = jest.fn(
  (prefix: string) => `${prefix}-${idCounter++}`
)

export const getNodes = () =>
  Object.fromEntries(
    [...ecosystem.n.entries()].map(([id, { e, ...node }]) => {
      e // remove this circular reference from node

      if ((node as AtomInstance).store) {
        const store = { ...(node as AtomInstance).store }
        delete store._scheduler
        delete (node as AtomInstance)._injectors
        delete (node as AtomInstance)._nextInjectors
        ;(node as AtomInstance).store = store
      }

      return [id, node]
    })
  )

export const getSelectorNodes = () =>
  Object.fromEntries(
    Object.entries(ecosystem.findAll('@@selector')).map(
      ([id, { e, ...node }]) => {
        e // remove this circular reference from node

        return [id, node]
      }
    )
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

export const snapshotNodes = () => {
  expect(getNodes()).toMatchSnapshot()
}

export const snapshotSelectorNodes = () => {
  expect(getSelectorNodes()).toMatchSnapshot()
}
