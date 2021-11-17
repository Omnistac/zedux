import { api, atom, injectStore } from '@zedux/react'
import { GridNum, Size } from '../types'

const initialState = {
  col: 1 as GridNum,
  row: 1 as GridNum,
  size: 4 as Size,
}

export const positionAtom = atom('position', () => {
  const store = injectStore(initialState)

  return api(store).setExports({
    setCol: (col: GridNum) => store.setStateDeep({ col }),
    setRow: (row: GridNum) => store.setStateDeep({ row }),
    setSize: (size: Size) => store.setStateDeep({ size }),
  })
})
