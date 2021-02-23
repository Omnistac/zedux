import { EvaluationTargetType, EvaluationType } from '../utils'
import { diContext } from '../utils/diContext'

export const injectInvalidate = () => {
  const { scheduleEvaluation } = diContext.consume()

  return () => {
    scheduleEvaluation({
      operation: 'injectInvalidate()',
      targetType: EvaluationTargetType.Injector,
      type: EvaluationType.CacheInvalidated,
    })
  }
}
