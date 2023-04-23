import { PromiseState } from '../types/index'

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
