import { render } from '@testing-library/react'
import { EcosystemProvider } from '@zedux/react'
import React from 'react'

export const renderInEcosystem = (children: JSX.Element) =>
  render(<EcosystemProvider>{children}</EcosystemProvider>)
