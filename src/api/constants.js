const PREFIX = '@@zedux/'


export const actionTypes = {
  HYDRATE: `${PREFIX}hydrate`,
  PARTIAL_HYDRATE: `${PREFIX}partialHydrate`,
  RECALCULATE: `${PREFIX}recalculate`
}


export const effectTypes = {
  DISPATCH: `${PREFIX}dispatch`
}


export const metaTypes = {
  DELEGATE: `${PREFIX}delegate`,
  INHERIT: `${PREFIX}inherit`,
  SKIP_EFFECTS: `${PREFIX}skipEffects`,
  SKIP_REDUCERS: `${PREFIX}skipReducers`
}
