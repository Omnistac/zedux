import { Store } from '@zedux/core'
import { AtomStateType } from '@zedux/react'
import { RefObject, useLayoutEffect } from 'react'
import { graph, maxPan, minPan, minZoom, size } from '../atom'

const getMaxPan = (zoomPercent: number) => {
  return (1 - zoomPercent) * (maxPan + minPan) - minPan
}

export const usePositioning = (
  store: Store<AtomStateType<typeof graph>>,
  svgRef: RefObject<SVGSVGElement>
) => {
  const getRect = (): Pick<
    ReturnType<SVGSVGElement['getBoundingClientRect']>,
    'height' | 'width' | 'x' | 'y'
  > => {
    if (!svgRef.current) {
      return { height: 0, width: 0, x: 0, y: 0 }
    }

    return svgRef.current.getBoundingClientRect()
  }

  useLayoutEffect(() => {
    let coords: {
      startX: number
      startY: number
      x: number
      y: number
    } | null = null
    const move = ({ clientX, clientY }: MouseEvent) => {
      store.setStateDeep(state => {
        if (!coords) return state

        const { height, width } = getRect()
        const zoomPercent = state.zoom / size

        return {
          offsetX: Math.max(
            minPan,
            Math.min(
              getMaxPan(zoomPercent),
              coords.startX -
                ((clientX - coords.x) / width) * size * zoomPercent
            )
          ),
          offsetY: Math.max(
            minPan,
            Math.min(
              getMaxPan(zoomPercent),
              coords.startY -
                ((clientY - coords.y) / height) * size * zoomPercent
            )
          ),
        }
      })
    }

    const startDrag = ({ clientX, clientY, ...rest }: MouseEvent) => {
      console.log('drag start buttons..', rest)
      const { offsetX, offsetY } = store.getState()
      coords = {
        startX: offsetX,
        startY: offsetY,
        x: clientX,
        y: clientY,
      }
    }

    const stopDrag = () => {
      coords = null
    }

    const wheelListener = (event: WheelEvent) => {
      event.preventDefault()
      const { clientX, clientY, deltaY } = event
      if (deltaY === 0) return

      const direction = deltaY / Math.abs(deltaY)
      let amount = 0
      let isAtZoomLimit = false

      store.setStateDeep(({ zoom }) => {
        amount = deltaY * 0.003 * zoom
        isAtZoomLimit =
          (zoom === size && direction === 1) ||
          (zoom === minZoom && direction === -1)

        return {
          zoom: Math.round(Math.min(size, Math.max(minZoom, zoom + amount))),
        }
      })

      if (isAtZoomLimit) return

      const { height, width, x, y } = getRect()
      const percentX = (clientX - x) / width
      const percentY = (clientY - y) / height

      store.setStateDeep(({ offsetX, offsetY, zoom }) => {
        const maxPan = getMaxPan(zoom / size)

        return {
          offsetX: Math.max(
            minPan,
            Math.min(maxPan, offsetX + percentX * -amount)
          ),
          offsetY: Math.max(
            minPan,
            Math.min(maxPan, offsetY + percentY * -amount)
          ),
        }
      })
    }

    svgRef.current?.addEventListener('mousedown', startDrag)
    document.addEventListener('mousemove', move)
    document.addEventListener('mouseup', stopDrag)
    svgRef.current?.addEventListener('wheel', wheelListener)

    return () => {
      svgRef.current?.removeEventListener('mousedown', startDrag)
      document.removeEventListener('mousemove', move)
      document.removeEventListener('mouseup', stopDrag)
      svgRef.current?.removeEventListener('wheel', wheelListener)
    }
  }, [])
}
