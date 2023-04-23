const PREFIX = '@@zedux/'

export const zeduxTypes = {
  batch: `${PREFIX}batch`,
  delegate: `${PREFIX}delegate`,
  hydrate: `${PREFIX}hydrate`,
  ignore: `${PREFIX}ignore`, // for use with atoms in the @zedux/atoms package
  inherit: `${PREFIX}inherit`,
  merge: `${PREFIX}merge`,
  prime: `${PREFIX}prime`,
}
