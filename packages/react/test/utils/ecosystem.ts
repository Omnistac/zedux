import { act } from '@testing-library/react'
import {
  createEcosystem,
  GraphEdge,
  GraphNode,
  SelectorInstance,
} from '@zedux/atoms'

export const ecosystem = createEcosystem({ id: 'test' })

export const generateIdMock = jest.fn(function generateIdMock(prefix: string) {
  return `${prefix}-${this.idCounter++}`
})

export const getEdges = (map: Map<GraphNode, GraphEdge>) =>
  Object.fromEntries([...map].map(([node, edge]) => [node.id, edge]))

export const getNodes = () =>
  Object.fromEntries(
    [...ecosystem.n.entries()].map(([id, node]) => [
      id,
      {
        className: node.constructor.name,
        observers: getEdges(node.o),
        sources: getEdges(node.s),
        state: node.get(),
        status: node.status,
        weight: node.W,
      },
    ])
  )

export const getSelectorNodes = () =>
  Object.fromEntries(
    Object.entries(getNodes()).filter(
      ([, { className }]) => className === SelectorInstance.name
    )
  )

ecosystem._idGenerator.generateId = generateIdMock

afterEach(() => {
  ecosystem._idGenerator.idCounter = 0

  act(() => {
    ecosystem.reset({
      context: null,
      hydration: true,
      listeners: true,
      overrides: true,
    })
  })
})

export const snapshotNodes = () => {
  expect(getNodes()).toMatchSnapshot()
}

export const snapshotSelectorNodes = () => {
  expect(getSelectorNodes()).toMatchSnapshot()
}
