// This file contains lots of code and types duplicated from the `@zedux/atoms`
// package. This is the best way to get them in the `tsc` build without breaking
// type compatibility with the external `@zedux/atoms` package. That breakage
// happens when we give TS a `@zedux/atoms` `paths` alias and let it pull in
// duplicated classes e.g. in `dist/esm/atoms/classes/...`
import { PromiseState } from '@zedux/atoms'

export type InjectorDescriptor<T = any> = T extends undefined
  ? {
      cleanup?: () => void
      result?: T
      type: string
    }
  : {
      cleanup?: () => void
      result: T
      type: string
    }

export const prefix = '@@zedux'

/**
 * IMPORTANT! Keep these in sync with `@zedux/atoms/utils/general.ts`
 */
export const Invalidate = 1
export const Destroy = 2
export const PromiseChange = 3
export const EventSent = 4

export const getErrorPromiseState = <T>(error: Error): PromiseState<T> => ({
  error,
  isError: true,
  isLoading: false,
  isSuccess: false,
  status: 'error',
})

export const getInitialPromiseState = <T>(data?: T): PromiseState<T> => ({
  data,
  isError: false,
  isLoading: true,
  isSuccess: false,
  status: 'loading' as const,
})

export const getSuccessPromiseState = <T>(data: T): PromiseState<T> => ({
  data,
  isError: false,
  isLoading: false,
  isSuccess: true,
  status: 'success',
})
