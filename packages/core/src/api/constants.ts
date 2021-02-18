const PREFIX = '@@zedux/'

export const actionTypes = {
  HYDRATE: `${PREFIX}hydrate`,
  PARTIAL_HYDRATE: `${PREFIX}partialHydrate`,
  RECALCULATE: `${PREFIX}recalculate`,
}

export const effectTypes = {
  SUBSCRIBER_ADDED: `${PREFIX}subscriberAdded`,
  SUBSCRIBER_REMOVED: `${PREFIX}subscriberRemoved`,
}

export const metaTypes = {
  DELEGATE: `${PREFIX}delegate`,
  INHERIT: `${PREFIX}inherit`,
}
