import React from 'react'

export const useStableReference: {
  <T extends any[]>(arr: T): T
  <T extends any[]>(arr?: T): T | undefined
} = (arr?: any[]) => {
  const react = require('react') as typeof React // eslint-disable-line @typescript-eslint/no-var-requires
  const prevArr = react.useRef(arr)

  return react.useMemo(() => {
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
