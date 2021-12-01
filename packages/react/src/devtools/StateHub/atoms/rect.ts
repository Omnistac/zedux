import { api, atom, injectRef, injectStore } from '@zedux/react'
import { RectType } from '../types'

const getHeightType = (height: number) => {
  return height < 350
    ? RectType.Xs
    : height < 500
    ? RectType.Sm
    : height < 650
    ? RectType.Md
    : height < 800
    ? RectType.Lg
    : RectType.Xl
}

const getWidthType = (width: number) => {
  return width < 400
    ? RectType.Xs
    : width < 550
    ? RectType.Sm
    : width < 700
    ? RectType.Md
    : width < 850
    ? RectType.Lg
    : RectType.Xl
}

export const rect = atom('rect', () => {
  const positioneeRef = injectRef<HTMLDivElement>(null)

  const recalculate = () => {
    if (!positioneeRef.current) return

    store.setState({
      height: getHeightType(positioneeRef.current.clientHeight),
      width: getWidthType(positioneeRef.current.clientWidth),
    })
  }

  const store = injectStore({
    height: getHeightType(positioneeRef.current?.clientHeight || 0),
    width: getWidthType(positioneeRef.current?.clientWidth || 0),
  })

  return api(store).setExports({
    positioneeRef,
    recalculate,
  })
})
