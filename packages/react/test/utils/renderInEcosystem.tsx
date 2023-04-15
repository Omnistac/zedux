import { render } from '@testing-library/react'
import { Ecosystem, EcosystemProvider } from '@zedux/react'
import React from 'react'
import { ecosystem } from './ecosystem'

export const renderInEcosystem = (
  children: JSX.Element,
  theEcosystem: Ecosystem = ecosystem
) =>
  render(
    <EcosystemProvider ecosystem={theEcosystem}>{children}</EcosystemProvider>
  )
