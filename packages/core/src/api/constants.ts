const PREFIX = '@@zedux/'

export const actionTypes = {
  HYDRATE: `${PREFIX}hydrate`,
  PARTIAL_HYDRATE: `${PREFIX}partialHydrate`,
  RECALCULATE: `${PREFIX}recalculate`,
}

export const metaTypes = {
  DELEGATE: `${PREFIX}delegate`,
  INHERIT: `${PREFIX}inherit`,
  // for use with atoms in the @zedux/react package:
  SKIP_EVALUATION: `${PREFIX}skipEvaluation`,
}
