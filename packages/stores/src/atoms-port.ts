// This file contains lots of code and types duplicated from the `@zedux/atoms`
// package. This is the best way to get them in the `tsc` build without breaking
// type compatibility with the external `@zedux/atoms` package. That breakage
// happens when we give TS a `@zedux/atoms` `paths` alias and let it pull in
// duplicated classes e.g. in `dist/esm/atoms/classes/...`
import type { PromiseState } from '@zedux/atoms'

export type InjectorDescriptor<T = any> = {
  /**
   * `c`leanup - tracks cleanup functions, e.g. those returned from
   * `injectEffect` callbacks.
   */
  c: (() => void) | undefined

  /**
   * `t`ype - a unique injector name string. This is how we ensure the user
   * didn't add, remove, or reorder injector calls in the state factory.
   */
  t: string

  /**
   * `v`alue - can be anything. For `injectRef`, this is the ref object. For
   * `injectMemo` and `injectEffect`, this keeps track of the memoized value
   * and/or dependency arrays.
   */
  v: T
}

export const prefix = '@@zedux'

/**
 * IMPORTANT! Keep these in sync with `@zedux/atoms/utils/general.ts`
 */
export const Invalidate = 1
export const Cycle = 2
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
