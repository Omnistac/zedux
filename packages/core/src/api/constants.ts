const PREFIX = '@@zedux/'

export const internalTypes = {
  delegate: `${PREFIX}delegate`,
  hydrate: `${PREFIX}hydrate`,
  // for use with atoms in the @zedux/react package:
  ignore: `${PREFIX}ignore`,
  inherit: `${PREFIX}inherit`,
  merge: `${PREFIX}merge`,
  prime: `${PREFIX}prime`,
}
