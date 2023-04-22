import { readInstance } from '../classes/EvaluationStack'

export const injectInvalidate = () => {
  const instance = readInstance()

  return () => instance.invalidate('injectInvalidate', 'Injector')
}
