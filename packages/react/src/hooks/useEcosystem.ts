import React from 'react'
import { ecosystemContext } from '../classes'
import { getEcosystem } from '../store/public-api'

export const useEcosystem = () => {
  const react = require('react') as typeof React // eslint-disable-line @typescript-eslint/no-var-requires
  return getEcosystem(react.useContext(ecosystemContext))
}
