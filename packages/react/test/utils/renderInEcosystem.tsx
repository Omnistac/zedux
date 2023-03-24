import { render } from '@testing-library/react'
import { Ecosystem, EcosystemProvider } from '@zedux/react'
import React from 'react'

export const renderInEcosystem = (
  children: JSX.Element,
  ecosystem?: Ecosystem
) =>
  render(
    <EcosystemProvider ecosystem={ecosystem}>{children}</EcosystemProvider>
  )
