import React, { useId } from 'react'
import styled from 'styled-components'
import { Store } from '../../../packages/core/src'
import {
  api,
  atom,
  injectEffect,
  injectRef,
  injectStore,
  MutableRefObject,
  useAtomInstance,
} from '../../../packages/react/src'

interface Node {
  direction: number
  id: number
  size: number
  position: [number, number]
  radius: number
  velocity: number
}

const CONNECTION_DISTANCE = 100
const EDGE_DRAW_INTERVAL = 4000
const ENTRANCE_DURATION = 500
const MAX_NODES = 16
const NODE_SPAWN_RATE = 600 // spawn a node on average every NODE_SPAWN_RATE ms

const Canvas = styled.canvas`
  grid-column: 1;
  grid-row: 1 / span 4;
  height: 100%;
  max-height: calc(80vh - 60px);
  opacity: 0.2;
  width: 100%;
`

const translatePosition = (
  delta: number,
  [x, y]: [number, number],
  direction: number,
  velocity: number
) => {
  const distance = velocity * delta

  return [
    x + distance * Math.sin(direction),
    y + distance * Math.cos(direction),
  ] as [number, number]
}

const graphAnimation = atom(
  'graphAnimation',
  (id: string) => {
    const canvasRef: MutableRefObject<HTMLCanvasElement> = injectRef<HTMLCanvasElement>()
    const cleanupRef = injectRef<() => void>()
    const idCounterRef = injectRef(0)
    const store: Store<{
      edges: [number, number][]
      lastFrameTime: number
      nodes: Record<string, Node>
      timeSinceLastEdgeDraw: number
    }> = injectStore(
      {
        edges: [],
        lastFrameTime: 0,
        nodes: {},
        timeSinceLastEdgeDraw: 0,
      },
      { subscribe: false }
    )

    const drawEdges = () => {
      const { nodes } = store.getState()
      const keys = Object.keys(nodes)
      const edges = []

      for (let i = 0; i < keys.length; i++) {
        for (let j = i + 1; j < keys.length; j++) {
          const a = nodes[keys[i]]
          const b = nodes[keys[j]]

          if (
            Math.abs(a.position[0] - b.position[0]) < CONNECTION_DISTANCE &&
            Math.abs(a.position[1] - b.position[1]) < CONNECTION_DISTANCE
          ) {
            edges.push([a.id, b.id])
          }
        }
      }

      store.setStateDeep({ edges })
    }

    const maybeUpdateEdges = (delta: number) => {
      const timeSinceLastEdgeDraw =
        store.getState().timeSinceLastEdgeDraw + delta

      if (timeSinceLastEdgeDraw < EDGE_DRAW_INTERVAL) {
        store.setStateDeep({ timeSinceLastEdgeDraw })
        return
      }

      store.setStateDeep({ timeSinceLastEdgeDraw: 0 })
      drawEdges()
    }

    const maybeSpawnNode = (delta: number) => {
      const isSpawning = delta / NODE_SPAWN_RATE > Math.random()

      if (
        !isSpawning ||
        Object.keys(store.getState().nodes).length >= MAX_NODES
      ) {
        return
      }

      const newNode: Node = {
        direction: Math.random() * (2 * Math.PI),
        id: idCounterRef.current++,
        position: [
          Math.random() * canvasRef.current.width,
          Math.random() * canvasRef.current.height,
        ],
        radius: Math.random() * 16 + 8,
        size: 0,
        velocity: Math.random() * 0.02 + 0.005,
      }

      store.setStateDeep(state => ({
        nodes: { ...state.nodes, [newNode.id]: newNode },
      }))
    }

    const moveNodes = (delta: number) => {
      const nodes = { ...store.getState().nodes }

      Object.values(nodes).forEach(node => {
        const newNode = { ...node }
        newNode.position = translatePosition(
          delta,
          node.position,
          node.direction,
          node.velocity
        )

        if (newNode.size < 1) {
          newNode.size = Math.min(1, newNode.size + delta / ENTRANCE_DURATION)
        }

        nodes[node.id] = newNode
      })

      store.setStateDeep({ nodes })
    }

    const removeNodes = () => {
      const nodes = { ...store.getState().nodes }

      Object.values(nodes).forEach(node => {
        const [x, y] = node.position
        const r = node.radius

        if (
          x + r < 0 ||
          y + r < 0 ||
          x - r > canvasRef.current.width ||
          y - r > canvasRef.current.height
        ) {
          delete nodes[node.id]
        }
      })

      store.setState(state => ({ ...state, nodes }))
    }

    const render = () => {
      const { edges, lastFrameTime, nodes } = store.getState()
      const ctx = canvasRef.current.getContext('2d')
      const { height, width } = canvasRef.current
      ctx.clearRect(0, 0, width, height)
      ctx.lineCap = 'round'
      ctx.lineWidth = 2
      ctx.strokeStyle = '#fff'
      ctx.fillStyle = '#0004'
      const rotationOffset = Math.sin(lastFrameTime / 1500)

      Object.values(nodes).forEach(node => {
        ctx.beginPath()
        ctx.ellipse(
          node.position[0],
          node.position[1],
          node.radius * node.size,
          (node.radius / 4) * node.size,
          rotationOffset,
          0,
          2 * Math.PI
        )
        ctx.stroke()

        ctx.beginPath()
        ctx.ellipse(
          node.position[0],
          node.position[1],
          node.radius * node.size,
          (node.radius / 4) * node.size,
          (2 * Math.PI) / 3 + rotationOffset,
          0,
          2 * Math.PI
        )
        ctx.stroke()

        ctx.beginPath()
        ctx.ellipse(
          node.position[0],
          node.position[1],
          node.radius * node.size,
          (node.radius / 4) * node.size,
          Math.PI / 3 + rotationOffset,
          0,
          2 * Math.PI
        )
        ctx.stroke()
      })

      ctx.lineWidth = 4
      ctx.strokeStyle = '#fff4'

      edges.forEach(([id1, id2]) => {
        const node1 = nodes[id1]
        const node2 = nodes[id2]

        if (!node1 || !node2) return

        const [x1, y1] = node1.position
        const [x2, y2] = node2.position

        ctx.beginPath()
        ctx.moveTo(x1, y1)
        ctx.lineTo(x2, y2)
        ctx.stroke()
      })

      Array.from(
        { length: 4 },
        (_, i) =>
          ((lastFrameTime / (i < 2 ? 60 : 30)) % width) - width * (i % 2)
      ).forEach(xOffset => {
        ctx.beginPath()
        ctx.moveTo(xOffset, height * 0.8)
        ctx.bezierCurveTo(
          xOffset + width / 2,
          height / 2,
          xOffset + width / 2,
          height * 1.1,
          xOffset + width,
          height * 0.8
        )
        ctx.lineTo(xOffset + width, height)
        ctx.lineTo(xOffset, height)
        ctx.closePath()
        ctx.fill()
      })

      ctx.fillStyle = '#fff4'

      Array.from(
        { length: 4 },
        (_, i) =>
          ((lastFrameTime / (i < 2 ? 40 : 20)) % width) - width * (i % 2)
      ).forEach(xOffset => {
        ctx.beginPath()
        ctx.moveTo(xOffset, height * 0.2)
        ctx.bezierCurveTo(
          xOffset + width / 2,
          height / 2,
          xOffset + width / 2,
          height * -0.1,
          xOffset + width,
          height * 0.2
        )
        ctx.lineTo(xOffset + width, 0)
        ctx.lineTo(xOffset, 0)
        ctx.closePath()
        ctx.fill()
      })
    }

    const start = (canvas: HTMLCanvasElement) => {
      if (!canvas) return

      canvasRef.current = canvas

      // make canvas size dynamic
      canvas.height = canvas.clientHeight
      canvas.width = canvas.clientWidth

      const observer = new ResizeObserver(() => {
        canvas.height = canvas.clientHeight
        canvas.width = canvas.clientWidth
      })

      observer.observe(canvas)

      // set up game loop
      let handle: number

      const callback: FrameRequestCallback = time => {
        if (!canvasRef.current) return

        const delta = time - store.getState().lastFrameTime

        update(delta)
        render()

        store.setStateDeep({ lastFrameTime: time })
        handle = requestAnimationFrame(callback)
      }

      handle = requestAnimationFrame(callback)

      cleanupRef.current = () => {
        cancelAnimationFrame(handle)
        observer.disconnect()
      }
    }

    const update = (delta: number) => {
      maybeSpawnNode(delta)
      moveNodes(delta)
      removeNodes()
      maybeUpdateEdges(delta)
    }

    injectEffect(() => {
      return () => cleanupRef.current?.()
    })

    return api().setExports({ start })
  },
  { ttl: 0 }
)

export const GraphAnimation = () => {
  const { start } = useAtomInstance(graphAnimation, [useId()]).exports

  return <Canvas ref={ref => start(ref)} />
}
