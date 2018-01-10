const PREFIX = '@@zedux/'


export const actionTypes = {
  HYDRATE: `${PREFIX}hydrate`,
  PARTIAL_HYDRATE: `${PREFIX}partialHydrate`,
  RECALCULATE: `${PREFIX}recalculate`
}


export const metaTypes = {
  DELEGATE: `${PREFIX}delegate`,
  INHERIT: `${PREFIX}inherit`,
  SKIP_PROCESSORS: `${PREFIX}skipProcessors`,
  SKIP_REDUCERS: `${PREFIX}skipReducers`
}
