import { EvaluationTargetType, EvaluationType } from '../types'
import { diContext } from '../utils/csContexts'

export const injectInvalidate = () => {
  const { instance } = diContext.consume()

  return () => {
    instance._scheduleEvaluation({
      operation: 'injectInvalidate',
      targetType: EvaluationTargetType.Injector,
      type: EvaluationType.CacheInvalidated,
    })
  }
}
