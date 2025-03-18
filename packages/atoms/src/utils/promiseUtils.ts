import { PromiseState } from '../types/index'

export const getErrorPromiseState = <T>(error: unknown): PromiseState<T> => ({
  error: (error as Error | undefined)?.stack
    ? (error as Error)
    : new Error(error?.toString()),
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

export const getSuccessPromiseState = <T>(data: T) =>
  ({
    data,
    isError: false,
    isLoading: false,
    isSuccess: true,
    status: 'success',
  } satisfies PromiseState<T>)
