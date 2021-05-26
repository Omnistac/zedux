import { useMemo, useRef } from 'react'

export const useStableReference: {
  <T extends any[]>(arr: T): T
  <T extends any[]>(arr?: T): T | undefined
} = (arr?: any[]) => {
  const prevArr = useRef(arr)

  return useMemo(() => {
    if (arr === prevArr.current) return prevArr.current

    if (!arr || !prevArr.current) return arr

    if (
      arr.length !== prevArr.current.length ||
      arr.some((el, i) => prevArr.current?.[i] !== el)
    ) {
      prevArr.current = arr
      return arr
    }

    return prevArr.current
  }, [arr])
}
