import React, { useId } from 'react'
import styled from '@site/src/ssc'
import {
  api,
  atom,
  injectEffect,
  injectRef,
  injectStore,
  MutableRefObject,
  useAtomInstance,
} from '../../../packages/react/src'

interface Edge {
  from: [number, number]
  to: [number, number]
  progress: number
}

interface Node {
  anchor: [number, number]
  direction: number
  id: number
  position: [number, number]
  radius: number
  velocity: number
}

const SPACING = 100

const Canvas = styled.canvas`
  grid-column: 1;
  grid-row: 1 / span 4;
  height: 100%;
  max-height: calc(80vh - 60px);
  opacity: 0.3;
  width: 100%;
`

const getTarget = (nodes: Node[][], [x, y]: [number, number]) => {
  const possibleNodes = [
    x > 0 && [x - 1, y],
    x < nodes[0].length - 1 && [x + 1, y],
    y > 0 && [x, y - 1],
    y < nodes.length - 1 && [x, y + 1],
  ].filter(Boolean) as [number, number][]

  return possibleNodes[Math.floor(Math.random() * possibleNodes.length)]
}

// const translatePosition = (
//   delta: number,
//   [x, y]: [number, number],
//   direction: number,
//   velocity: number
// ) => {
//   const distance = velocity * delta

//   return [
//     x + distance * Math.sin(direction),
//     y + distance * Math.cos(direction),
//   ] as [number, number]
// }

const graphAnimation = atom(
  'graphAnimation',
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  (id: string) => {
    const canvasRef: MutableRefObject<HTMLCanvasElement> = injectRef<HTMLCanvasElement>()
    const cleanupRef = injectRef<() => void>()
    const idCounterRef = injectRef(0)
    const store = injectStore<{
      edges: Edge[]
      lastFrameTime: number
      nodes: Node[][]
      timeSinceLastEdgeDraw: number
    }>(
      {
        edges: [],
        lastFrameTime: 0,
        nodes: [],
        timeSinceLastEdgeDraw: 0,
      },
      { subscribe: false }
    )

    const maybeGenerateGraph = () => {
      const { height, width } = canvasRef.current
      const currentNodes = store.getState().nodes
      const numRows = Math.floor((height + SPACING) / SPACING)
      const numCols = Math.floor((width + SPACING) / SPACING)

      if (
        (currentNodes.length &&
          currentNodes.length === numRows &&
          currentNodes[0].length === numCols) ||
        !height ||
        !width
      ) {
        return
      }

      const nodes: Node[][] = Array.from({ length: numRows }, (_, i) =>
        Array.from({ length: numCols }, (_, j) => ({
          direction: 0,
          id: idCounterRef.current++,
          anchor: [j * SPACING + SPACING / 2, i * SPACING + SPACING / 2],
          position: [0, 0],
          radius: 16,
          velocity: 0.01,
        }))
      )

      const edges: Edge[] = Array.from({ length: 9 }).map(() => {
        const initialFrom = [
          Math.floor(Math.random() * nodes[0].length),
          Math.floor(Math.random() * nodes.length),
        ] as [number, number]

        return {
          from: initialFrom,
          progress: 0,
          to: getTarget(nodes, initialFrom),
        }
      })

      store.setStateDeep({ edges, nodes })
    }

    const moveEdges = (delta: number) => {
      const { edges, nodes } = store.getState()

      const newEdges = edges.map((edge: Edge) => {
        let newProgress = edge.progress + delta / 4000
        let newFrom = edge.from
        let newTo = edge.to

        if (newProgress > 1) {
          newProgress = 0
          newFrom = edge.to
          newTo = getTarget(nodes, edge.to)
        }

        return {
          from: newFrom,
          progress: newProgress,
          to: newTo,
        }
      })

      store.setStateDeep({ edges: newEdges })
    }

    const moveNodes = () => {
      store.setStateDeep(state => ({
        nodes: state.nodes.map((row, i) =>
          row.map((node, j) => ({
            ...node,
            position: [
              node.anchor[0] +
                Math.sin(state.lastFrameTime / 4000 + i * 200) * 10,
              node.anchor[1] +
                Math.sin(state.lastFrameTime / 4000 + j * 400) * 10,
            ],
          }))
        ),
      }))
    }

    const render = () => {
      const { edges, lastFrameTime, nodes } = store.getState()
      const ctx = canvasRef.current.getContext('2d')
      const { height, width } = canvasRef.current
      ctx.clearRect(0, 0, width, height)
      ctx.lineCap = 'round'
      ctx.lineWidth = 2
      ctx.strokeStyle = `#dffffd`
      const rotationOffset = Math.sin(lastFrameTime / 3000)

      edges.forEach((edge: Edge) => {
        const [fromX, fromY] = nodes[edge.from[1]][edge.from[0]].position
        const [toX, toY] = nodes[edge.to[1]][edge.to[0]].position
        const xDiff = toX - fromX
        const yDiff = toY - fromY
        const x1 =
          edge.progress < 0.4
            ? fromX
            : fromX + (xDiff * (edge.progress - 0.4)) / 0.6
        const y1 =
          edge.progress < 0.4
            ? fromY
            : fromY + (yDiff * (edge.progress - 0.4)) / 0.6
        const x2 = fromX + xDiff * Math.min(1, edge.progress * 1.4)
        const y2 = fromY + yDiff * Math.min(1, edge.progress * 1.4)
        ctx.beginPath()
        ctx.moveTo(x1, y1)
        ctx.lineTo(x2, y2)
        // ctx.moveTo(edge.from[0], edge.from[1])
        // ctx.lineTo(edge.to[0], edge.to[1])
        ctx.stroke()
      })

      ctx.lineWidth = 1

      nodes.forEach(row =>
        row.forEach((node: Node) => {
          const [x, y] = node.position

          ctx.beginPath()
          ctx.ellipse(
            x,
            y,
            node.radius,
            node.radius / 4,
            rotationOffset,
            0,
            2 * Math.PI
          )
          ctx.stroke()

          ctx.beginPath()
          ctx.ellipse(
            x,
            y,
            node.radius,
            node.radius / 4,
            (2 * Math.PI) / 3 + rotationOffset,
            0,
            2 * Math.PI
          )
          ctx.stroke()

          ctx.beginPath()
          ctx.ellipse(
            x,
            y,
            node.radius,
            node.radius / 4,
            Math.PI / 3 + rotationOffset,
            0,
            2 * Math.PI
          )
          ctx.stroke()
        })
      )
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

        const lastFrameTime = store.getState().lastFrameTime
        const delta = lastFrameTime ? time - lastFrameTime : 0

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
      maybeGenerateGraph()
      moveNodes()
      moveEdges(delta)
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
