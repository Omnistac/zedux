import { atom } from '@zedux/react'

export const nodeSize = 240
export const size = 2400
export const zoomIncrement = size / 10
export const maxPan = size - zoomIncrement / 2
export const maxZoom = size - zoomIncrement
export const minPan = -(zoomIncrement / 2)
export const minZoom = size / 100
export const nodeRadius = 50

export const graph = atom('graph', () => ({
  offsetX: size / 4,
  offsetY: size / 4,
  zoom: size / 2,
}))
